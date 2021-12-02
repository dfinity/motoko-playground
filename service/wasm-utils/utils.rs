use walrus::*;

pub fn get_ic_func_id(m: &mut Module, method: &str) -> FunctionId {
    match m.imports.find("ic0", method) {
        Some(id) => {
            if let ImportKind::Function(func_id) = m.imports.get(id).kind {
                func_id
            } else {
                unreachable!()
            }
        }
        None => {
            let ty = match method {
                "stable_write" => m.types.add(&[ValType::I32, ValType::I32, ValType::I32], &[]),
                "stable_read" => m.types.add(&[ValType::I32, ValType::I32, ValType::I32], &[]),
                "stable_grow" => m.types.add(&[ValType::I32], &[ValType::I32]),
                "debug_print" => m.types.add(&[ValType::I32, ValType::I32], &[]),
                "msg_reply_data_append" => m.types.add(&[ValType::I32, ValType::I32], &[]),
                "msg_reply" => m.types.add(&[], &[]),
                _ => unreachable!(),
            };
            m.add_import_func("ic0", method, ty).0
        }
    }
}

pub fn get_memory_id(m: &Module) -> MemoryId {
    m.memories
        .iter()
        .next()
        .expect("only single memory is supported")
        .id()
}

pub fn get_export_func_id(m: &Module, method: &str) -> Option<FunctionId> {
    let e = m.exports.iter().find(|e| e.name == method)?;
    if let ExportItem::Function(id) = e.item {
        Some(id)
    } else {
        None
    }
}

pub fn get_builder(m: &mut Module, id: FunctionId) -> InstrSeqBuilder<'_> {
    if let FunctionKind::Local(func) = &mut m.funcs.get_mut(id).kind {
        let id = func.entry_block();
        func.builder_mut().instr_seq(id)
    } else {
        unreachable!()
    }
}

pub fn inject_top(builder: &mut InstrSeqBuilder<'_>, instrs: Vec<ir::Instr>) {
    for instr in instrs.into_iter().rev() {
        builder.instr_at(0, instr);
    }
}
