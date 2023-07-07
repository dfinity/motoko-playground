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
    "651425d92d3796ddae581191452e0e87484eeff4ff6352fe9a59c7e1f97a2310", // dfx 0.14.1 frontend canister
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
    let mut m = walrus::Module::from_buffer(&wasm).unwrap();
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
