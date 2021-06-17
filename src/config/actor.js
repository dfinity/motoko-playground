import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory, canisterId } from "dfx-generated/backend";

import didjs_idl from "../didjs.did";

// import didjs_idl from "./didjs.did";

// Since we're using webpack-dev-server as part of create-react-app, we need to
// add its port to our HttpAgent config as the host.
import dfxConfig from "../../dfx.json";

const DFX_NETWORK = process.env.DFX_NETWORK || "local";
const isLocalEnv = DFX_NETWORK === "local";

function getHost() {
  // Setting host to undefined will default to the window location
  return DFX_NETWORK === "local"
    ? `http://${dfxConfig.networks.local.bind}`
    : undefined;
}

const host = getHost();
let _actor = null;
// TODO add annon identity to agent?
export const agent = new HttpAgent({ host });

export async function createActor() {
  if (isLocalEnv) {
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

// TODO how will this work?
const uiCanisterId = isLocalEnv
  ? "r7inp-6aaaa-aaaaa-aaabq-cai"
  : "a4gq6-oaaaa-aaaab-qaa4q-cai";
export const uiCanisterUrl = isLocalEnv
  ? `http://${uiCanisterId}.${dfxConfig.networks.local.bind}`
  : `https://${uiCanisterId}.raw.ic0.app/?`;
const didjs = Actor.createActor(didjs_idl, {
  agent,
  canisterId: Principal.fromText(uiCanisterId),
});

export function getUiCanisterUrl(canisterId) {
  return isLocalEnv
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
