import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory, canisterId } from "dfx-generated/backend";

import didjs_idl from "../didjs.did";
import dfxConfig from "../../dfx.json";

function is_local(agent) {
  const hostname = agent._host.hostname;
  return hostname === '127.0.0.1' || hostname.endsWith('localhost');  
}

let _actor = null;
export const agent = new HttpAgent({});

export async function createActor() {
  if (is_local(agent)) {
    await agent.fetchRootKey();
  }
  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
  return actor;
}

export const getActor = async () => {
  if (_actor) return Promise.resolve(_actor);
  const actor = await createActor();
  _actor = actor;
  return actor;
};

const uiCanisterId = is_local(agent)
  ? "r7inp-6aaaa-aaaaa-aaabq-cai"
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
