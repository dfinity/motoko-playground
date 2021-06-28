#!ic-repl

let id = call ic.provisional_create_canister_with_cycles(record { settings = null; amount = null });
let S = id.canister_id;

// Immediately expire
let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 2 : nat;
  nonce_time_to_live = 1 : nat;
  canister_time_to_live = 1 : nat;
};
call ic.install_code(
  record {
    arg = encode (init);
    wasm_module = file "../../.dfx/local/canisters/backend/backend.wasm";
    mode = variant { install };
    canister_id = S;
  },
);
let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let c1 = call S.getCanisterId(nonce);
c1;
let c2 = call S.getCanisterId(nonce);
c2;
let c3 = call S.getCanisterId(nonce);
c3;
let c4 = call S.getCanisterId(nonce);
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
};
call ic.install_code(
  record {
    arg = encode (init);
    wasm_module = file "../../.dfx/local/canisters/backend/backend.wasm";
    mode = variant { reinstall };
    canister_id = S;
  },
);
let c3 = call S.getCanisterId(nonce);
c3;
let c4 = call S.getCanisterId(nonce);
c4;
fail call S.getCanisterId(nonce);
assert _ ~= "No available canister id";
call S.removeCode(c4);
call S.getCanisterId(nonce);
assert _.id == c4.id;
assert _.timestamp != c4.timestamp;

// Out of cycle
let id = call ic.provisional_create_canister_with_cycles(record { settings = null; amount = opt 10_000_000 });
let S = id.canister_id;
let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 2 : nat;
  nonce_time_to_live = 1 : nat;
  canister_time_to_live = 60_000_000_000 : nat;
};
call ic.install_code(
  record {
    arg = encode (init);
    wasm_module = file "../../.dfx/local/canisters/backend/backend.wasm";
    mode = variant { install };
    canister_id = S;
  },
);
fail call S.getCanisterId(nonce);
assert _ ~= "105000000000 cycles";
call ic.provisional_top_up_canister(
  record {
    canister_id = S;
    amount = 100_000_000_000_000;
  },
);
call S.getCanisterId(nonce);
