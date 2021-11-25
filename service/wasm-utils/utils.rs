use walrus::*;

pub fn get_ic_func_id(m: &Module, method: &str) -> FunctionId {
    let id = m.imports.find("ic0", method).unwrap();
    if let ImportKind::Function(func_id) = m.imports.get(id).kind {
        func_id
    } else {
        unreachable!()
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

pub fn get_builder(m: &mut Module, id: FunctionId) -> &mut FunctionBuilder {
    if let FunctionKind::Local(func) = &mut m.funcs.get_mut(id).kind {
        func.builder_mut()
    } else {
        unreachable!()
    }
}

pub fn inject_top(builder: &mut FunctionBuilder, instrs: Vec<ir::Instr>) {
    for instr in instrs.into_iter().rev() {
        builder.func_body().instr_at(0, instr);
    }
}
