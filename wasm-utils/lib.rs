use serde_bytes::ByteBuf;

#[ic_cdk_macros::query]
fn transform(wasm: ByteBuf) -> ByteBuf {
    let mut m = walrus::Module::from_buffer(&wasm).unwrap();
    let id = m.imports.find("ic0", "call_cycles_add").unwrap();
    m.imports.delete(id);
    ByteBuf::from(m.emit_wasm())
}
