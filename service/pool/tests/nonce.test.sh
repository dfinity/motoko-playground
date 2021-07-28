#!ic-repl

identity alice;
let id = call ic.provisional_create_canister_with_cycles(record { settings = null; amount = null });
let S = id.canister_id;

let init = opt record {
  cycles_per_canister = 105_000_000_000 : nat;
  max_num_canisters = 2 : nat;
  nonce_time_to_live = 3600_000_000_000 : nat;
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
call S.getCanisterId(record { timestamp = 4780472194_000_000_000; nonce = 1 });
fail call S.getCanisterId(record { timestamp = 4780472194_000_000_000; nonce = 1 });
assert _ ~= "Nonce already used";
call S.getCanisterId(record { timestamp = 4780472194_000_000_001; nonce = 1 });

identity bob;
fail call S.getCanisterId(record { timestamp = 4780472194_000_000_002; nonce = 1 });
assert _ ~= "Proof of work check failed";
