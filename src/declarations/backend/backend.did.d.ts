import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export interface AccessListEntry {
  storageKeys: Array<string>;
  address: string;
}
export interface Block {
  miner: string;
  totalDifficulty: [] | [bigint];
  receiptsRoot: string;
  stateRoot: string;
  hash: string;
  difficulty: [] | [bigint];
  size: bigint;
  uncles: Array<string>;
  baseFeePerGas: [] | [bigint];
  extraData: string;
  transactionsRoot: [] | [string];
  sha3Uncles: string;
  nonce: bigint;
  number: bigint;
  timestamp: bigint;
  transactions: Array<string>;
  gasLimit: bigint;
  logsBloom: string;
  parentHash: string;
  gasUsed: bigint;
  mixHash: string;
}
export type BlockTag =
  | { Earliest: null }
  | { Safe: null }
  | { Finalized: null }
  | { Latest: null }
  | { Number: bigint }
  | { Pending: null };
export interface CallArgs {
  transaction: TransactionRequest;
  block: [] | [BlockTag];
}
export type CallResult = { Ok: string } | { Err: RpcError };
export interface CanisterInfo {
  id: Principal;
  timestamp: bigint;
}
export type ChainId = bigint;
export type ConsensusStrategy =
  | { Equality: null }
  | { Threshold: { min: number; total: [] | [number] } };
export interface CyclesSettings {
  max_cycles_per_call: bigint;
  max_cycles_total: bigint;
}
export interface DeployArgs {
  arg: Uint8Array | number[];
  wasm_module: Uint8Array | number[];
  bypass_wasm_transform: [] | [boolean];
  mode: [] | [canister_install_mode];
}
export type EthMainnetService =
  | { Alchemy: null }
  | { Llama: null }
  | { BlockPi: null }
  | { Cloudflare: null }
  | { PublicNode: null }
  | { Ankr: null };
export type EthSepoliaService =
  | { Alchemy: null }
  | { BlockPi: null }
  | { PublicNode: null }
  | { Ankr: null }
  | { Sepolia: null };
export interface FeeHistory {
  reward: Array<Array<bigint>>;
  gasUsedRatio: Array<number>;
  oldestBlock: bigint;
  baseFeePerGas: Array<bigint>;
}
export interface FeeHistoryArgs {
  blockCount: bigint;
  newestBlock: BlockTag;
  rewardPercentiles: [] | [Uint8Array | number[]];
}
export type FeeHistoryResult = { Ok: FeeHistory } | { Err: RpcError };
export type GetBlockByNumberResult = { Ok: Block } | { Err: RpcError };
export interface GetLogsArgs {
  fromBlock: [] | [BlockTag];
  toBlock: [] | [BlockTag];
  addresses: Array<string>;
  topics: [] | [Array<Topic>];
}
export type GetLogsResult = { Ok: Array<LogEntry> } | { Err: RpcError };
export interface GetTransactionCountArgs {
  address: string;
  block: BlockTag;
}
export type GetTransactionCountResult = { Ok: bigint } | { Err: RpcError };
export type GetTransactionReceiptResult =
  | { Ok: [] | [TransactionReceipt] }
  | { Err: RpcError };
export interface HttpHeader {
  value: string;
  name: string;
}
export type HttpOutcallError =
  | {
      IcError: { code: RejectionCode; message: string };
    }
  | {
      InvalidHttpJsonRpcResponse: {
        status: number;
        body: string;
        parsingError: [] | [string];
      };
    };
export interface HttpRequest {
  url: string;
  method: string;
  body: Uint8Array | number[];
  headers: Array<[string, string]>;
}
export interface HttpResponse {
  body: Uint8Array | number[];
  headers: Array<[string, string]>;
  status_code: number;
}
export interface InitParams {
  max_num_canisters: bigint;
  canister_time_to_live: bigint;
  stored_module:
    | []
    | [{ arg: Uint8Array | number[]; hash: Uint8Array | number[] }];
  cycles_settings: [] | [CyclesSettings];
  wasm_utils_principal: [] | [string];
  cycles_per_canister: bigint;
  admin_only: [] | [boolean];
  nonce_time_to_live: bigint;
  max_family_tree_size: bigint;
}
export interface InstallArgs {
  arg: Uint8Array | number[];
  wasm_module: Uint8Array | number[];
  mode: canister_install_mode;
  canister_id: Principal;
}
export interface InstallConfig {
  origin: { origin: string; tags: Array<string> };
  profiling: boolean;
  is_whitelisted: boolean;
  start_page: [] | [number];
  page_limit: [] | [number];
}
export interface JsonRpcError {
  code: bigint;
  message: string;
}
export type L2MainnetService =
  | { Alchemy: null }
  | { Llama: null }
  | { BlockPi: null }
  | { PublicNode: null }
  | { Ankr: null };
