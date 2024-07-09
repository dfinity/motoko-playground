#!ic-repl
load "prelude.sh";

let wasm = file("../../../.dfx/local/canisters/backend/backend.wasm");
let origin = record { origin = "test"; tags = vec {} };

identity alice;
let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 3600_000_000_000;
  canister_time_to_live = 1;
  max_family_tree_size = 5;
  no_uninstall = false;
};
let S = install(wasm, init, null);

call S.getCanisterId(record { timestamp = 4780472194_000_000_000; nonce = 1 }, origin);
fail call S.getCanisterId(record { timestamp = 4780472194_000_000_000; nonce = 1 }, origin);
assert _ ~= "Nonce already used";
call S.getCanisterId(record { timestamp = 4780472194_000_000_001; nonce = 1 }, origin);

identity bob;
fail call S.getCanisterId(record { timestamp = 4780472194_000_000_002; nonce = 1 }, origin);
assert _ ~= "Proof of work check failed";
