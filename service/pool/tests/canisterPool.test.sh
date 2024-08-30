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
  no_uninstall = opt true;
};
let S = install(wasm, init, null);
let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let CID2 = call S.getCanisterId(nonce, origin);
call S.installCode(CID2, record { arg = blob ""; wasm_module = empty_wasm; mode = variant { install }; canister_id = CID2.id }, record { profiling = false; is_whitelisted = false; origin = origin });
read_state("canister", CID2.id, "module_hash");
let c1 = call S.deployCanister(null, opt record { arg = blob ""; wasm_module = empty_wasm; bypass_wasm_transform = opt true });
let c1 = c1[0];
call S.transferOwnership(c1, vec {c1.id; S});
fail call S.deployCanister(opt c1, opt record { arg = blob ""; wasm_module = empty_wasm; bypass_wasm_transform = opt true });
assert _ ~= "Cannot find canister";

let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 1;
  canister_time_to_live = 5_000_000_000;
  max_family_tree_size = 5;
  no_uninstall = opt false;
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
read_state("canister", CID2.id, "module_hash");
read_state("canister", CID3.id, "module_hash");
