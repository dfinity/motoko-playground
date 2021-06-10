import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory, canisterId } from "dfx-generated/motoko_app";

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

export async function createActor() {
  const agent = new HttpAgent({ host });
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
