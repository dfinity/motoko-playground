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
c1;
let c2 = call S.getCanisterId(nonce, origin);
c2;

upgrade(S, wasm, init);
let c3 = call S.getCanisterId(nonce, origin);
c3;
let c4 = call S.getCanisterId(nonce, origin);
c4;
assert c1.id != c2.id;
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
let c5 = call S.getCanisterId(nonce, origin);
c5;
assert c5.id != c1.id;
assert c5.id != c2.id;
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
