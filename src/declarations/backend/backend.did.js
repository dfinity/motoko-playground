export const idlFactory = ({ IDL }) => {
  const InitParams = IDL.Record({
    no_uninstall: IDL.Opt(IDL.Bool),
    max_num_canisters: IDL.Nat,
    canister_time_to_live: IDL.Nat,
    wasm_utils_principal: IDL.Opt(IDL.Text),
    cycles_per_canister: IDL.Nat,
    nonce_time_to_live: IDL.Nat,
    max_family_tree_size: IDL.Nat,
  });
  const http_header = IDL.Record({ value: IDL.Text, name: IDL.Text });
  const http_request_result = IDL.Record({
    status: IDL.Nat,
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(http_header),
  });
  const transform_function = IDL.Func(
    [
      IDL.Record({
        context: IDL.Vec(IDL.Nat8),
        response: http_request_result,
      }),
    ],
    [http_request_result],
    ["query"],
  );
  const http_request_args = IDL.Record({
    url: IDL.Text,
    method: IDL.Variant({
      get: IDL.Null,
      head: IDL.Null,
      post: IDL.Null,
    }),
    max_response_bytes: IDL.Opt(IDL.Nat64),
    body: IDL.Opt(IDL.Vec(IDL.Nat8)),
    transform: IDL.Opt(
      IDL.Record({
        function: transform_function,
        context: IDL.Vec(IDL.Nat8),
      }),
    ),
    headers: IDL.Vec(http_header),
  });
  const CanisterInfo = IDL.Record({
    id: IDL.Principal,
    timestamp: IDL.Int,
  });
  const canister_id = IDL.Principal;
  const definite_canister_settings = IDL.Record({
    freezing_threshold: IDL.Nat,
    controllers: IDL.Vec(IDL.Principal),
    wasm_memory_limit: IDL.Nat,
    memory_allocation: IDL.Nat,
    compute_allocation: IDL.Nat,
  });
  const canister_settings = IDL.Record({
    freezing_threshold: IDL.Opt(IDL.Nat),
    controllers: IDL.Opt(IDL.Vec(IDL.Principal)),
    wasm_memory_limit: IDL.Opt(IDL.Nat),
    memory_allocation: IDL.Opt(IDL.Nat),
    compute_allocation: IDL.Opt(IDL.Nat),
  });
  const DeployArgs = IDL.Record({
    arg: IDL.Vec(IDL.Nat8),
    wasm_module: IDL.Vec(IDL.Nat8),
    bypass_wasm_transform: IDL.Opt(IDL.Bool),
  });
  const Nonce = IDL.Record({ nonce: IDL.Nat, timestamp: IDL.Int });
  const Origin = IDL.Record({
    origin: IDL.Text,
    tags: IDL.Vec(IDL.Text),
  });
  const Stats = IDL.Record({
    num_of_installs: IDL.Nat,
    num_of_canisters: IDL.Nat,
    error_mismatch: IDL.Nat,
    error_out_of_capacity: IDL.Nat,
    cycles_used: IDL.Nat,
    error_total_wait_time: IDL.Nat,
  });
  const HttpRequest = IDL.Record({
    url: IDL.Text,
    method: IDL.Text,
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  const HttpResponse = IDL.Record({
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    status_code: IDL.Nat16,
  });
  const InstallArgs = IDL.Record({
    arg: IDL.Vec(IDL.Nat8),
    wasm_module: IDL.Vec(IDL.Nat8),
    mode: IDL.Variant({
      reinstall: IDL.Null,
      upgrade: IDL.Null,
      install: IDL.Null,
    }),
    canister_id: IDL.Principal,
  });
  const InstallConfig = IDL.Record({
    origin: IDL.Record({ origin: IDL.Text, tags: IDL.Vec(IDL.Text) }),
    profiling: IDL.Bool,
    is_whitelisted: IDL.Bool,
    start_page: IDL.Opt(IDL.Nat32),
    page_limit: IDL.Opt(IDL.Nat32),
  });
  const wasm_module = IDL.Vec(IDL.Nat8);
  const snapshot_id = IDL.Vec(IDL.Nat8);
  const snapshot = IDL.Record({
    id: snapshot_id,
    total_size: IDL.Nat64,
    taken_at_timestamp: IDL.Nat64,
  });
  const Self = IDL.Service({
    GCCanisters: IDL.Func([], [], ["oneway"]),
    __transform: IDL.Func(
      [
        IDL.Record({
          context: IDL.Vec(IDL.Nat8),
          response: http_request_result,
        }),
      ],
      [http_request_result],
      ["composite_query"],
    ),
    _ttp_request: IDL.Func([http_request_args], [http_request_result], []),
    balance: IDL.Func([], [IDL.Nat], ["query"]),
    callForward: IDL.Func(
      [CanisterInfo, IDL.Text, IDL.Vec(IDL.Nat8)],
      [IDL.Vec(IDL.Nat8)],
      [],
    ),
    canister_status: IDL.Func(
      [IDL.Record({ canister_id: canister_id })],
      [
        IDL.Record({
          status: IDL.Variant({
            stopped: IDL.Null,
            stopping: IDL.Null,
            running: IDL.Null,
          }),
          memory_size: IDL.Nat,
          cycles: IDL.Nat,
          settings: definite_canister_settings,
          module_hash: IDL.Opt(IDL.Vec(IDL.Nat8)),
        }),
      ],
      [],
    ),
    create_canister: IDL.Func(
      [IDL.Record({ settings: IDL.Opt(canister_settings) })],
      [IDL.Record({ canister_id: canister_id })],
      [],
    ),
    deleteSnapshot: IDL.Func([CanisterInfo], [], []),
    delete_canister: IDL.Func(
      [IDL.Record({ canister_id: canister_id })],
      [],
      [],
    ),
    delete_canister_snapshot: IDL.Func(
      [
        IDL.Record({
          canister_id: IDL.Principal,
          snapshot_id: IDL.Vec(IDL.Nat8),
        }),
      ],
      [],
      [],
    ),
    deployCanister: IDL.Func(
      [IDL.Opt(CanisterInfo), IDL.Opt(DeployArgs)],
      [
        CanisterInfo,
        IDL.Variant({
          reinstall: IDL.Null,
          upgrade: IDL.Null,
          install: IDL.Null,
        }),
      ],
      [],
    ),
    dump: IDL.Func([], [IDL.Vec(CanisterInfo)], ["query"]),
    getCanisterId: IDL.Func([Nonce, Origin], [CanisterInfo], []),
    getInitParams: IDL.Func([], [InitParams], ["query"]),
    getStats: IDL.Func(
      [],
      [
        Stats,
        IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
        IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
      ],
      ["query"],
    ),
    getSubtree: IDL.Func(
      [CanisterInfo],
      [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Vec(CanisterInfo)))],
      ["query"],
    ),
    http_request: IDL.Func([HttpRequest], [HttpResponse], ["query"]),
    installCode: IDL.Func(
      [CanisterInfo, InstallArgs, InstallConfig],
      [CanisterInfo],
      [],
    ),
    installExternalCanister: IDL.Func([InstallArgs], [], []),
    installStoredWasm: IDL.Func(
      [CanisterInfo, InstallArgs, Origin],
      [CanisterInfo],
      [],
    ),
    install_code: IDL.Func(
      [
        IDL.Record({
          arg: IDL.Vec(IDL.Nat8),
          wasm_module: wasm_module,
          mode: IDL.Variant({
            reinstall: IDL.Null,
            upgrade: IDL.Null,
            install: IDL.Null,
          }),
          canister_id: canister_id,
        }),
      ],
      [],
      [],
    ),
    listSnapshots: IDL.Func([CanisterInfo], [IDL.Vec(snapshot)], []),
    list_canister_snapshots: IDL.Func(
      [IDL.Record({ canister_id: IDL.Principal })],
      [IDL.Vec(snapshot)],
      [],
    ),
    loadSnapshot: IDL.Func([CanisterInfo], [], []),
    load_canister_snapshot: IDL.Func([IDL.Record({})], [], []),
    mergeTags: IDL.Func([IDL.Text, IDL.Opt(IDL.Text)], [], []),
    releaseAllCanisters: IDL.Func([], [], []),
    removeCode: IDL.Func([CanisterInfo], [], []),
    resetStats: IDL.Func([], [], []),
    start_canister: IDL.Func(
      [IDL.Record({ canister_id: canister_id })],
      [],
      [],
    ),
    stop_canister: IDL.Func([IDL.Record({ canister_id: canister_id })], [], []),
    takeSnapshot: IDL.Func([CanisterInfo], [IDL.Opt(IDL.Vec(IDL.Nat8))], []),
    take_canister_snapshot: IDL.Func(
      [
        IDL.Record({
          replace_snapshot: IDL.Opt(IDL.Vec(IDL.Nat8)),
          canister_id: IDL.Principal,
        }),
      ],
      [snapshot],
      [],
    ),
    transferOwnership: IDL.Func([CanisterInfo, IDL.Vec(IDL.Principal)], [], []),
    uninstall_code: IDL.Func(
      [IDL.Record({ canister_id: canister_id })],
      [],
      [],
    ),
    update_settings: IDL.Func([IDL.Record({})], [], []),
    wallet_receive: IDL.Func([], [], []),
  });
  return Self;
};
export const init = ({ IDL }) => {
  const InitParams = IDL.Record({
    no_uninstall: IDL.Opt(IDL.Bool),
    max_num_canisters: IDL.Nat,
    canister_time_to_live: IDL.Nat,
    wasm_utils_principal: IDL.Opt(IDL.Text),
    cycles_per_canister: IDL.Nat,
    nonce_time_to_live: IDL.Nat,
    max_family_tree_size: IDL.Nat,
  });
  return [IDL.Opt(InitParams)];
};
