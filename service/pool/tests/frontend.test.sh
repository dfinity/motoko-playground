#!ic-repl
load "prelude.sh";

let wasm = file("../../../.dfx/local/canisters/backend/backend.wasm");
let asset = file("../../script/assetstorage.wasm.gz");
let module_hash = blob "\2c\24\b5\e1\58\48\90\a7\96\50\11\d5\d1\d8\27\ac\a6\8c\48\9c\9a\63\08\47\57\30\42\0f\a5\33\72\e8";
let empty_wasm = blob "\00asm\01\00\00\00";

let origin = record { origin = "test"; tags = vec {"tag"} };
let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 1;
  canister_time_to_live = 5_000_000_000;
  max_family_tree_size = 5;
  stored_module = opt record { hash = module_hash; arg = encode () };
};
let S = install(wasm, init, null);
call ic.upload_chunk(record { chunk = asset; canister_id = S });
let nonce = record { timestamp = 1 : int; nonce = 1 : nat };
let c1 = call S.deployCanister(null, null);
let c1 = c1[0];
call S.transferOwnership(c1, vec {c1.id; S});
fail call S.deployCanister(opt c1, null);
assert _ ~= "Cannot find canister";
let c2 = call S.getCanisterId(nonce, origin);
let c3 = call S.deployCanister(null, null);
assert read_state("canister", c2.id, "module_hash") == module_hash;
assert c2.id != c1.id;
assert c3[0].id != c2.id;

call ic.upload_chunk(record { chunk = empty_wasm; canister_id = S });
let hash = _.hash;
let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  nonce_time_to_live = 1;
  canister_time_to_live = 5_000_000_000;
  max_family_tree_size = 5;
  stored_module = opt record { hash = hash; arg = encode () };
};
upgrade(S, wasm, init);
let c4 = call S.getCanisterId(nonce, origin);
assert c4.id == c2.id;

assert read_state("canister", c1.id, "module_hash") == module_hash;
assert read_state("canister", c3[0].id, "module_hash") == module_hash;
assert read_state("canister", c4.id, "module_hash") == hash;

