#!ic-repl
load "prelude.sh";

let wasm = file("../../../.dfx/local/canisters/backend/backend.wasm");
let origin = record { origin = "test"; tags = vec {"tag"} };

let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 1;
  canister_time_to_live = 1;
  max_family_tree_size = 5;
};
let S = install(wasm, init, null);

let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let c1 = call S.getCanisterId(nonce, origin);
let c2 = call S.getCanisterId(nonce, origin);

upgrade(S, wasm, init);
let c3 = call S.getCanisterId(nonce, origin);
let c4 = call S.getCanisterId(nonce, origin);
assert c1.id == c2.id;
assert c1.id == c3.id;
assert c2.id == c4.id;

// Okay to increase pool and TTL
let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 3;
  nonce_time_to_live = 1;
  canister_time_to_live = 3600_000_000_000;
  max_family_tree_size = 5;
};
let stats = call S.getStats();
upgrade(S, wasm, init);
// stats are preserved after upgrade
call S.getStats();
assert _ == stats;
// TTL increased, c4 suddenly get more time.
let c6 = call S.getCanisterId(nonce, origin);
let c7 = call S.getCanisterId(nonce, origin);
assert c6.id != c4.id;
assert c7.id != c6.id;
fail call S.getCanisterId(nonce, origin);
assert _ ~= "No available canister id";

// Cannot reduce pool
let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 1;
  nonce_time_to_live = 1;
  canister_time_to_live = 1;
  max_family_tree_size = 5;
};
fail upgrade(S, wasm, init);
assert _ ~= "Cannot reduce canisterPool for upgrade";
// still old canister, new TTL does not apply
fail call S.getCanisterId(nonce, origin);
assert _ ~= "No available canister id";
