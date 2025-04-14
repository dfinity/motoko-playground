export const idlFactory = ({ IDL }) => {
  const CyclesSettings = IDL.Record({
    max_cycles_per_call: IDL.Nat,
    max_cycles_total: IDL.Nat,
  });
  const InitParams = IDL.Record({
    max_num_canisters: IDL.Nat,
    canister_time_to_live: IDL.Nat,
    stored_module: IDL.Opt(
      IDL.Record({ arg: IDL.Vec(IDL.Nat8), hash: IDL.Vec(IDL.Nat8) }),
    ),
    cycles_settings: IDL.Opt(CyclesSettings),
    wasm_utils_principal: IDL.Opt(IDL.Text),
    cycles_per_canister: IDL.Nat,
    admin_only: IDL.Opt(IDL.Bool),
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
  const log_visibility = IDL.Variant({
    controllers: IDL.Null,
    public: IDL.Null,
  });
  const definite_canister_settings = IDL.Record({
    freezing_threshold: IDL.Nat,
    controllers: IDL.Vec(IDL.Principal),
    log_visibility: log_visibility,
    wasm_memory_limit: IDL.Nat,
    memory_allocation: IDL.Nat,
    compute_allocation: IDL.Nat,
  });
  const canister_status_result = IDL.Record({
    status: IDL.Variant({
      stopped: IDL.Null,
      stopping: IDL.Null,
      running: IDL.Null,
    }),
    memory_size: IDL.Nat,
    cycles: IDL.Nat,
    settings: definite_canister_settings,
    query_stats: IDL.Record({
      response_payload_bytes_total: IDL.Nat,
      num_instructions_total: IDL.Nat,
      num_calls_total: IDL.Nat,
      request_payload_bytes_total: IDL.Nat,
    }),
    idle_cycles_burned_per_day: IDL.Nat,
    module_hash: IDL.Opt(IDL.Vec(IDL.Nat8)),
    reserved_cycles: IDL.Nat,
  });
  const canister_settings = IDL.Record({
    freezing_threshold: IDL.Opt(IDL.Nat),
    controllers: IDL.Opt(IDL.Vec(IDL.Principal)),
    log_visibility: IDL.Opt(log_visibility),
    wasm_memory_limit: IDL.Opt(IDL.Nat),
    memory_allocation: IDL.Opt(IDL.Nat),
    compute_allocation: IDL.Opt(IDL.Nat),
  });
  const canister_install_mode = IDL.Variant({
    reinstall: IDL.Null,
    upgrade: IDL.Opt(
      IDL.Record({
        wasm_memory_persistence: IDL.Opt(
          IDL.Variant({ keep: IDL.Null, replace: IDL.Null }),
        ),
      }),
    ),
    install: IDL.Null,
  });
  const DeployArgs = IDL.Record({
    arg: IDL.Vec(IDL.Nat8),
    wasm_module: IDL.Vec(IDL.Nat8),
    bypass_wasm_transform: IDL.Opt(IDL.Bool),
    mode: IDL.Opt(canister_install_mode),
  });
  const EthSepoliaService = IDL.Variant({
    Alchemy: IDL.Null,
    BlockPi: IDL.Null,
    PublicNode: IDL.Null,
    Ankr: IDL.Null,
    Sepolia: IDL.Null,
  });
  const L2MainnetService = IDL.Variant({
    Alchemy: IDL.Null,
    Llama: IDL.Null,
    BlockPi: IDL.Null,
    PublicNode: IDL.Null,
    Ankr: IDL.Null,
  });
  const ChainId = IDL.Nat64;
  const HttpHeader = IDL.Record({ value: IDL.Text, name: IDL.Text });
  const RpcApi = IDL.Record({
    url: IDL.Text,
    headers: IDL.Opt(IDL.Vec(HttpHeader)),
  });
  const EthMainnetService = IDL.Variant({
    Alchemy: IDL.Null,
    Llama: IDL.Null,
    BlockPi: IDL.Null,
    Cloudflare: IDL.Null,
    PublicNode: IDL.Null,
    Ankr: IDL.Null,
  });
  const RpcServices = IDL.Variant({
    EthSepolia: IDL.Opt(IDL.Vec(EthSepoliaService)),
    BaseMainnet: IDL.Opt(IDL.Vec(L2MainnetService)),
    Custom: IDL.Record({
      chainId: ChainId,
      services: IDL.Vec(RpcApi),
    }),
    OptimismMainnet: IDL.Opt(IDL.Vec(L2MainnetService)),
    ArbitrumOne: IDL.Opt(IDL.Vec(L2MainnetService)),
    EthMainnet: IDL.Opt(IDL.Vec(EthMainnetService)),
  });
  const ConsensusStrategy = IDL.Variant({
    Equality: IDL.Null,
    Threshold: IDL.Record({ min: IDL.Nat8, total: IDL.Opt(IDL.Nat8) }),
  });
  const RpcConfig = IDL.Record({
    responseConsensus: IDL.Opt(ConsensusStrategy),
    responseSizeEstimate: IDL.Opt(IDL.Nat64),
  });
  const AccessListEntry = IDL.Record({
    storageKeys: IDL.Vec(IDL.Text),
    address: IDL.Text,
  });
  const TransactionRequest = IDL.Record({
    to: IDL.Opt(IDL.Text),
    gas: IDL.Opt(IDL.Nat),
    maxFeePerGas: IDL.Opt(IDL.Nat),
    gasPrice: IDL.Opt(IDL.Nat),
    value: IDL.Opt(IDL.Nat),
    maxFeePerBlobGas: IDL.Opt(IDL.Nat),
    from: IDL.Opt(IDL.Text),
    type: IDL.Opt(IDL.Text),
    accessList: IDL.Opt(IDL.Vec(AccessListEntry)),
    nonce: IDL.Opt(IDL.Nat),
    maxPriorityFeePerGas: IDL.Opt(IDL.Nat),
    blobs: IDL.Opt(IDL.Vec(IDL.Text)),
    input: IDL.Opt(IDL.Text),
    chainId: IDL.Opt(IDL.Nat),
    blobVersionedHashes: IDL.Opt(IDL.Vec(IDL.Text)),
  });
  const BlockTag = IDL.Variant({
    Earliest: IDL.Null,
    Safe: IDL.Null,
    Finalized: IDL.Null,
    Latest: IDL.Null,
    Number: IDL.Nat,
    Pending: IDL.Null,
  });
  const CallArgs = IDL.Record({
    transaction: TransactionRequest,
    block: IDL.Opt(BlockTag),
  });
  const JsonRpcError = IDL.Record({ code: IDL.Int64, message: IDL.Text });
  const ProviderError = IDL.Variant({
    TooFewCycles: IDL.Record({ expected: IDL.Nat, received: IDL.Nat }),
    InvalidRpcConfig: IDL.Text,
    MissingRequiredProvider: IDL.Null,
    ProviderNotFound: IDL.Null,
    NoPermission: IDL.Null,
  });
  const ValidationError = IDL.Variant({
    Custom: IDL.Text,
    InvalidHex: IDL.Text,
  });
  const RejectionCode = IDL.Variant({
    NoError: IDL.Null,
    CanisterError: IDL.Null,
    SysTransient: IDL.Null,
    DestinationInvalid: IDL.Null,
    Unknown: IDL.Null,
    SysFatal: IDL.Null,
    CanisterReject: IDL.Null,
  });
  const HttpOutcallError = IDL.Variant({
    IcError: IDL.Record({ code: RejectionCode, message: IDL.Text }),
    InvalidHttpJsonRpcResponse: IDL.Record({
      status: IDL.Nat16,
      body: IDL.Text,
      parsingError: IDL.Opt(IDL.Text),
    }),
  });
  const RpcError = IDL.Variant({
    JsonRpcError: JsonRpcError,
    ProviderError: ProviderError,
    ValidationError: ValidationError,
    HttpOutcallError: HttpOutcallError,
  });
  const CallResult = IDL.Variant({ Ok: IDL.Text, Err: RpcError });
  const ProviderId = IDL.Nat64;
  const RpcService = IDL.Variant({
    EthSepolia: EthSepoliaService,
    BaseMainnet: L2MainnetService,
    Custom: RpcApi,
    OptimismMainnet: L2MainnetService,
    ArbitrumOne: L2MainnetService,
    EthMainnet: EthMainnetService,
    Provider: ProviderId,
  });
  const MultiCallResult = IDL.Variant({
    Consistent: CallResult,
    Inconsistent: IDL.Vec(IDL.Tuple(RpcService, CallResult)),
  });
  const FeeHistoryArgs = IDL.Record({
    blockCount: IDL.Nat,
    newestBlock: BlockTag,
    rewardPercentiles: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const FeeHistory = IDL.Record({
    reward: IDL.Vec(IDL.Vec(IDL.Nat)),
    gasUsedRatio: IDL.Vec(IDL.Float64),
    oldestBlock: IDL.Nat,
    baseFeePerGas: IDL.Vec(IDL.Nat),
  });
  const FeeHistoryResult = IDL.Variant({ Ok: FeeHistory, Err: RpcError });
  const MultiFeeHistoryResult = IDL.Variant({
    Consistent: FeeHistoryResult,
    Inconsistent: IDL.Vec(IDL.Tuple(RpcService, FeeHistoryResult)),
  });
  const Block = IDL.Record({
    miner: IDL.Text,
    totalDifficulty: IDL.Opt(IDL.Nat),
    receiptsRoot: IDL.Text,
    stateRoot: IDL.Text,
    hash: IDL.Text,
    difficulty: IDL.Opt(IDL.Nat),
    size: IDL.Nat,
    uncles: IDL.Vec(IDL.Text),
    baseFeePerGas: IDL.Opt(IDL.Nat),
    extraData: IDL.Text,
    transactionsRoot: IDL.Opt(IDL.Text),
    sha3Uncles: IDL.Text,
    nonce: IDL.Nat,
    number: IDL.Nat,
    timestamp: IDL.Nat,
    transactions: IDL.Vec(IDL.Text),
    gasLimit: IDL.Nat,
    logsBloom: IDL.Text,
    parentHash: IDL.Text,
    gasUsed: IDL.Nat,
    mixHash: IDL.Text,
  });
  const GetBlockByNumberResult = IDL.Variant({
    Ok: Block,
    Err: RpcError,
  });
  const MultiGetBlockByNumberResult = IDL.Variant({
    Consistent: GetBlockByNumberResult,
    Inconsistent: IDL.Vec(IDL.Tuple(RpcService, GetBlockByNumberResult)),
  });
  const Topic = IDL.Vec(IDL.Text);
  const GetLogsArgs = IDL.Record({
    fromBlock: IDL.Opt(BlockTag),
    toBlock: IDL.Opt(BlockTag),
    addresses: IDL.Vec(IDL.Text),
    topics: IDL.Opt(IDL.Vec(Topic)),
  });
  const LogEntry = IDL.Record({
    transactionHash: IDL.Opt(IDL.Text),
    blockNumber: IDL.Opt(IDL.Nat),
    data: IDL.Text,
    blockHash: IDL.Opt(IDL.Text),
    transactionIndex: IDL.Opt(IDL.Nat),
    topics: IDL.Vec(IDL.Text),
    address: IDL.Text,
    logIndex: IDL.Opt(IDL.Nat),
    removed: IDL.Bool,
  });
  const GetLogsResult = IDL.Variant({
    Ok: IDL.Vec(LogEntry),
    Err: RpcError,
  });
  const MultiGetLogsResult = IDL.Variant({
    Consistent: GetLogsResult,
    Inconsistent: IDL.Vec(IDL.Tuple(RpcService, GetLogsResult)),
  });
  const GetTransactionCountArgs = IDL.Record({
    address: IDL.Text,
    block: BlockTag,
  });
  const GetTransactionCountResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: RpcError,
  });
  const MultiGetTransactionCountResult = IDL.Variant({
    Consistent: GetTransactionCountResult,
    Inconsistent: IDL.Vec(IDL.Tuple(RpcService, GetTransactionCountResult)),
  });
  const TransactionReceipt = IDL.Record({
    to: IDL.Opt(IDL.Text),
    status: IDL.Opt(IDL.Nat),
    transactionHash: IDL.Text,
    blockNumber: IDL.Nat,
    from: IDL.Text,
    logs: IDL.Vec(LogEntry),
    blockHash: IDL.Text,
    type: IDL.Text,
    transactionIndex: IDL.Nat,
    effectiveGasPrice: IDL.Nat,
    logsBloom: IDL.Text,
    contractAddress: IDL.Opt(IDL.Text),
    gasUsed: IDL.Nat,
  });
  const GetTransactionReceiptResult = IDL.Variant({
    Ok: IDL.Opt(TransactionReceipt),
    Err: RpcError,
  });
  const MultiGetTransactionReceiptResult = IDL.Variant({
    Consistent: GetTransactionReceiptResult,
    Inconsistent: IDL.Vec(IDL.Tuple(RpcService, GetTransactionReceiptResult)),
  });
  const SendRawTransactionStatus = IDL.Variant({
    Ok: IDL.Opt(IDL.Text),
    NonceTooLow: IDL.Null,
    NonceTooHigh: IDL.Null,
    InsufficientFunds: IDL.Null,
  });
  const SendRawTransactionResult = IDL.Variant({
    Ok: SendRawTransactionStatus,
    Err: RpcError,
  });
  const MultiSendRawTransactionResult = IDL.Variant({
    Consistent: SendRawTransactionResult,
    Inconsistent: IDL.Vec(IDL.Tuple(RpcService, SendRawTransactionResult)),
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
    mode: canister_install_mode,
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
  const RequestResult = IDL.Variant({ Ok: IDL.Text, Err: RpcError });
  const ecdsa_curve = IDL.Variant({ secp256k1: IDL.Null });
  const sign_with_ecdsa_args = IDL.Record({
    key_id: IDL.Record({ name: IDL.Text, curve: ecdsa_curve }),
    derivation_path: IDL.Vec(IDL.Vec(IDL.Nat8)),
    message_hash: IDL.Vec(IDL.Nat8),
  });
  const sign_with_ecdsa_result = IDL.Record({
    signature: IDL.Vec(IDL.Nat8),
  });
  const schnorr_aux = IDL.Variant({
    bip341: IDL.Record({ merkle_root_hash: IDL.Vec(IDL.Nat8) }),
  });
  const schnorr_algorithm = IDL.Variant({
    ed25519: IDL.Null,
    bip340secp256k1: IDL.Null,
  });
  const sign_with_schnorr_args = IDL.Record({
    aux: IDL.Opt(schnorr_aux),
    key_id: IDL.Record({
      algorithm: schnorr_algorithm,
      name: IDL.Text,
    }),
    derivation_path: IDL.Vec(IDL.Vec(IDL.Nat8)),
    message: IDL.Vec(IDL.Nat8),
  });
  const sign_with_schnorr_result = IDL.Record({
    signature: IDL.Vec(IDL.Nat8),
  });
  const Self = IDL.Service({
    GCCanisters: IDL.Func([], [], ["oneway"]),
    _ttp_request: IDL.Func([http_request_args], [http_request_result], []),
    balance: IDL.Func([], [IDL.Nat], ["query"]),
    callForward: IDL.Func(
      [CanisterInfo, IDL.Text, IDL.Vec(IDL.Nat8)],
      [IDL.Vec(IDL.Nat8)],
      [],
    ),
    canister_status: IDL.Func(
      [IDL.Record({ canister_id: canister_id })],
      [canister_status_result],
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
      [CanisterInfo, canister_install_mode],
      [],
    ),
    dump: IDL.Func([], [IDL.Vec(CanisterInfo)], ["query"]),
    eth_call: IDL.Func(
      [RpcServices, IDL.Opt(RpcConfig), CallArgs],
      [MultiCallResult],
      [],
    ),
    eth_feeHistory: IDL.Func(
      [RpcServices, IDL.Opt(RpcConfig), FeeHistoryArgs],
      [MultiFeeHistoryResult],
      [],
    ),
    eth_getBlockByNumber: IDL.Func(
      [RpcServices, IDL.Opt(RpcConfig), BlockTag],
      [MultiGetBlockByNumberResult],
      [],
    ),
    eth_getLogs: IDL.Func(
      [RpcServices, IDL.Opt(RpcConfig), GetLogsArgs],
      [MultiGetLogsResult],
      [],
    ),
    eth_getTransactionCount: IDL.Func(
      [RpcServices, IDL.Opt(RpcConfig), GetTransactionCountArgs],
      [MultiGetTransactionCountResult],
      [],
    ),
    eth_getTransactionReceipt: IDL.Func(
      [RpcServices, IDL.Opt(RpcConfig), IDL.Text],
      [MultiGetTransactionReceiptResult],
      [],
    ),
    eth_sendRawTransaction: IDL.Func(
      [RpcServices, IDL.Opt(RpcConfig), IDL.Text],
      [MultiSendRawTransactionResult],
      [],
    ),
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
          mode: canister_install_mode,
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
    request: IDL.Func([RpcService, IDL.Text, IDL.Nat64], [RequestResult], []),
    resetStats: IDL.Func([], [], []),
    sign_with_ecdsa: IDL.Func(
      [sign_with_ecdsa_args],
      [sign_with_ecdsa_result],
      [],
    ),
    sign_with_schnorr: IDL.Func(
      [sign_with_schnorr_args],
      [sign_with_schnorr_result],
      [],
    ),
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
    update_settings: IDL.Func(
      [
        IDL.Record({
          canister_id: IDL.Principal,
          settings: canister_settings,
        }),
      ],
      [],
      [],
    ),
    wallet_receive: IDL.Func([], [], []),
  });
  return Self;
};
export const init = ({ IDL }) => {
  const CyclesSettings = IDL.Record({
    max_cycles_per_call: IDL.Nat,
    max_cycles_total: IDL.Nat,
  });
  const InitParams = IDL.Record({
    max_num_canisters: IDL.Nat,
    canister_time_to_live: IDL.Nat,
    stored_module: IDL.Opt(
      IDL.Record({ arg: IDL.Vec(IDL.Nat8), hash: IDL.Vec(IDL.Nat8) }),
    ),
    cycles_settings: IDL.Opt(CyclesSettings),
    wasm_utils_principal: IDL.Opt(IDL.Text),
    cycles_per_canister: IDL.Nat,
    admin_only: IDL.Opt(IDL.Bool),
    nonce_time_to_live: IDL.Nat,
    max_family_tree_size: IDL.Nat,
  });
  return [IDL.Opt(InitParams)];
};
