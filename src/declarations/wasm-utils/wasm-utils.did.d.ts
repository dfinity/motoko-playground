import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export interface Config {
  backend_canister_id: [] | [Principal];
  remove_cycles_add: boolean;
  profiling: [] | [{ start_page: [] | [number]; page_limit: [] | [number] }];
  limit_stable_memory_page: [] | [number];
  limit_heap_memory_page: [] | [number];
}
export interface _SERVICE {
  is_whitelisted: ActorMethod<[Uint8Array | number[]], Uint8Array | number[]>;
  transform: ActorMethod<
    [Uint8Array | number[], Config],
    Uint8Array | number[]
  >;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
