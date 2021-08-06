use walrus::*;

pub fn replace_cycles_add_with_drop(m: &mut Module) {
    if let Some(id) = m.imports.find("ic0", "call_cycles_add") {
        if let ImportKind::Function(func_id) = m.imports.get(id).kind {
            replace_calls_with_drop(m, func_id);
        }
        m.imports.delete(id);
    }
}

fn replace_calls_with_drop(m: &mut Module, func_id: FunctionId) {
    struct Replacer(FunctionId);
    impl ir::VisitorMut for Replacer {
        fn visit_instr_mut(&mut self, instr: &mut ir::Instr, _instr_loc: &mut ir::InstrLocId) {
            if let ir::Instr::Call(walrus::ir::Call { func }) = instr {
                if *func == self.0 {
                    *instr = ir::Drop {}.into();
                }
            }
        }
    }
    m.funcs.iter_local_mut().for_each(|(_, func)| {
        let entry = func.entry_block();
        ir::dfs_pre_order_mut(&mut Replacer(func_id), func, entry);
    });
}
