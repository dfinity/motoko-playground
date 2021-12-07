use crate::utils::*;
use walrus::ir::*;
use walrus::*;

pub fn replace_cycles_add_with_drop(m: &mut Module) {
    if let Some(id) = m.imports.find("ic0", "call_cycles_add") {
        if let ImportKind::Function(func_id) = m.imports.get(id).kind {
            replace_calls_with_drop(m, func_id);
        }
        m.imports.delete(id);
    }
}
pub fn limit_stable_memory_page(m: &mut Module, limit: u32) {
    if let Some(id) = m.imports.find("ic0", "stable_grow") {
        if let ImportKind::Function(old_grow) = m.imports.get(id).kind {
            let new_grow = make_grow_func(m, limit as i32);
            struct Replacer {
                old_grow: FunctionId,
                new_grow: FunctionId,
            }
            impl VisitorMut for Replacer {
                fn visit_call_mut(&mut self, call: &mut Call) {
                    if call.func == self.old_grow {
                        *call = Call {
                            func: self.new_grow,
                        };
                    }
                }
            }
            m.funcs.iter_local_mut().for_each(|(_, func)| {
                dfs_pre_order_mut(
                    &mut Replacer { old_grow, new_grow },
                    func,
                    func.entry_block(),
                );
            });
        }
    }
}

fn replace_calls_with_drop(m: &mut Module, func_id: FunctionId) {
    struct Replacer(FunctionId);
    impl VisitorMut for Replacer {
        fn visit_instr_mut(&mut self, instr: &mut Instr, _instr_loc: &mut InstrLocId) {
            if let Instr::Call(walrus::ir::Call { func }) = instr {
                if *func == self.0 {
                    *instr = ir::Drop {}.into();
                }
            }
        }
    }
    m.funcs.iter_local_mut().for_each(|(_, func)| {
        let entry = func.entry_block();
        dfs_pre_order_mut(&mut Replacer(func_id), func, entry);
    });
}

fn make_grow_func(m: &mut Module, limit: i32) -> FunctionId {
    let size = get_ic_func_id(m, "stable_size");
    let grow = get_ic_func_id(m, "stable_grow");
    let mut builder = FunctionBuilder::new(&mut m.types, &[ValType::I32], &[ValType::I32]);
    let requested = m.locals.add(ValType::I32);
    builder
        .func_body()
        .call(size)
        .local_get(requested)
        .binop(BinaryOp::I32Add)
        .i32_const(limit)
        .binop(BinaryOp::I32GtU)
        .if_else(
            Some(ValType::I32),
            |then| {
                then.i32_const(-1);
            },
            |else_| {
                else_.local_get(requested).call(grow);
            },
        );
    builder.finish(vec![requested], &mut m.funcs)
}
