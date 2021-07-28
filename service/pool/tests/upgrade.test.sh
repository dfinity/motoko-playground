#!ic-repl

let id = call ic.provisional_create_canister_with_cycles(record { settings = null; amount = null });
let S = id.canister_id;

let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 2 : nat;
  nonce_time_to_live = 1 : nat;
  canister_time_to_live = 1 : nat;
};
call ic.install_code(
  record {
    arg = encode (init);
    wasm_module = file "../../../.dfx/local/canisters/backend/backend.wasm";
    mode = variant { install };
    canister_id = S;
  },
);
let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let c1 = call S.getCanisterId(nonce);
c1;
let c2 = call S.getCanisterId(nonce);
c2;

call ic.install_code(
  record {
    arg = encode (init);
    wasm_module = file "../../../.dfx/local/canisters/backend/backend.wasm";
    mode = variant { upgrade };
    canister_id = S;
  },
);
let c3 = call S.getCanisterId(nonce);
c3;
let c4 = call S.getCanisterId(nonce);
c4;
assert c1.id != c2.id;
assert c1.id == c3.id;
assert c2.id == c4.id;

// Okay to increase pool and TTL
let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 3 : nat;
  nonce_time_to_live = 1 : nat;
  canister_time_to_live = 3600_000_000_000 : nat;
};
call ic.install_code(
  record {
    arg = encode (init);
    wasm_module = file "../../../.dfx/local/canisters/backend/backend.wasm";
    mode = variant { upgrade };
    canister_id = S;
  },
);
let c5 = call S.getCanisterId(nonce);
c5;
assert c5.id != c1.id;
assert c5.id != c2.id;
fail call S.getCanisterId(nonce);
assert _ ~= "No available canister id";

// Cannot reduce pool
let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 1 : nat;
  nonce_time_to_live = 1 : nat;
  canister_time_to_live = 1 : nat;
};
fail call ic.install_code(
  record {
    arg = encode (init);
    wasm_module = file "../../../.dfx/local/canisters/backend/backend.wasm";
    mode = variant { upgrade };
    canister_id = S;
  },
);
assert _ ~= "assertion failed";
// still old canister, new TTL does not apply
fail call S.getCanisterId(nonce);
assert _ ~= "No available canister id";
