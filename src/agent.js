import { Actor, HttpAgent, Principal } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import wallet_idl from './wallet.did';
import ic_idl from './ic.did';

function is_local(hostname) {
  return hostname === '127.0.0.1' || hostname.endsWith('localhost');
}

const identity = Ed25519KeyIdentity.generate();
export const agent = new HttpAgent({identity});
async function initAgent() {
  if (is_local(agent._host.hostname)) {
    await agent.fetchRootKey();
    console.log('fetchRootKey');
  }  
}
initAgent();

export const ic0 = Actor.createActor(ic_idl, { agent, canisterId: Principal.fromHex('') });

export function getWallet(canisterId) {
  return Actor.createActor(wallet_idl, { agent, canisterId });
}
