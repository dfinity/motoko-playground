use crate::utils::*;
use walrus::ir::*;
use walrus::*;

struct InjectionPoint {
    position: usize,
    cost: i64,
    is_gc: bool,
}
impl InjectionPoint {
    fn new() -> Self {
        InjectionPoint {
            position: 0,
            cost: 0,
            is_gc: false,
        }
    }
}

struct Variables {
    total_counter: GlobalId,
    gc_counter: GlobalId,
    gc_func: FunctionId,
    gc_local_var: LocalId,
}

pub fn instrument(m: &mut Module) {
    // TODO put counter in stable memory so that we can profile upgrades.
    let total_counter = m
        .globals
        .add_local(ValType::I64, true, InitExpr::Value(Value::I64(0)));
    let gc_counter = m
        .globals
        .add_local(ValType::I64, true, InitExpr::Value(Value::I64(0)));
    let gc_func = m.funcs.by_name("schedule_copying_gc").unwrap();
    let gc_local_var = m.locals.add(ValType::I64);
    let vars = Variables {
        total_counter,
        gc_counter,
        gc_func,
        gc_local_var,
    };
    for (_, func) in m.funcs.iter_local_mut() {
        inject_metering(func, func.entry_block(), &vars);
    }
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
                Instr::Call(Call { func }) => {
                    curr.cost += 1;
                    if *func == vars.gc_func {
                        curr.is_gc = true;
                        injection_points.push(curr);
                        curr = InjectionPoint::new();
                    }
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
            #[rustfmt::skip]
            if point.is_gc {
                instrs.extend_from_slice(&[
                    (GlobalGet { global: vars.total_counter }.into(), Default::default()),
                    (LocalSet { local: vars.gc_local_var }.into(), Default::default()),
                    original[point.position].clone(),
                    (GlobalGet { global: vars.total_counter }.into(), Default::default()),
                    (LocalGet { local: vars.gc_local_var }.into(), Default::default()),
                    (Binop { op: BinaryOp::I64Sub }.into(), Default::default()),
                    (GlobalGet { global: vars.gc_counter }.into(), Default::default()),
                    (Binop { op: BinaryOp::I64Add }.into(), Default::default()),
                    (GlobalSet { global: vars.gc_counter }.into(), Default::default()),
                ]);
                last_injection_position = point.position + 1;
            } else {
                // injection happens one instruction before the injection_points, so the cost contains
                // the control flow instruction.
                instrs.extend_from_slice(&[
                    (GlobalGet { global: vars.total_counter }.into(), Default::default()),
                    (Const { value: Value::I64(point.cost) }.into(), Default::default()),
                    (Binop { op: BinaryOp::I64Add }.into(), Default::default()),
                    (GlobalSet { global: vars.total_counter }.into(), Default::default()),
                ]);
                last_injection_position = point.position;
            };
        }
        instrs.extend_from_slice(&original[last_injection_position..]);
        *original = instrs;
    }
}

fn inject_getter(m: &mut Module, vars: &Variables) {
    let memory = get_memory_id(m);
    let reply_data = get_ic_func_id(m, "msg_reply_data_append");
    let reply = get_ic_func_id(m, "msg_reply");
    // Motoko reserves the first 64k memory as runtime stack. Here we use the top of the stack to construct reply message.
    // TODO restore stack data or use a new memory page
    m.data.add(
        DataKind::Active(ActiveData {
            memory,
            location: ActiveDataLocation::Absolute(0),
        }),
        b"DIDL\x00\x02\x74\x74".to_vec(),
    );
    let mut getter = FunctionBuilder::new(&mut m.types, &[], &[]);
    getter.name("__get_cycles".to_string());
    #[rustfmt::skip]
    getter
        .func_body()
        .i32_const(8)
        .global_get(vars.total_counter)
        .store(
            memory,
            StoreKind::I64 { atomic: false },
            MemArg { offset: 0, align: 8 },
        )
        .i32_const(16)
        .global_get(vars.gc_counter)
        .store(
            memory,
            StoreKind::I64 { atomic: false },
            MemArg { offset: 0, align: 8 },
        )
        .i32_const(0)
        .i32_const(8 * 3)
        .call(reply_data)
        .call(reply);
    let getter = getter.finish(vec![], &mut m.funcs);
    m.exports.add("canister_query __get_cycles", getter);
}
