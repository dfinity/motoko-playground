import {
  Actor,
  HttpAgent,
  ActorSubclass,
  CanisterStatus,
} from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { idlFactory, canisterId } from "../declarations/backend";
import { _SERVICE as BackendService } from "../declarations/backend/backend.did";
import {
  idlFactory as savedIdlFactory,
  canisterId as savedCanisterId,
} from "../declarations/saved";
import { _SERVICE as SavedService } from "../declarations/saved/saved.did";

import { idlFactory as didjs_idl } from "./didjs.did";

const LOCAL_PORT = 4943;

const hostname = window.location.hostname;
const local = hostname === "127.0.0.1" || hostname.endsWith("localhost");
// only enable when testing webcontainer upload
//const local = false;

export const agent = HttpAgent.createSync({
  // Prefer calling local replica directly instead of CRA proxy
  host: local ? `http://localhost:${LOCAL_PORT}` : "https://icp-api.io",
});
if (local) {
  agent.fetchRootKey();
}

export const backend: ActorSubclass<BackendService> = Actor.createActor(
  idlFactory,
  { agent, canisterId },
);
export const saved: ActorSubclass<SavedService> = Actor.createActor(
  savedIdlFactory,
  {
    agent,
    canisterId: savedCanisterId,
  },
);

const uiCanisterId =
  process.env.__CANDID_UI_CANISTER_ID ||
  (local ? "bnz7o-iuaaa-aaaaa-qaaaa-cai" : "a4gq6-oaaaa-aaaab-qaa4q-cai");
export const uiCanisterUrl = local
  ? `http://${uiCanisterId}.localhost:${LOCAL_PORT}`
  : `https://${uiCanisterId}.raw.icp0.io`;
export const didjs: ActorSubclass<any> = Actor.createActor(didjs_idl, {
  agent,
  canisterId: Principal.fromText(uiCanisterId),
});

async function getDidFromMetadata(
  canisterId: Principal,
): Promise<null | string> {
  const status = await CanisterStatus.request({
    agent,
    canisterId,
    paths: ["candid"],
  });
  const did = status.get("candid");
  return did as any;
}
async function getDidFromTmpHack(canisterId: Principal) {
  const common_interface: IDL.InterfaceFactory = ({ IDL }) =>
    IDL.Service({
      __get_candid_interface_tmp_hack: IDL.Func([], [IDL.Text], ["query"]),
    });
  const actor: ActorSubclass = Actor.createActor(common_interface, {
    agent,
    canisterId,
  });
  const candid_source = await actor.__get_candid_interface_tmp_hack();
  return candid_source;
}
export async function fetchCandidInterface(canisterId: Principal) {
  const did = await getDidFromMetadata(canisterId);
  if (did) {
    return did;
  }
  return await getDidFromTmpHack(canisterId);
}

export async function didToJs(source: string) {
  const js = (await didjs.did_to_js(source)) as any;
  if (Array.isArray(js) && js.length === 0) {
    return undefined;
  }
  const blob = new Blob([js[0]], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);

  try {
    // Dynamically import the module
    const module = await import(/* @vite-ignore */ url);
    return module;
  } finally {
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }
}
