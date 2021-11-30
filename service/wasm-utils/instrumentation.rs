use crate::utils::*;
use walrus::ir::*;
use walrus::*;

struct InjectionPoint {
    position: usize,
    cost: i64,
}
impl InjectionPoint {
    fn new() -> Self {
        InjectionPoint {
            position: 0,
            cost: 0,
        }
    }
}

struct Variables {
    total_counter: GlobalId,
    log_size: GlobalId,
    is_init: GlobalId,
}

pub fn instrument(m: &mut Module) {
    // TODO put counter in stable memory so that we can profile upgrades.
    let total_counter = m
        .globals
        .add_local(ValType::I64, true, InitExpr::Value(Value::I64(0)));
    let log_size = m
        .globals
        .add_local(ValType::I32, true, InitExpr::Value(Value::I32(0)));
    let is_init = m
        .globals
        .add_local(ValType::I32, true, InitExpr::Value(Value::I32(1)));
    let vars = Variables {
        total_counter,
        log_size,
        is_init,
    };
    for (_, func) in m.funcs.iter_local_mut() {
        inject_metering(func, func.entry_block(), &vars);
    }
    let printer = inject_printer(m, &vars);
    for (id, func) in m.funcs.iter_local_mut() {
        if id != printer {
            inject_profiling_prints(printer, id, func);
        }
    }
    //inject_start(m, vars.is_init);
    inject_init(m, vars.is_init);
    inject_canister_methods(m, &vars);
    inject_stable_getter(m, &vars);
    inject_getter(m, &vars);
}

fn inject_metering(func: &mut LocalFunction, start: InstrSeqId, vars: &Variables) {
    let mut stack = vec![start];
    while let Some(seq_id) = stack.pop() {
        let seq = func.block(seq_id);
        // Finding injection points
        let mut injection_points = vec![];
        let mut curr = InjectionPoint::new();
        for (pos, (instr, _)) in seq.instrs.iter().enumerate() {
            curr.position = pos;
            match instr {
                Instr::Block(Block { seq }) | Instr::Loop(Loop { seq }) => {
                    match func.block(*seq).ty {
                        InstrSeqType::Simple(Some(_)) => curr.cost += 1,
                        InstrSeqType::Simple(None) => (),
                        InstrSeqType::MultiValue(_) => unreachable!("Multivalue not supported"),
                    }
                    stack.push(*seq);
                    injection_points.push(curr);
                    curr = InjectionPoint::new();
                }
                Instr::IfElse(IfElse {
                    consequent,
                    alternative,
                }) => {
                    curr.cost += 1;
                    stack.push(*consequent);
                    stack.push(*alternative);
                    injection_points.push(curr);
                    curr = InjectionPoint::new();
                }
                Instr::Br(_) | Instr::BrIf(_) | Instr::BrTable(_) => {
                    // br always points to a block, so we don't need to push the br block to stack for traversal
                    curr.cost += 1;
                    injection_points.push(curr);
                    curr = InjectionPoint::new();
                }
                Instr::Return(_) | Instr::Unreachable(_) => {
                    curr.cost += 1;
                    injection_points.push(curr);
                    curr = InjectionPoint::new();
                }
                _ => {
                    curr.cost += 1;
                }
            }
        }
        injection_points.push(curr);
        // Reconstruct instructions
        let injection_points = injection_points.iter().filter(|point| point.cost > 0);
        let mut builder = func.builder_mut().instr_seq(seq_id);
        let original = builder.instrs_mut();
        let mut instrs = vec![];
        let mut last_injection_position = 0;
        for point in injection_points {
            instrs.extend_from_slice(&original[last_injection_position..point.position]);
            // injection happens one instruction before the injection_points, so the cost contains
            // the control flow instruction.
            #[rustfmt::skip]
            instrs.extend_from_slice(&[
                (GlobalGet { global: vars.total_counter }.into(), Default::default()),
                (Const { value: Value::I64(point.cost) }.into(), Default::default()),
                (Binop { op: BinaryOp::I64Add }.into(), Default::default()),
                (GlobalSet { global: vars.total_counter }.into(), Default::default()),
            ]);
            last_injection_position = point.position;
        }
        instrs.extend_from_slice(&original[last_injection_position..]);
        *original = instrs;
    }
}

