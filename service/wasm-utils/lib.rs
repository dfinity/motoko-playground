use candid::{CandidType, Deserialize};
use ic_wasm::*;
use serde_bytes::ByteBuf;
use sha2::Digest;

#[derive(CandidType, Deserialize)]
struct ProfilingConfig {
    start_page: Option<u32>,
    page_limit: Option<u32>,
    use_new_metering: bool,
}

#[derive(CandidType, Deserialize)]
struct Config {
    profiling: Option<ProfilingConfig>,
    remove_cycles_add: bool,
    limit_stable_memory_page: Option<u32>,
    backend_canister_id: Option<candid::Principal>,
}

#[ic_cdk::query]
fn is_whitelisted(wasm: ByteBuf) -> ByteBuf {
    let wasm_hash = hex::encode(sha2::Sha256::digest(&wasm));
    let white_list = include!("whitelisted_wasms.txt");
    if white_list.contains(&wasm_hash.as_str()) {
        wasm
    } else {
        ic_cdk::trap("Wasm is not whitelisted")
    }
}

#[ic_cdk::query]
fn transform(wasm: ByteBuf, config: Config) -> ByteBuf {
    let mut m = utils::parse_wasm(&wasm, false).unwrap();
    if let Some(config) = config.profiling {
        if config.page_limit.is_some() {
            assert!(config.start_page.is_some());
        }
        let instr_config = instrumentation::Config {
            trace_only_funcs: vec![],
            start_address: config.start_page.map(|page| page as i32 * 65536),
            page_limit: config.page_limit.map(|x| x as i32),
            use_new_metering: false,
        };
        instrumentation::instrument(&mut m, instr_config).unwrap();
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

#[test]
fn test_parsing_whitelisted_wasms_txt() {
    let white_list = include!("whitelisted_wasms.txt");
    let hash = "88d1e5795d29debc1ff56fa0696dcb3adfa67f82fe2739d1aa644263838174b9";
    assert!(white_list.contains(&hash));
}
