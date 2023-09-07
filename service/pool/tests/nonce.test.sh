#!ic-repl
load "prelude.sh";

let wasm = file("../../../.dfx/local/canisters/backend/backend.wasm");

identity alice;
let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 2 : nat;
  nonce_time_to_live = 3600_000_000_000 : nat;
  canister_time_to_live = 1 : nat;
  max_family_tree_size = 5 : nat;
};
let S = install(wasm, init, null);

call S.getCanisterId(record { timestamp = 4780472194_000_000_000; nonce = 1 }, "test");
fail call S.getCanisterId(record { timestamp = 4780472194_000_000_000; nonce = 1 }, "test");
assert _ ~= "Nonce already used";
call S.getCanisterId(record { timestamp = 4780472194_000_000_001; nonce = 1 }, "test");

identity bob;
fail call S.getCanisterId(record { timestamp = 4780472194_000_000_002; nonce = 1 }, "test");
assert _ ~= "Proof of work check failed";
