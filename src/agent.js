import { Actor, HttpAgent, Principal } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import wallet_idl from './wallet.did';
import ic_idl from './ic.did';
import didjs_idl from './didjs.did';

function is_local(agent) {
  const hostname = agent._host.hostname;
  return hostname === '127.0.0.1' || hostname.endsWith('localhost');
}

const identity = Ed25519KeyIdentity.generate();
export const agent = new HttpAgent({identity});
async function initAgent() {
  if (is_local(agent)) {
    await agent.fetchRootKey();
    console.log('fetchRootKey');
  }  
}
initAgent();

export const ic0 = Actor.createActor(ic_idl, { agent, canisterId: Principal.fromHex('') });
// TODO: With DNS, we don't need to hard code the canister id.
export const didjs_id = is_local(agent)?'ryjl3-tyaaa-aaaaa-aaaba-cai':'a4gq6-oaaaa-aaaab-qaa4q-cai';
export const didjs = Actor.createActor(didjs_idl, { agent, canisterId: Principal.fromText(didjs_id) });
export async function didToJs(source) {
  const js = await didjs.did_to_js(source);
  if (js === []) {
    return undefined;
  }
  const dataUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(js[0]);
  const candid = await eval('import("' + dataUri + '")');
  return candid;
}

export function getWallet(canisterId) {
  return Actor.createActor(wallet_idl, { agent, canisterId });
}