fn inject_profiling_prints(printer: FunctionId, id: FunctionId, func: &mut LocalFunction) {
    #[rustfmt::skip]
    let end_instrs = &[
        // TODO fix when id == 0
        (Const { value: Value::I32(-(id.index() as i32)) }.into(), Default::default()),
        (Call { func: printer }.into(), Default::default()),
    ];
    let start = func.entry_block();
    let mut stack = vec![start];
    while let Some(seq_id) = stack.pop() {
        let mut builder = func.builder_mut().instr_seq(seq_id);
        let original = builder.instrs_mut();
        let mut instrs = vec![];
        if seq_id == start {
            #[rustfmt::skip]
            instrs.extend_from_slice(&[
                // Note this is the OLD func id. We need the old name section to interpret the name.
                (Const { value: Value::I32(id.index() as i32) }.into(), Default::default()),
                (Call { func: printer }.into(), Default::default()),
            ]);
        }
        for (instr, loc) in original.iter() {
            match instr {
                Instr::Block(Block { seq }) | Instr::Loop(Loop { seq }) => stack.push(*seq),
                Instr::IfElse(IfElse {
                    consequent,
                    alternative,
                }) => {
                    stack.push(*alternative);
                    stack.push(*consequent);
                }
                Instr::Return(_) => instrs.extend_from_slice(end_instrs),
                _ => (),
            }
            instrs.push((instr.clone(), *loc));
        }
        if seq_id == start {
            instrs.extend_from_slice(end_instrs);
        }
        *original = instrs;
    }
}

fn inject_printer(m: &mut Module, vars: &Variables) -> FunctionId {
    let writer = get_ic_func_id(m, "stable_write");
    let memory = get_memory_id(m);
    let mut builder = FunctionBuilder::new(&mut m.types, &[ValType::I32], &[]);
    let func_id = m.locals.add(ValType::I32);
    builder.func_body().global_get(vars.is_init).if_else(
        None,
        |then| {
            then.return_();
        },
        |else_| {
            // TODO restore memory
            #[rustfmt::skip]
            else_
                .i32_const(0)
                .local_get(func_id)
                .store(memory, StoreKind::I32 { atomic: false }, MemArg { offset: 0, align: 4 })
                .i32_const(4)
                .global_get(vars.total_counter)
                .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 })
                .global_get(vars.log_size)
                .i32_const(12)
                .binop(BinaryOp::I32Mul)
                .i32_const(0)
                .i32_const(12)
                .call(writer)
                .global_get(vars.log_size)
                .i32_const(1)
                .binop(BinaryOp::I32Add)
                .global_set(vars.log_size);
        },
    );
    builder.finish(vec![func_id], &mut m.funcs)
}
fn inject_start(m: &mut Module, is_init: GlobalId) {
    if let Some(id) = m.start {
        let mut builder = get_builder(m, id);
        #[rustfmt::skip]
        builder
            .instr(Const { value: Value::I32(0) })
            .instr(GlobalSet { global: is_init });
    }
}

