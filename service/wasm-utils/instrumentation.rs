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
            inject_profiling_prints(&m.types, printer, id, func);
        }
    }
    //inject_start(m, vars.is_init);
    inject_init(m, vars.is_init);
    inject_canister_methods(m, &vars);
    let leb = make_leb128_encoder(m);
    make_stable_getter(m, &vars, leb);
    make_getter(m, &vars);
    let name = make_name_section(m);
    //m.customs.add(name);
    make_name_getter(m, name.data, leb);
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

fn inject_profiling_prints(
    types: &ModuleTypes,
    printer: FunctionId,
    id: FunctionId,
    func: &mut LocalFunction,
) {
    // Put the original function body inside a block, so that if the code
    // use br_if/br_table to exit the function, we can still output the exit signal.
    let start_id = func.entry_block();
    let original_block = func.block_mut(start_id);
    let start_instrs = original_block.instrs.split_off(0);
    let start_ty = match original_block.ty {
        InstrSeqType::MultiValue(id) => {
            let valtypes = types.results(id);
            InstrSeqType::Simple(match valtypes.len() {
                0 => None,
                1 => Some(valtypes[0]),
                _ => unreachable!("Multivalue return not supported"),
            })
        }
        // top-level block is using the function signature
        InstrSeqType::Simple(_) => unreachable!(),
    };
    let mut inner_start = func.builder_mut().dangling_instr_seq(start_ty);
    *(inner_start.instrs_mut()) = start_instrs;
    let inner_start_id = inner_start.id();
    drop(inner_start);
    let mut start_builder = func.builder_mut().func_body();
    start_builder
        .i32_const(id.index() as i32)
        .call(printer)
        .instr(Block {
            seq: inner_start_id,
        })
        // TOOD fix when id == 0
        .i32_const(-(id.index() as i32))
        .call(printer);

    let mut stack = vec![inner_start_id];
    while let Some(seq_id) = stack.pop() {
        let mut builder = func.builder_mut().instr_seq(seq_id);
        let original = builder.instrs_mut();
        let mut instrs = vec![];
        for (instr, loc) in original.iter() {
            match instr {
                Instr::Block(Block { seq }) | Instr::Loop(Loop { seq }) => {
                    stack.push(*seq);
                    instrs.push((instr.clone(), *loc));
                }
                Instr::IfElse(IfElse {
                    consequent,
                    alternative,
                }) => {
                    stack.push(*alternative);
                    stack.push(*consequent);
                    instrs.push((instr.clone(), *loc));
                }
                Instr::Return(_) => {
                    instrs.push((
                        Instr::Br(Br {
                            block: inner_start_id,
                        }),
                        *loc,
                    ));
                }
                // redirect br,br_if,br_table to inner seq id
                Instr::Br(Br { block }) if *block == start_id => {
                    instrs.push((
                        Instr::Br(Br {
                            block: inner_start_id,
                        }),
                        *loc,
                    ));
                }
                Instr::BrIf(BrIf { block }) if *block == start_id => {
                    instrs.push((
                        Instr::BrIf(BrIf {
                            block: inner_start_id,
                        }),
                        *loc,
                    ));
                }
                Instr::BrTable(BrTable { blocks, default }) => {
                    let mut blocks = blocks.clone();
                    for i in 0..blocks.len() {
                        if let Some(id) = blocks.get_mut(i) {
                            if *id == start_id {
                                *id = inner_start_id
                            };
                        }
                    }
                    let default = if *default == start_id {
                        inner_start_id
                    } else {
                        *default
                    };
                    instrs.push((Instr::BrTable(BrTable { blocks, default }), *loc));
                }
                _ => instrs.push((instr.clone(), *loc)),
            }
        }
        *original = instrs;
    }
}

