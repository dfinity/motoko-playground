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
