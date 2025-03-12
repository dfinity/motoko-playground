import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export interface CanisterInfo {
  id: Principal;
  name: string;
  candid: string;
}
export type HashId = bigint;
export interface NamedFile {
  content: string;
  name: string;
}
export interface PackageInfo {
  dir: [] | [string];
  name: string;
  homepage: [] | [string];
  repo: string;
  version: string;
}
export interface Project {
  files: Array<NamedFile>;
  packages: [] | [Array<PackageInfo>];
  canisters: [] | [Array<CanisterInfo>];
}
export interface Saved {
  getProject: ActorMethod<[HashId], [] | [SavedProject]>;
  getProjectsPage: ActorMethod<[bigint, bigint], Array<[HashId, SavedProject]>>;
  getStats: ActorMethod<[], StatResult>;
  putProject: ActorMethod<[Project], HashId>;
}
export interface SavedProject {
  timestamp: Time;
  project: Project;
}
export interface StatResult {
  byte_size: bigint;
  num_projects: bigint;
}
export type Time = bigint;
export interface _SERVICE extends Saved {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
