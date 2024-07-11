#!ic-repl

identity dfx "~/.config/dfx/identity/default/identity.pem";

function install(wasm, args, cycles) {
  let id = call ic.provisional_create_canister_with_cycles(record { amount = cycles });
  let S = id.canister_id;
  let _ = call ic.install_code(
    record {
      arg = encode wasm.__init_args(args);
      wasm_module = wasm;
      mode = variant { install };
      canister_id = S;
    });
  let _ = S;
};

function start_testnet() {
  "creating a new testnet...";
  let wasm = file("../.dfx/local/canisters/backend/backend.wasm");
  let backend_init = opt record {
    cycles_per_canister = 105_000_000_000;
    max_num_canisters = 2;
    nonce_time_to_live = 300_000_000_000;
    canister_time_to_live = 60_000_000_000;
    max_family_tree_size = 5;
    no_uninstall = opt false;
  };
  let frontend_init = opt record {
    cycles_per_canister = 105_000_000_000;
    max_num_canisters = 2;
    nonce_time_to_live = 300_000_000_000;
    canister_time_to_live = 60_000_000_000;
    max_family_tree_size = 5;
    no_uninstall = opt true;
  };
  let Backend = install(wasm, backend_init, null);
  let Frontend = install(wasm, frontend_init, null);
  stringify("Backend: ", Backend);
  stringify("Frontend: ", Frontend);
  "populating asset canister...";
  let _ = populate_asset_canister(Frontend, frontend_init?.max_num_canisters);
  let _ = export("deployed.env", Backend, Frontend, backend_init, frontend_init);
};

function populate_asset_canister(Frontend, n) {
  let asset = file("./chunked_map.wasm");
  while gt(n, 0) {
    let info = call Frontend.deployCanister(null, opt record { arg = encode (); wasm_module = asset; });
    assert info[1] == variant { install };
    stringify("deploying asset canister ", n, " with id ", info[0].id);
    let n = sub(n, 1);
  };
  let _ = call Frontend.releaseAllCanisters();
};


load "deployed.env?";
if and(exist(Backend), exist(Frontend)) {
    "already deployed";
    stringify("Backend: ", Backend);
    stringify("Frontend: ", Frontend);
  } else {
    let _ = start_testnet();
  };
