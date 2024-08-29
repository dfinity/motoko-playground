#!ic-repl
load "prelude.sh";

identity dfx "~/.config/dfx/identity/default/identity.pem";
let testnet_env = env_name("testnet");

function populate_asset_canister(Frontend, n) {
  let asset = file("./chunked_map.wasm");
  while gt(n, 0) {
    let info = call Frontend.deployCanister(null, opt record { arg = encode (); wasm_module = asset; });
    stringify("deploying asset canister ", n, " with id ", info[0].id);
    let n = sub(n, 1);
  };
  call Frontend.releaseAllCanisters();
};
function populate_backend(Backend, n) {
  while gt(n, 0) {
      let info = call Backend.getCanisterId(record { timestamp = 0; nonce = 0 }, record { origin = "admin"; tags = vec {} });
      stringify("init backend canister ", n, " with id ", info.id);
      let n = sub(n, 1);
  };
  call Backend.releaseAllCanisters();
};

load testnet_env;
let backend_init = opt record {
    cycles_per_canister = 550_000_000_000;
    max_num_canisters = 50;
    nonce_time_to_live = 300_000_000_000;
    canister_time_to_live = 2700_000_000_000;
    max_family_tree_size = 5;
    no_uninstall = opt false;
};
let frontend_init = opt record {
    cycles_per_canister = 550_000_000_000;
    max_num_canisters = 50;
    nonce_time_to_live = 300_000_000_000;
    canister_time_to_live = 2700_000_000_000;
    max_family_tree_size = 5;
    no_uninstall = opt true;
};
let wasm = file("../target/pool/pool.wasm");
//install(Backend, wasm, backend_init, variant { upgrade });
//install(Frontend, wasm, frontend_init, variant { upgrade });
//call Frontend.releaseAllCanisters();
populate_asset_canister(Frontend, frontend_init?.max_num_canisters);
//call Backend.releaseAllCanisters();
populate_backend(Backend, backend_init?.max_num_canisters);
export(testnet_env, Backend, Frontend, backend_init, frontend_init);
