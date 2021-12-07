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
                "stable_write" => m
                    .types
                    .add(&[ValType::I32, ValType::I32, ValType::I32], &[]),
                "stable_read" => m
                    .types
                    .add(&[ValType::I32, ValType::I32, ValType::I32], &[]),
                "stable_grow" => m.types.add(&[ValType::I32], &[ValType::I32]),
                "stable_size" => m.types.add(&[], &[ValType::I32]),
                "debug_print" => m.types.add(&[ValType::I32, ValType::I32], &[]),
                "trap" => m.types.add(&[ValType::I32, ValType::I32], &[]),
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