fn inject_printer(m: &mut Module, vars: &Variables) -> FunctionId {
    let writer = get_ic_func_id(m, "stable_write");
    let memory = get_memory_id(m);
    let mut builder = FunctionBuilder::new(&mut m.types, &[ValType::I32], &[]);
    let func_id = m.locals.add(ValType::I32);
    let a = m.locals.add(ValType::I32);
    let b = m.locals.add(ValType::I64);
    builder.func_body().global_get(vars.is_init).if_else(
        None,
        |then| {
            then.return_();
        },
        |else_| {
            #[rustfmt::skip]
            else_
                // backup memory
                .i32_const(0)
                .load(memory, LoadKind::I32 { atomic: false }, MemArg { offset: 0, align: 4})
                .local_set(a)
                .i32_const(4)
                .load(memory, LoadKind::I64 { atomic: false }, MemArg { offset: 0, align: 8})
                .local_set(b)
                // print
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
                // update counter
                .global_get(vars.log_size)
                .i32_const(1)
                .binop(BinaryOp::I32Add)
                .global_set(vars.log_size)
                // restore memory
                .i32_const(0)
                .local_get(a)
                .store(memory, StoreKind::I32 { atomic: false }, MemArg { offset: 0, align: 4 })
                .i32_const(4)
                .local_get(b)
                .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 });
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
            ExportItem::Function(id)
                if e.name.starts_with("canister_update")
                    || e.name.starts_with("canister_query") =>
            {
                Some(id)
            }
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
            // canister_init in Motoko use stable_size to decide if there is stable memory to deserialize
            // If we call stable.grow at the beginning, it breaks this check.
            /*#[rustfmt::skip]
            inject_top(
                &mut builder,
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
            let id = builder.finish(vec![], &mut m.funcs);
            m.exports.add("canister_init", id);
        }
    }
}
fn make_stable_getter(m: &mut Module, vars: &Variables, leb: FunctionId) {
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
    for i in 0..5 {
        instrs
            .i32_const(i)
            .local_get(value)
            .i32_const(0x7f)
            .binop(BinaryOp::I32And);
        if i < 4 {
            instrs.i32_const(0x80).binop(BinaryOp::I32Or);
        }
        #[rustfmt::skip]
        instrs
            .store(memory, StoreKind::I32_8 { atomic: false }, MemArg { offset: 0, align: 1 })
            .local_get(value)
            .i32_const(7)
            .binop(BinaryOp::I32ShrU)
            .local_set(value);
    }
    builder.finish(vec![value], &mut m.funcs)
}
fn make_name_section(m: &Module) -> RawCustomSection {
    use ic_cdk::export::candid::Encode;
    let name: Vec<_> = m
        .funcs
        .iter()
        .filter_map(|f| {
            if matches!(f.kind, FunctionKind::Local(_)) {
                Some((f.id().index() as u16, f.name.as_ref()?))
            } else {
                None
            }
        })
        .collect();
    let data = Encode!(&name).unwrap();
    RawCustomSection {
        name: "icp:public name".to_string(),
        data,
    }
}
fn make_name_getter(m: &mut Module, data: Vec<u8>, leb: FunctionId) {
    let len = data.len() as i32;
    if len == 0 || len >= 65526 {
        return;
    }
    let memory = get_memory_id(m);
    //let data_id = m.data.add(DataKind::Passive, data);
    let data_start = 10;
    m.data.add(
        DataKind::Active(ActiveData {
            memory,
            location: ActiveDataLocation::Absolute(data_start),
        }),
        data,
    );
    let reply_data = get_ic_func_id(m, "msg_reply_data_append");
    let reply = get_ic_func_id(m, "msg_reply");
    let mut getter = FunctionBuilder::new(&mut m.types, &[], &[]);
    getter.name("__get_names".to_string());
    #[rustfmt::skip]
    getter.func_body()
        .i32_const(0)
        .i64_const(0x017b6d014c444944) // "DIDL016d7b01"
        .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 })
        .i32_const(8)
        .i32_const(0)
        .store(memory, StoreKind::I32_8 { atomic: false }, MemArg { offset: 0, align: 1 })
        .i32_const(0)
        .i32_const(9)
        .call(reply_data)
        .i32_const(len)
        .call(leb)
        .i32_const(0)
        .i32_const(5)
        .call(reply_data)
        .i32_const(data_start as i32)
        .i32_const(len)
        .call(reply_data)
        .call(reply);
    let getter = getter.finish(vec![], &mut m.funcs);
    m.exports.add("canister_query __get_names", getter);
}
fn make_getter(m: &mut Module, vars: &Variables) {
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
        .i64_const(0x007401004c444944)  // "DIDL000174xx" in little endian
        .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 })
        .i32_const(7)
        .global_get(vars.total_counter)
        .store(memory, StoreKind::I64 { atomic: false }, MemArg { offset: 0, align: 8 })
        .i32_const(0)
        .i32_const(15)
        .call(reply_data)
        .call(reply);
    let getter = getter.finish(vec![], &mut m.funcs);
    m.exports.add("canister_query __get_cycles", getter);
}
