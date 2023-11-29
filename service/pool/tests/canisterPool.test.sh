#!ic-repl
load "prelude.sh";

let wasm = file("../../../.dfx/local/canisters/backend/backend.wasm");
let empty_wasm = blob "\00asm\01\00\00\00";
let origin = record { origin = "test"; tags = vec {"tag"} };

let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 2 : nat;
  nonce_time_to_live = 1 : nat;
  canister_time_to_live = 5_000_000_000 : nat;
  max_family_tree_size = 5 : nat;
};
let S = install(wasm, init, null);
let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let CID = call S.getCanisterId(nonce, origin);
call S.installCode(CID, record { arg = blob ""; wasm_module = empty_wasm; mode = variant { install }; canister_id = CID.id }, record { profiling = false; is_whitelisted = false; origin = origin });
metadata(CID.id, "module_hash");

// Immediately expire
let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 2 : nat;
  nonce_time_to_live = 1 : nat;
  canister_time_to_live = 1 : nat;
  max_family_tree_size = 5 : nat;
};
let S = install(wasm, init, null);

let c1 = call S.getCanisterId(nonce, origin);
c1;
let c2 = call S.getCanisterId(nonce, origin);
c2;
let c3 = call S.getCanisterId(nonce, origin);
c3;
let c4 = call S.getCanisterId(nonce, origin);
c4;
assert c1.id != c2.id;
assert c1.id == c3.id;
assert c2.id == c4.id;

// Out of capacity
let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 2 : nat;
  nonce_time_to_live = 1 : nat;
  canister_time_to_live = 3600_000_000_000 : nat;
  max_family_tree_size = 5 : nat;
};
reinstall(S, wasm, init);
let c3 = call S.getCanisterId(nonce, origin);
c3;
let c4 = call S.getCanisterId(nonce, origin);
c4;
fail call S.getCanisterId(nonce, origin);
assert _ ~= "No available canister id";
call S.removeCode(c4);
call S.getCanisterId(nonce, origin);
assert _.id == c4.id;
assert _.timestamp != c4.timestamp;

// Out of cycle
let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 2 : nat;
  nonce_time_to_live = 1 : nat;
  canister_time_to_live = 60_000_000_000 : nat;
  max_family_tree_size = 5 : nat;
};
let S = install(wasm, init, opt 100_000_000_000);
fail call S.getCanisterId(nonce, origin);
assert _ ~= "out of cycles";
call ic.provisional_top_up_canister(
  record {
    canister_id = S;
    amount = 100_000_000_000_000;
  },
);
call S.getCanisterId(nonce, origin);

// Enough time has passed that the timer has removed the canister code
fail metadata(CID.id, "module_hash");
assert _ ~= "absent";
