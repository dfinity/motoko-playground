import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory, canisterId } from "dfx-generated/backend";
import { idlFactory as savedIdlFactory, canisterId as savedCanisterId } from "dfx-generated/saved";

import didjs_idl from "../didjs.did";
import dfxConfig from "../../dfx.json";

function is_local(agent) {
  const hostname = agent._host.hostname;
  return hostname === '127.0.0.1' || hostname.endsWith('localhost');  
}

export const agent = new HttpAgent({});
if (is_local(agent)) {
  agent.fetchRootKey();
}
/**
 * @type {import("@dfinity/agent").ActorSubclass<import("./backend.did.js")._SERVICE>}
 */
export const backend = Actor.createActor(idlFactory, { agent, canisterId });
/**
 * @type {import("@dfinity/agent").ActorSubclass<import("./saved.did.js")._SERVICE>}
 */
export const saved = Actor.createActor(savedIdlFactory, { agent, savedCanisterId });

const uiCanisterId = is_local(agent)
  ? "rno2w-sqaaa-aaaaa-aaacq-cai"
  : "a4gq6-oaaaa-aaaab-qaa4q-cai";
export const uiCanisterUrl = is_local(agent)
  ? `http://${uiCanisterId}.${dfxConfig.networks.local.bind}`
  : `https://${uiCanisterId}.raw.ic0.app`;
const didjs = Actor.createActor(didjs_idl, {
  agent,
  canisterId: Principal.fromText(uiCanisterId),
});

export function getUiCanisterUrl(canisterId) {
  return is_local(agent)
    ? `http://${canisterId}.${dfxConfig.networks.local.bind}`
    : `https://${canisterId}.raw.ic0.app/?`;
}

export async function didToJs(source) {
  const js = await didjs.did_to_js(source);
  if (js === []) {
    return undefined;
  }
  const dataUri =
    "data:text/javascript;charset=utf-8," + encodeURIComponent(js[0]);
  const candid = await eval('import("' + dataUri + '")');
  return candid;
}