export interface LogEntry {
  transactionHash: [] | [string];
  blockNumber: [] | [bigint];
  data: string;
  blockHash: [] | [string];
  transactionIndex: [] | [bigint];
  topics: Array<string>;
  address: string;
  logIndex: [] | [bigint];
  removed: boolean;
}
export type MultiCallResult =
  | { Consistent: CallResult }
  | { Inconsistent: Array<[RpcService, CallResult]> };
export type MultiFeeHistoryResult =
  | { Consistent: FeeHistoryResult }
  | { Inconsistent: Array<[RpcService, FeeHistoryResult]> };
export type MultiGetBlockByNumberResult =
  | {
      Consistent: GetBlockByNumberResult;
    }
  | { Inconsistent: Array<[RpcService, GetBlockByNumberResult]> };
export type MultiGetLogsResult =
  | { Consistent: GetLogsResult }
  | { Inconsistent: Array<[RpcService, GetLogsResult]> };
export type MultiGetTransactionCountResult =
  | {
      Consistent: GetTransactionCountResult;
    }
  | { Inconsistent: Array<[RpcService, GetTransactionCountResult]> };
export type MultiGetTransactionReceiptResult =
  | {
      Consistent: GetTransactionReceiptResult;
    }
  | { Inconsistent: Array<[RpcService, GetTransactionReceiptResult]> };
export type MultiSendRawTransactionResult =
  | {
      Consistent: SendRawTransactionResult;
    }
  | { Inconsistent: Array<[RpcService, SendRawTransactionResult]> };
export interface Nonce {
  nonce: bigint;
  timestamp: bigint;
}
export interface Origin {
  origin: string;
  tags: Array<string>;
}
export type ProviderError =
  | {
      TooFewCycles: { expected: bigint; received: bigint };
    }
  | { InvalidRpcConfig: string }
  | { MissingRequiredProvider: null }
  | { ProviderNotFound: null }
  | { NoPermission: null };
export type ProviderId = bigint;
export type RejectionCode =
  | { NoError: null }
  | { CanisterError: null }
  | { SysTransient: null }
  | { DestinationInvalid: null }
  | { Unknown: null }
  | { SysFatal: null }
  | { CanisterReject: null };
export type RequestResult = { Ok: string } | { Err: RpcError };
export interface RpcApi {
  url: string;
  headers: [] | [Array<HttpHeader>];
}
export interface RpcConfig {
  responseConsensus: [] | [ConsensusStrategy];
  responseSizeEstimate: [] | [bigint];
}
export type RpcError =
  | { JsonRpcError: JsonRpcError }
  | { ProviderError: ProviderError }
  | { ValidationError: ValidationError }
  | { HttpOutcallError: HttpOutcallError };
export type RpcService =
  | { EthSepolia: EthSepoliaService }
  | { BaseMainnet: L2MainnetService }
  | { Custom: RpcApi }
  | { OptimismMainnet: L2MainnetService }
  | { ArbitrumOne: L2MainnetService }
  | { EthMainnet: EthMainnetService }
  | { Provider: ProviderId };
export type RpcServices =
  | { EthSepolia: [] | [Array<EthSepoliaService>] }
  | { BaseMainnet: [] | [Array<L2MainnetService>] }
  | { Custom: { chainId: ChainId; services: Array<RpcApi> } }
  | { OptimismMainnet: [] | [Array<L2MainnetService>] }
  | { ArbitrumOne: [] | [Array<L2MainnetService>] }
  | { EthMainnet: [] | [Array<EthMainnetService>] };