fn inject_canister_methods(m: &mut Module, vars: &Variables) {
    let methods: Vec<_> = m
        .exports
        .iter()
        .filter_map(|e| match e.item {
            ExportItem::Function(id) if e.name.starts_with("canister_update") => Some(id),
            _ => None,
        })
        .collect();
    for id in methods.iter() {
        let mut builder = get_builder(m, *id);
        #[rustfmt::skip]
        inject_top(
            &mut builder,
            vec![
                Const { value: Value::I32(0) }.into(),
                GlobalSet { global: vars.log_size }.into(),
            ],
        );
    }
}
fn inject_init(m: &mut Module, is_init: GlobalId) {
    let grow = get_ic_func_id(m, "stable_grow");
    match get_export_func_id(m, "canister_init") {
        Some(id) => {
            let mut builder = get_builder(m, id);
            // Not sure why adding stabe_grow at the top caused IDL decoding error
            /*#[rustfmt::skip]
            inject_top(
                builder,
                vec![
                    Const { value: Value::I32(1) }.into(),
                    Call { func: grow }.into(),
                    Drop {}.into(),
                ],
            );*/
            builder
                .i32_const(1)
                .call(grow)
                .drop()
                .i32_const(0)
                .global_set(is_init);
        }
        None => {
            let mut builder = FunctionBuilder::new(&mut m.types, &[], &[]);
            builder
                .func_body()
                .i32_const(1)
                .call(grow)
                .drop()
                .i32_const(0)
                .global_set(is_init);
            builder.finish(vec![], &mut m.funcs);
        }
    }
}
fn inject_stable_getter(m: &mut Module, vars: &Variables) {
    let leb = make_leb128_encoder(m);
    let memory = get_memory_id(m);
    let reply_data = get_ic_func_id(m, "msg_reply_data_append");
    let reply = get_ic_func_id(m, "msg_reply");
    let reader = get_ic_func_id(m, "stable_read");
    let mut builder = FunctionBuilder::new(&mut m.types, &[], &[]);
    builder.name("__get_profiling".to_string());
    #[rustfmt::skip]
    builder.func_body()
        .i32_const(0)
        // vec { record { int32; int64 } }
        .i64_const(0x6c016d024c444944) // "DIDL026d016c"
        .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 })
        .i32_const(8)
        .i64_const(0x0000017401750002)  // "02007501740100xx"
        .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 })
        .i32_const(0)
        .i32_const(15)
        .call(reply_data)
        .global_get(vars.log_size)
        .call(leb)
        .i32_const(0)
        .i32_const(5)
        .call(reply_data)
        .i32_const(0)
        .i32_const(0)
        .global_get(vars.log_size)
        .i32_const(12)
        .binop(BinaryOp::I32Mul)
        .call(reader)
        .i32_const(0)
        .global_get(vars.log_size)
        .i32_const(12)
        .binop(BinaryOp::I32Mul)
        .call(reply_data)
        .call(reply);
    let getter = builder.finish(vec![], &mut m.funcs);
    m.exports.add("canister_query __get_profiling", getter);
}
// Generate i32 to 5-byte LEB128 encoding at memory address 0..5
fn make_leb128_encoder(m: &mut Module) -> FunctionId {
    let memory = get_memory_id(m);
    let mut builder = FunctionBuilder::new(&mut m.types, &[ValType::I32], &[]);
    let value = m.locals.add(ValType::I32);
    let mut instrs = builder.func_body();
    #[rustfmt::skip]
    for i in 0..5 {
        instrs
            .i32_const(i)
            .local_get(value)
            .i32_const(0x7f)
            .binop(BinaryOp::I32And);
        if i < 4 {
            instrs.i32_const(0x80).binop(BinaryOp::I32Or);
        }
        instrs
            .store(memory, StoreKind::I32_8 { atomic: false }, MemArg { offset: 0, align: 1 })
            .local_get(value)
            .i32_const(7)
            .binop(BinaryOp::I32ShrU)
            .local_set(value);
    }
    builder.finish(vec![value], &mut m.funcs)
}
fn inject_getter(m: &mut Module, vars: &Variables) {
    let memory = get_memory_id(m);
    let reply_data = get_ic_func_id(m, "msg_reply_data_append");
    let reply = get_ic_func_id(m, "msg_reply");
    let mut getter = FunctionBuilder::new(&mut m.types, &[], &[]);
    getter.name("__get_cycles".to_string());
    #[rustfmt::skip]
    getter
        .func_body()
        // It's a query call, so we can arbitrarily change the memory without restoring them afterwards.
        .i32_const(0)
        .i64_const(0x747402004c444944)  // "DIDL00027474" in little endian
        .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 })
        .i32_const(8)
        .global_get(vars.total_counter)
        .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 })
        .i32_const(16)
        .global_get(vars.total_counter)
        .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 })
        .i32_const(0)
        .i32_const(8 * 3)
        .call(reply_data)
        .call(reply);
    let getter = getter.finish(vec![], &mut m.funcs);
    m.exports.add("canister_query __get_cycles", getter);
}
