import { Actor, HttpAgent, ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { idlFactory, canisterId } from "../declarations/backend";
import {
  idlFactory as savedIdlFactory,
  canisterId as savedCanisterId,
} from "../declarations/saved";

import { idlFactory as didjs_idl } from "../didjs.did";

const LOCAL_PORT = 4943;

const hostname = window.location.hostname;
const local = hostname === "127.0.0.1" || hostname.endsWith("localhost");

export const agent = new HttpAgent({
  // Prefer calling local replica directly instead of CRA proxy
  host: local ? `http://localhost:${LOCAL_PORT}` : "https://icp-api.io",
});
if (local) {
  agent.fetchRootKey();
}
/**
 * @type {import("@dfinity/agent").ActorSubclass<import("../declarations/backend/backend.did.js")._SERVICE>}
 */
export const backend = Actor.createActor(idlFactory, { agent, canisterId });
/**
 * @type {import("@dfinity/agent").ActorSubclass<import("../declarations/saved/saved.did.js")._SERVICE>}
 */
export const saved = Actor.createActor(savedIdlFactory, {
  agent,
  canisterId: savedCanisterId,
});

const uiCanisterId =
  process.env.__CANDID_UI_CANISTER_ID ||
  (local ? "bw4dl-smaaa-aaaaa-qaacq-cai" : "a4gq6-oaaaa-aaaab-qaa4q-cai");
export const uiCanisterUrl = local
  ? `http://${uiCanisterId}.localhost:${LOCAL_PORT}`
  : `https://${uiCanisterId}.raw.icp0.io`;
export const didjs = Actor.createActor(didjs_idl, {
  agent,
  canisterId: Principal.fromText(uiCanisterId),
});

export async function fetchCandidInterface(canisterId) {
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

export async function didToJs(source) {
  const js = await didjs.did_to_js(source);
  if (js === []) {
    return undefined;
  }
  const dataUri =
    "data:text/javascript;charset=utf-8," + encodeURIComponent(js[0]);
  // eslint-disable-next-line no-eval
  const candid = await eval('import("' + dataUri + '")');
  return candid;
}