export interface Self {
  GCCanisters: ActorMethod<[], undefined>;
  _ttp_request: ActorMethod<[http_request_args], http_request_result>;
  balance: ActorMethod<[], bigint>;
  callForward: ActorMethod<
    [CanisterInfo, string, Uint8Array | number[]],
    Uint8Array | number[]
  >;
  canister_status: ActorMethod<
    [{ canister_id: canister_id }],
    canister_status_result
  >;
  create_canister: ActorMethod<
    [{ settings: [] | [canister_settings] }],
    { canister_id: canister_id }
  >;
  deleteSnapshot: ActorMethod<[CanisterInfo], undefined>;
  delete_canister: ActorMethod<[{ canister_id: canister_id }], undefined>;
  delete_canister_snapshot: ActorMethod<
    [{ canister_id: Principal; snapshot_id: Uint8Array | number[] }],
    undefined
  >;
  deployCanister: ActorMethod<
    [[] | [CanisterInfo], [] | [DeployArgs]],
    [CanisterInfo, canister_install_mode]
  >;
  dump: ActorMethod<[], Array<CanisterInfo>>;
  eth_call: ActorMethod<
    [RpcServices, [] | [RpcConfig], CallArgs],
    MultiCallResult
  >;
  eth_feeHistory: ActorMethod<
    [RpcServices, [] | [RpcConfig], FeeHistoryArgs],
    MultiFeeHistoryResult
  >;
  eth_getBlockByNumber: ActorMethod<
    [RpcServices, [] | [RpcConfig], BlockTag],
    MultiGetBlockByNumberResult
  >;
  eth_getLogs: ActorMethod<
    [RpcServices, [] | [RpcConfig], GetLogsArgs],
    MultiGetLogsResult
  >;
  eth_getTransactionCount: ActorMethod<
    [RpcServices, [] | [RpcConfig], GetTransactionCountArgs],
    MultiGetTransactionCountResult
  >;
  eth_getTransactionReceipt: ActorMethod<
    [RpcServices, [] | [RpcConfig], string],
    MultiGetTransactionReceiptResult
  >;
  eth_sendRawTransaction: ActorMethod<
    [RpcServices, [] | [RpcConfig], string],
    MultiSendRawTransactionResult
  >;
  getCanisterId: ActorMethod<[Nonce, Origin], CanisterInfo>;
  getInitParams: ActorMethod<[], InitParams>;
  getStats: ActorMethod<
    [],
    [Stats, Array<[string, bigint]>, Array<[string, bigint]>]
  >;
  getSubtree: ActorMethod<
    [CanisterInfo],
    Array<[Principal, Array<CanisterInfo>]>
  >;
  http_request: ActorMethod<[HttpRequest], HttpResponse>;
  installCode: ActorMethod<
    [CanisterInfo, InstallArgs, InstallConfig],
    CanisterInfo
  >;
  installExternalCanister: ActorMethod<[InstallArgs], undefined>;
  installStoredWasm: ActorMethod<
    [CanisterInfo, InstallArgs, Origin],
    CanisterInfo
  >;
  install_code: ActorMethod<
    [
      {
        arg: Uint8Array | number[];
        wasm_module: wasm_module;
        mode: canister_install_mode;
        canister_id: canister_id;
      },
    ],
    undefined
  >;
  listSnapshots: ActorMethod<[CanisterInfo], Array<snapshot>>;
  list_canister_snapshots: ActorMethod<
    [{ canister_id: Principal }],
    Array<snapshot>
  >;
  loadSnapshot: ActorMethod<[CanisterInfo], undefined>;
  load_canister_snapshot: ActorMethod<[{}], undefined>;
  mergeTags: ActorMethod<[string, [] | [string]], undefined>;
  releaseAllCanisters: ActorMethod<[], undefined>;
  removeCode: ActorMethod<[CanisterInfo], undefined>;
  request: ActorMethod<[RpcService, string, bigint], RequestResult>;
  resetStats: ActorMethod<[], undefined>;
  sign_with_ecdsa: ActorMethod<[sign_with_ecdsa_args], sign_with_ecdsa_result>;
  sign_with_schnorr: ActorMethod<
    [sign_with_schnorr_args],
    sign_with_schnorr_result
  >;
  start_canister: ActorMethod<[{ canister_id: canister_id }], undefined>;
  stop_canister: ActorMethod<[{ canister_id: canister_id }], undefined>;
  takeSnapshot: ActorMethod<[CanisterInfo], [] | [Uint8Array | number[]]>;
  take_canister_snapshot: ActorMethod<
    [
      {
        replace_snapshot: [] | [Uint8Array | number[]];
        canister_id: Principal;
      },
    ],
    snapshot
  >;
  transferOwnership: ActorMethod<[CanisterInfo, Array<Principal>], undefined>;
  uninstall_code: ActorMethod<[{ canister_id: canister_id }], undefined>;
  update_settings: ActorMethod<
    [{ canister_id: Principal; settings: canister_settings }],
    undefined
  >;
  wallet_receive: ActorMethod<[], undefined>;
}
export type SendRawTransactionResult =
  | { Ok: SendRawTransactionStatus }
  | { Err: RpcError };
export type SendRawTransactionStatus =
  | { Ok: [] | [string] }
  | { NonceTooLow: null }
  | { NonceTooHigh: null }
  | { InsufficientFunds: null };
