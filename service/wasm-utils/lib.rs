use candid::{CandidType, Deserialize};
use serde_bytes::ByteBuf;

use ic_wasm::*;
use sha2::Digest;

#[derive(CandidType, Deserialize)]
struct Config {
    profiling: bool,
    remove_cycles_add: bool,
    limit_stable_memory_page: Option<u32>,
    backend_canister_id: Option<candid::Principal>,
}

const WHITELISTED_WASMS: [&str; 1] = [
    "88d1e5795d29debc1ff56fa0696dcb3adfa67f82fe2739d1aa644263838174b9", // dfx 0.15.0 frontend canister
];

#[ic_cdk::query]
fn is_whitelisted(wasm: ByteBuf) -> ByteBuf {
    let wasm_hash = hex::encode(sha2::Sha256::digest(&wasm));
    if WHITELISTED_WASMS.contains(&wasm_hash.as_str()) {
        wasm
    } else {
        ic_cdk::trap("Wasm is not whitelisted")
    }
}

#[ic_cdk::query]
fn transform(wasm: ByteBuf, config: Config) -> ByteBuf {
    let mut m = utils::parse_wasm(&wasm, false).unwrap();
    if config.profiling {
        instrumentation::instrument(&mut m, &[]).unwrap();
    }
    let resource_config = limit_resource::Config {
        remove_cycles_add: config.remove_cycles_add,
        limit_stable_memory_page: config.limit_stable_memory_page,
        playground_canister_id: config.backend_canister_id,
    };
    limit_resource::limit_resource(&mut m, &resource_config);
    let wasm = m.emit_wasm();
    ByteBuf::from(wasm)
}
