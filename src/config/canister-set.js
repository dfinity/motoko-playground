export const canisterSet = {
  "aaaaa-aa": {
    name: "ic",
    candid: `// from spec 0.18.0
type canister_id = principal;
type user_id = principal;
type wasm_module = blob;

type canister_settings = record {
  controllers : opt vec principal;
  compute_allocation : opt nat;
  memory_allocation : opt nat;
  freezing_threshold : opt nat;
};

type definite_canister_settings = record {
  controllers : vec principal;
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
  "rrkah-fqaaa-aaaaa-aaaaq-cai": {
    name: "governance"
  },
  "ryjl3-tyaaa-aaaaa-aaaba-cai": {
    name: "ledger",
    candid: `type AccountBalanceArgs = record {
  account: AccountIdentifier;
};
type AccountIdentifier = text;
type ArchiveOptions = record {
  node_max_memory_size_bytes: opt nat32;
  max_message_size_bytes: opt nat32;
  controller_id: principal;
};
type CanisterId = principal;
type BlockHeight = nat64;
type Duration = record {
  secs: nat64;
  nanos: nat32;
};
type ICPTs = record {
  e8s : nat64;
};
type LedgerCanisterInitPayload = record {
  minting_account: AccountIdentifier;
  initial_values: vec record {AccountIdentifier; ICPTs};
  max_message_size_bytes: opt nat32;
  transaction_window: opt Duration;
  archive_options: opt ArchiveOptions;
  send_whitelist: vec record {principal};
};
type Memo = nat64;
type NotifyCanisterArgs = record {
  block_height: BlockHeight;
  max_fee: ICPTs;
  from_subaccount: opt SubAccount;
  to_canister: principal;
  to_subaccount: opt SubAccount;
};
type SendArgs = record {
  memo: Memo;
  amount: ICPTs;
  fee: ICPTs;
  from_subaccount: opt SubAccount;
  to: AccountIdentifier;
  created_at_time: opt TimeStamp;
};
type SubAccount = vec nat8;
type TimeStamp = record {
  timestamp_nanos: nat64;
};
type Transaction = record {
  transfer: Transfer;
  memo: Memo;
  created_at: BlockHeight;
};
type Transfer = variant {
  Burn: record {
    from: AccountIdentifier;
    amount: ICPTs;
  };
  Mint: record {
    to: AccountIdentifier;
    amount: ICPTs;
  };
  Send: record {
    from: AccountIdentifier;
    to: AccountIdentifier;
    amount: ICPTs;
  };
};
type HeaderField = record {text; text};
type HttpRequest = record {
  url: text;
  method: text;
  body: vec nat8;
  headers: vec HeaderField;
};
type HttpResponse = record {
  body: vec nat8;
  headers: vec HeaderField;
  status_code: nat16;
};
service: (LedgerCanisterInitPayload) -> {
  send_dfx : (SendArgs) -> (BlockHeight);
  notify_dfx: (NotifyCanisterArgs) -> ();
  account_balance_dfx : (AccountBalanceArgs) -> (ICPTs) query;
  get_nodes : () -> (vec CanisterId) query;
  http_request: (HttpRequest) -> (HttpResponse) query;
}`
  },
}
