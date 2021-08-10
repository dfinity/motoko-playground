use ic_cdk::export::candid::{CandidType, Deserialize};
use serde_bytes::ByteBuf;

mod instrumentation;
mod remove_cycles;
mod utils;

#[derive(CandidType, Deserialize)]
struct Config {
    profiling: bool,         // only works for Motoko canister
    remove_cycles_add: bool, // works for all Wasm
}

#[ic_cdk_macros::query]
fn transform(wasm: ByteBuf, config: Config) -> ByteBuf {
    let mut m = walrus::Module::from_buffer(&wasm).unwrap();
    if config.profiling {
        instrumentation::instrument(&mut m);
    }
    if config.remove_cycles_add {
        remove_cycles::replace_cycles_add_with_drop(&mut m);
    }
    let wasm = m.emit_wasm();
    ByteBuf::from(wasm)
}
