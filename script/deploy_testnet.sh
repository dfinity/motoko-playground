#!ic-repl
load "prelude.sh";

identity dfx "~/.config/dfx/identity/default/identity.pem";
let testnet_env = env_name("testnet");

function install(wasm, args, cycles) {
  let network = network_name();
  if eq(network, "ic") {
      let opt_next_to_id = ite(exist(Backend), opt Backend, null);
      create_canister_from_cycles_ledger(cycles, opt_next_to_id);
  } else {
      let id = call ic.provisional_create_canister_with_cycles(record { amount = cycles });
      id.canister_id;
  };
  let S = _;
  call ic.install_code(
    record {
      arg = encode wasm.__init_args(args);
      wasm_module = wasm;
      mode = variant { install };
      canister_id = S;
    });
  S;
};

function start_testnet() {
  "creating a new testnet...";
  let wasm = file("../target/pool/pool.wasm");
  let backend_init = opt record {
    cycles_per_canister = 105_000_000_000;
    max_num_canisters = 9;
    nonce_time_to_live = 300_000_000_000;
    canister_time_to_live = 1200_000_000_000;
    max_family_tree_size = 5;
    no_uninstall = opt false;
  };
  let frontend_init = opt record {
    cycles_per_canister = 105_000_000_000;
    max_num_canisters = 9;
    nonce_time_to_live = 300_000_000_000;
    canister_time_to_live = 1200_000_000_000;
    max_family_tree_size = 5;
    no_uninstall = opt true;
  };
  let initial_cycles = mul(backend_init?.cycles_per_canister, add(backend_init?.max_num_canisters, 1));
  let Backend = install(wasm, backend_init, opt initial_cycles);
  let Frontend = install(wasm, frontend_init, opt initial_cycles);
  stringify("Backend: ", Backend);
  stringify("Frontend: ", Frontend);
  "populating asset canister...";
  populate_asset_canister(Frontend, frontend_init?.max_num_canisters);
  populate_backend(Backend, backend_init?.max_num_canisters);
  export(testnet_env, Backend, Frontend, backend_init, frontend_init);
};

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


load stringify(testnet_env, "?");
if and(exist(Backend), exist(Frontend)) {
    "already deployed";
    stringify("Backend: ", Backend);
    stringify("Frontend: ", Frontend);
} else {
    start_testnet();
};
