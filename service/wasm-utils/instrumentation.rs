use crate::utils::*;
use walrus::ir::*;
use walrus::*;

pub fn instrument(m: &mut Module) {
    // TODO put counter in stable memory so that we can profile upgrades.
    let cycle_counter = m
        .globals
        .add_local(ValType::I64, true, InitExpr::Value(Value::I64(0)));
    for (_, func) in m.funcs.iter_local_mut() {
        inject_metering(func, func.entry_block(), cycle_counter);
    }
    inject_getter(m, cycle_counter);
}

struct InjectionPoint {
    position: usize,
    cost: i64,
}

fn inject_metering(func: &mut LocalFunction, start: InstrSeqId, counter: GlobalId) {
    let mut stack = vec![start];
    while let Some(seq_id) = stack.pop() {
        let seq = func.block(seq_id);
        // Finding injection points
        let mut injection_points = vec![];
        let mut curr = InjectionPoint {
            position: 0,
            cost: 0,
        };
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
                    curr = InjectionPoint {
                        position: pos,
                        cost: 0,
                    };
                }
                Instr::IfElse(IfElse {
                    consequent,
                    alternative,
                }) => {
                    curr.cost += 1;
                    stack.push(*consequent);
                    stack.push(*alternative);
                    injection_points.push(curr);
                    curr = InjectionPoint {
                        position: pos,
                        cost: 0,
                    };
                }
                Instr::Br(_) | Instr::BrIf(_) | Instr::BrTable(_) => {
                    // br always points to a block, so we don't need to push the br block to stack for traversal
                    curr.cost += 1;
                    injection_points.push(curr);
                    curr = InjectionPoint {
                        position: pos,
                        cost: 0,
                    };
                }
                Instr::Return(_) | Instr::Unreachable(_) => {
                    curr.cost += 1;
                    injection_points.push(curr);
                    curr = InjectionPoint {
                        position: pos,
                        cost: 0,
                    };
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
            // injection happens one instruction before the injection_points, so the cost contains
            // the control flow instruction.
            instrs.extend_from_slice(&original[last_injection_position..point.position]);
            instrs.extend_from_slice(&[
                (GlobalGet { global: counter }.into(), Default::default()),
                (
                    Const {
                        value: Value::I64(point.cost),
                    }
                    .into(),
                    Default::default(),
                ),
                (
                    Binop {
                        op: BinaryOp::I64Add,
                    }
                    .into(),
                    Default::default(),
                ),
                (GlobalSet { global: counter }.into(), Default::default()),
            ]);
            last_injection_position = point.position;
        }
        instrs.extend_from_slice(&original[last_injection_position..]);
        *original = instrs;
    }
}

fn inject_getter(m: &mut Module, counter: GlobalId) {
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
        b"DIDL\x00\x01\x74".to_vec(),
    );
    let mut getter = FunctionBuilder::new(&mut m.types, &[], &[]);
    getter.name("__get_cycles".to_string());
    getter
        .func_body()
        .i32_const(7)
        .global_get(counter)
        .store(
            memory,
            StoreKind::I64 { atomic: false },
            MemArg {
                offset: 0,
                align: 8,
            },
        )
        .i32_const(0)
        .i32_const(15)
        .call(reply_data)
        .call(reply);
    let getter = getter.finish(vec![], &mut m.funcs);
    m.exports.add("canister_query __get_cycles", getter);
}
