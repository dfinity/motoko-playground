#!ic-repl
load "prelude.sh";

let wasm = file("../../../.dfx/local/canisters/backend/backend.wasm");
let empty_wasm = blob "\00asm\01\00\00\00";
let origin = record { origin = "test"; tags = vec {"tag"} };

let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 1;
  canister_time_to_live = 5_000_000_000;
  max_family_tree_size = 5;
  stored_module = null;
};
let S = install(wasm, init, null);
let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let CID = call S.getCanisterId(nonce, origin);
call S.installCode(CID, record { arg = blob ""; wasm_module = empty_wasm; mode = variant { install }; canister_id = CID.id }, record { profiling = false; is_whitelisted = false; origin = origin });
read_state("canister", CID.id, "module_hash");
let CID3 = call S.deployCanister(null, opt record { arg = blob ""; wasm_module = empty_wasm; bypass_wasm_transform = opt true });
let CID3 = CID3[0];
call S.transferOwnership(CID3, vec {CID3.id; S});

// Immediately expire
let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 1;
  canister_time_to_live = 1;
  max_family_tree_size = 5;
};
let S = install(wasm, init, null);

let s1 = par_call [S.getCanisterId(nonce, origin), S.getCanisterId(nonce, origin)];
assert s1[0].id != s1[1].id;
let s2 = par_call [S.getCanisterId(nonce, origin), S.getCanisterId(nonce, origin)];
assert or(eq(s1[0].id, s2[0].id), eq(s1[0].id, s2[1].id)) == true;
assert or(eq(s1[1].id, s2[1].id), eq(s1[1].id, s2[0].id)) == true;

// Out of capacity
let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 1;
  canister_time_to_live = 3600_000_000_000;
  max_family_tree_size = 5;
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
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 1;
  canister_time_to_live = 60_000_000_000;
  max_family_tree_size = 5;
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
fail read_state("canister", CID.id, "module_hash");
assert _ ~= "absent";
read_state("canister", CID3.id, "module_hash");
