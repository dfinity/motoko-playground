use serde_bytes::ByteBuf;

#[ic_cdk_macros::query]
fn transform(wasm: ByteBuf) -> ByteBuf {
    let mut m = walrus::Module::from_buffer(&wasm).unwrap();
    let id = m.imports.find("ic0", "call_cycles_add").unwrap();
    if let walrus::ImportKind::Function(func_id) = m.imports.get(id).kind {
        replace_calls_with_unreachable(&mut m, func_id);
    }
    m.imports.delete(id);
    let wasm = m.emit_wasm();
    ByteBuf::from(wasm)
}

fn replace_calls_with_unreachable(module: &mut walrus::Module, func_id: walrus::FunctionId) {
    struct Replacer(walrus::FunctionId);
    impl walrus::ir::VisitorMut for Replacer {
        fn visit_instr_mut(&mut self, instr: &mut walrus::ir::Instr, _instr_loc: &mut walrus::ir::InstrLocId) {
            if let walrus::ir::Instr::Call(walrus::ir::Call { func }) = instr {
                if *func == self.0 {
                    *instr = walrus::ir::Unreachable {}.into();
                }
            }
        }
    }
    module.funcs.iter_local_mut().for_each(|(id, func)| {
        if id == func_id {
            return;
        }
        let entry = func.entry_block();
        walrus::ir::dfs_pre_order_mut(&mut Replacer(func_id), func, entry);
    });
}
