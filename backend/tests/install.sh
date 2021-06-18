#!/ic-repl

// assumes cycles, init variable exists
let id = call ic.provisional_create_canister_with_cycles(record { settings = null; amount = opt cycles });
call ic.install_code(
  record {
    arg = encode (init);
    wasm_module = file "../../.dfx/local/canisters/backend/backend.wasm";
    mode = variant { install };
    canister_id = id.canister_id;
  },
);
let S = id.canister_id;
