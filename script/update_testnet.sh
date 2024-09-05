#!ic-repl
load "prelude.sh";

identity dfx "~/.config/dfx/identity/default/identity.pem";
let testnet_env = env_name("testnet");

function populate_asset_canister(Frontend, n) {
  let asset = file("./chunked_map.wasm");
  let deploy_arg = opt record { arg = encode (); wasm_module = asset; bypass_wasm_transform = opt true };
  while gt(n, 0) {
      if lt(n, 5) {
          let info = call Frontend.deployCanister(null, deploy_arg);
          stringify("deploying asset canister ", n, " with id ", stringify(info));
          let n = sub(n, 1);
      } else {
          let info = par_call [Frontend.deployCanister(null, deploy_arg), Frontend.deployCanister(null, deploy_arg), Frontend.deployCanister(null, deploy_arg), Frontend.deployCanister(null, deploy_arg), Frontend.deployCanister(null, deploy_arg)];
          stringify("deploying asset canister ", n, " with id ", stringify(info));
          let n = sub(n, 5);
      };
  };
  call Frontend.releaseAllCanisters();
};
function populate_backend(Backend, n) {
  let nonce = record { timestamp = 0; nonce = 0 };
  let origin = record { origin = "admin"; tags = vec {} };
  while gt(n, 0) {
      if lt(n, 5) {
          let info = call Backend.getCanisterId(nonce, origin);
          stringify("init backend canister ", n, " with id ", stringify(info));
          let n = sub(n, 1);
      } else {
          let info = par_call [Backend.getCanisterId(nonce, origin), Backend.getCanisterId(nonce, origin), Backend.getCanisterId(nonce, origin), Backend.getCanisterId(nonce, origin), Backend.getCanisterId(nonce, origin)];
          stringify("init backend canister ", n, " with id ", stringify(info));
          let n = sub(n, 5);
      };
  };
  call Backend.releaseAllCanisters();
};

load testnet_env;
let backend_init = opt record {
    cycles_per_canister = 550_000_000_000;
    max_num_canisters = 1000;
    nonce_time_to_live = 300_000_000_000;
    canister_time_to_live = 2700_000_000_000;
    max_family_tree_size = 5;
    no_uninstall = opt false;
};
let frontend_init = opt record {
    cycles_per_canister = 550_000_000_000;
    max_num_canisters = 1000;
    nonce_time_to_live = 300_000_000_000;
    canister_time_to_live = 2700_000_000_000;
    max_family_tree_size = 5;
    no_uninstall = opt true;
};
let wasm = file("../target/pool/pool.wasm");
install(Backend, wasm, backend_init, variant { upgrade });
install(Frontend, wasm, frontend_init, variant { upgrade });
call Frontend.releaseAllCanisters();
populate_asset_canister(Frontend, frontend_init?.max_num_canisters);
call Backend.releaseAllCanisters();
populate_backend(Backend, backend_init?.max_num_canisters);
export(testnet_env, Backend, Frontend, backend_init, frontend_init);