export interface Stats {
  num_of_installs: bigint;
  num_of_canisters: bigint;
  error_mismatch: bigint;
  error_out_of_capacity: bigint;
  cycles_used: bigint;
  error_total_wait_time: bigint;
}
export type Topic = Array<string>;
export interface TransactionReceipt {
  to: [] | [string];
  status: [] | [bigint];
  transactionHash: string;
  blockNumber: bigint;
  from: string;
  logs: Array<LogEntry>;
  blockHash: string;
  type: string;
  transactionIndex: bigint;
  effectiveGasPrice: bigint;
  logsBloom: string;
  contractAddress: [] | [string];
  gasUsed: bigint;
}
export interface TransactionRequest {
  to: [] | [string];
  gas: [] | [bigint];
  maxFeePerGas: [] | [bigint];
  gasPrice: [] | [bigint];
  value: [] | [bigint];
  maxFeePerBlobGas: [] | [bigint];
  from: [] | [string];
  type: [] | [string];
  accessList: [] | [Array<AccessListEntry>];
  nonce: [] | [bigint];
  maxPriorityFeePerGas: [] | [bigint];
  blobs: [] | [Array<string>];
  input: [] | [string];
  chainId: [] | [bigint];
  blobVersionedHashes: [] | [Array<string>];
}
export type ValidationError = { Custom: string } | { InvalidHex: string };
export type canister_id = Principal;
export type canister_install_mode =
  | { reinstall: null }
  | {
      upgrade:
        | []
        | [
            {
              wasm_memory_persistence:
                | []
                | [{ keep: null } | { replace: null }];
            },
          ];
    }
  | { install: null };
export interface canister_settings {
  freezing_threshold: [] | [bigint];
  controllers: [] | [Array<Principal>];
  log_visibility: [] | [log_visibility];
  wasm_memory_limit: [] | [bigint];
  memory_allocation: [] | [bigint];
  compute_allocation: [] | [bigint];
}
export interface canister_status_result {
  status: { stopped: null } | { stopping: null } | { running: null };
  memory_size: bigint;
  cycles: bigint;
  settings: definite_canister_settings;
  query_stats: {
    response_payload_bytes_total: bigint;
    num_instructions_total: bigint;
    num_calls_total: bigint;
    request_payload_bytes_total: bigint;
  };
  idle_cycles_burned_per_day: bigint;
  module_hash: [] | [Uint8Array | number[]];
  reserved_cycles: bigint;
}
export interface definite_canister_settings {
  freezing_threshold: bigint;
  controllers: Array<Principal>;
  log_visibility: log_visibility;
  wasm_memory_limit: bigint;
  memory_allocation: bigint;
  compute_allocation: bigint;
}
export type ecdsa_curve = { secp256k1: null };
export interface http_header {
  value: string;
  name: string;
}
export interface http_request_args {
  url: string;
  method: { get: null } | { head: null } | { post: null };
  max_response_bytes: [] | [bigint];
  body: [] | [Uint8Array | number[]];
  transform:
    | []
    | [{ function: transform_function; context: Uint8Array | number[] }];
  headers: Array<http_header>;
}
export interface http_request_result {
  status: bigint;
  body: Uint8Array | number[];
  headers: Array<http_header>;
}
export type log_visibility = { controllers: null } | { public: null };
export type schnorr_algorithm = { ed25519: null } | { bip340secp256k1: null };
export type schnorr_aux = {
  bip341: { merkle_root_hash: Uint8Array | number[] };
};
export interface sign_with_ecdsa_args {
  key_id: { name: string; curve: ecdsa_curve };
  derivation_path: Array<Uint8Array | number[]>;
  message_hash: Uint8Array | number[];
}
export interface sign_with_ecdsa_result {
  signature: Uint8Array | number[];
}
export interface sign_with_schnorr_args {
  aux: [] | [schnorr_aux];
  key_id: { algorithm: schnorr_algorithm; name: string };
  derivation_path: Array<Uint8Array | number[]>;
  message: Uint8Array | number[];
}
export interface sign_with_schnorr_result {
  signature: Uint8Array | number[];
}
export interface snapshot {
  id: snapshot_id;
  total_size: bigint;
  taken_at_timestamp: bigint;
}
export type snapshot_id = Uint8Array | number[];
export type transform_function = ActorMethod<
  [{ context: Uint8Array | number[]; response: http_request_result }],
  http_request_result
>;
export type wasm_module = Uint8Array | number[];
export interface _SERVICE extends Self {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
