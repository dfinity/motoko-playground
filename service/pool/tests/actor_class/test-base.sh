load "../prelude.sh";

let wasm = file("../../../../.dfx/local/canisters/backend/backend.wasm");
let deleter = file(".dfx/local/canisters/Deleter/Deleter.wasm");

let S = install(wasm, null, opt 100_000_000_000_000);

let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let origin = record { origin = "test"; tags = vec {} };
let c1 = call S.getCanisterId(nonce, origin);
let args = record { arg = blob ""; wasm_module = parent; mode = variant { install }; canister_id = c1.id };
call S.installCode(c1, args, record { profiling = false; is_whitelisted = false; origin = origin });

let c1 = c1.id;

call c1.sayHi(0);
assert _ ~= null;
call c1.makeChild(0);
call c1.sayHi(0);
assert _ == opt "Hey";

call c1.makeChild(1);
call c1.makeChild(2);
call c1.makeChild(3);
fail call c1.makeChild(4);
assert _ ~= "In the Motoko Playground, each top level canister can only spawn 5 descendants including itself";

call c1.stopChild(0);
fail call c1.sayHi(0);
assert _ ~= "is stopped";
call c1.startChild(0);
call c1.sayHi(0);
assert _ == opt "Hey";

call c1.deleteChild(0);
call c1.sayHi(0);
assert _ ~= null;
call c1.makeChild(3);

// Child expiration 
let init = opt record {
  cycles_per_canister = 550_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 1;
  canister_time_to_live = 1;
  max_family_tree_size = 5;
};
let S = install(wasm, init, opt 100_000_000_000_000);

let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let c1 = call S.getCanisterId(nonce, origin);
let args = record { arg = blob ""; wasm_module = parent; mode = variant { install }; canister_id = c1.id };
call S.installCode(c1, args, record { profiling = false; is_whitelisted = false; origin = origin });
let c1 = c1.id;

fail call c1.makeChild(0);
call S.getCanisterId(nonce, origin);
call S.getCanisterId(nonce, origin);

// Security check
let S = install(wasm, null, opt 100_000_000_000_000);

let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let c1 = call S.getCanisterId(nonce, origin);
let args = record { arg = blob ""; wasm_module = parent; mode = variant { install }; canister_id = c1.id };
call S.installCode(c1, args, record { profiling = false; is_whitelisted = false; origin = origin });

let c2 = call S.getCanisterId(nonce, origin);
let args = record { arg = blob ""; wasm_module = deleter; mode = variant { install }; canister_id = c2.id };
call S.installCode(c2, args, record { profiling = false; is_whitelisted = false; origin = origin });

let c1 = c1.id;
let c2 = c2.id;

let child = call c1.makeChild(0);
fail call c2.deleteCanister(child);
assert _ ~= "Can only call delete_canister on canisters spawned by your own code";

fail call S.create_canister(record { settings = null });
assert _ ~= "canister_inspect_message explicitly refused message";
fail call c1.updateChildSettings(0, record { settings = null });
assert _ ~= "Cannot call update_settings from within Motoko Playground";
