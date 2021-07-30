export const canisterSet = {
  "aaaaa-aa": {
    name: "ic",
    candid: `// from spec 0.17.0
type canister_id = principal;
type user_id = principal;
type wasm_module = blob;
type unit = blob;

type canister_settings = record {
  controller : opt principal;
  compute_allocation : opt nat;
  memory_allocation : opt nat;
  freezing_threshold : opt nat;
};

type definite_canister_settings = record {
  controller : principal;
  compute_allocation : nat;
  memory_allocation : nat;
  freezing_threshold : nat;
};

service ic : {
  create_canister : (record {
    settings : opt canister_settings
  }) -> (record {canister_id : canister_id});
  update_settings : (record {
    canister_id : principal;
    settings : canister_settings
  }) -> ();
  install_code : (record {
    mode : variant {install; reinstall; upgrade};
    canister_id : canister_id;
    wasm_module : wasm_module;
    arg : blob;
  }) -> ();
  uninstall_code : (record {canister_id : canister_id}) -> ();
  start_canister : (record {canister_id : canister_id}) -> ();
  stop_canister : (record {canister_id : canister_id}) -> ();
  canister_status : (record {canister_id : canister_id}) -> (record {
      status : variant { running; stopping; stopped };
      settings: definite_canister_settings;
      module_hash: opt blob;
      memory_size: nat;
      cycles: nat;
  });
  delete_canister : (record {canister_id : canister_id}) -> ();
  deposit_cycles : (record {canister_id : canister_id}) -> ();
  raw_rand : () -> (blob);

  // provisional interfaces for the pre-ledger world
  provisional_create_canister_with_cycles : (record {
    amount: opt nat;
    settings : opt canister_settings
  }) -> (record {canister_id : canister_id});
  provisional_top_up_canister :
    (record { canister_id: canister_id; amount: nat }) -> ();
}`
  },
  "rwlgt-iiaaa-aaaaa-aaaaa-cai": {
    name: "registry"
  },
  "rrkah-fqaaa-aaaaa-aaaaq-cai": {
    name: "governance"
  },
  "ryjl3-tyaaa-aaaaa-aaaba-cai": {
    name: "ledger"
  },
  "r7inp-6aaaa-aaaaa-aaabq-cai": {
    name: "root"
  },
  "rkp4c-7iaaa-aaaaa-aaaca-cai": {
    name: "cycles-minting"
  },
  "rno2w-sqaaa-aaaaa-aaacq-cai": {
    name: "lifeline"
  },
  "renrk-eyaaa-aaaaa-aaada-cai": {
    name: "genesis-token"
  },
  "rdmx6-jaaaa-aaaaa-aaadq-cai": {
    name: "identity"
  },
  "qoctq-giaaa-aaaaa-aaaea-cai": {
    name: "nns-ui"
  },
  "a4gq6-oaaaa-aaaab-qaa4q-cai": {
    name: "candid-ui"
  },
  "h5aet-waaaa-aaaab-qaamq-cai": {
    name: "dscvr.one"
  },
  "7e6iv-biaaa-aaaaf-aaada-cai": {
    name: "openchat"
  }
}
