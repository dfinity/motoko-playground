import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export interface CanisterInfo {
  id: Principal;
  timestamp: bigint;
}
export interface DeployArgs {
  arg: Uint8Array | number[];
  wasm_module: Uint8Array | number[];
  bypass_wasm_transform: [] | [boolean];
}
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
  wasm_utils_principal: [] | [string];
  cycles_per_canister: bigint;
  admin_only: [] | [boolean];
  nonce_time_to_live: bigint;
  max_family_tree_size: bigint;
}
export interface InstallArgs {
  arg: Uint8Array | number[];
  wasm_module: Uint8Array | number[];
  mode: { reinstall: null } | { upgrade: null } | { install: null };
  canister_id: Principal;
}
export interface InstallConfig {
  origin: { origin: string; tags: Array<string> };
  profiling: boolean;
  is_whitelisted: boolean;
  start_page: [] | [number];
  page_limit: [] | [number];
}
export interface Nonce {
  nonce: bigint;
  timestamp: bigint;
}
export interface Origin {
  origin: string;
  tags: Array<string>;
}
export interface Self {
  GCCanisters: ActorMethod<[], undefined>;
  __transform: ActorMethod<
    [{ context: Uint8Array | number[]; response: http_request_result }],
    http_request_result
  >;
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
    [CanisterInfo, { reinstall: null } | { upgrade: null } | { install: null }]
  >;
  dump: ActorMethod<[], Array<CanisterInfo>>;
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
        mode: { reinstall: null } | { upgrade: null } | { install: null };
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
  resetStats: ActorMethod<[], undefined>;
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
export interface Stats {
  num_of_installs: bigint;
  num_of_canisters: bigint;
  error_mismatch: bigint;
  error_out_of_capacity: bigint;
  cycles_used: bigint;
  error_total_wait_time: bigint;
}
export type canister_id = Principal;
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
