import "../prelude.sh";

let wasm = file "../../../../.dfx/local/canisters/backend/backend.wasm";
let parent = file ".dfx/local/canisters/Parent/Parent.wasm";

let S = install(wasm, null, opt 100_000_000_000_000);

let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let c1 = call S.getCanisterId(nonce);
let args = record { arg = blob ""; wasm_module = parent; mode = variant { install }; canister_id = c1.id };
call S.installCode(c1, args, false);

let c1 = c1.id;
call c1.sayHi(1);
