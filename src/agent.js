import { Actor, HttpAgent, Principal, IDL } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import wallet_idl from './wallet.did';
import ic_idl from './ic.did';
import didjs_idl from './didjs.did';

function is_local(agent) {
  const hostname = agent._host.hostname;
  return hostname === '127.0.0.1' || hostname.endsWith('localhost');
}

const seed = new Array(32).fill(0);
const identity = Ed25519KeyIdentity.generate(new Uint8Array(seed));
console.log(identity.getPrincipal().toText());
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
const ui_canister_id = is_local(agent)?'ryjl3-tyaaa-aaaaa-aaaba-cai':'a4gq6-oaaaa-aaaab-qaa4q-cai';
export const ui_canister_url = is_local(agent)?`?canisterId=${ui_canister_id}&`:`https://${ui_canister_id}.raw.ic0.app/?`;
const didjs = Actor.createActor(didjs_idl, { agent, canisterId: Principal.fromText(ui_canister_id) });
export async function didToJs(source) {
  const js = await didjs.did_to_js(source);
  if (js === []) {
    return undefined;
  }
  const dataUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(js[0]);
  const candid = await eval('import("' + dataUri + '")');
  return candid;
}

function bufferToArray(buf) {
  return [...buf];
}

class Wallet {
  constructor(canisterId) {
    this._canisterId = canisterId;
    this._wallet = Actor.createActor(wallet_idl, { agent, canisterId });
  }
  async createCanister(config) {
    const result = await this._wallet.wallet_create_canister({
      settings: {
        compute_allocation: [],
        controller: [],
        freezing_threshold: [],
        memory_allocation: [],
      },
      cycles: BigInt(105_000_000_000),      
    });
    if ("Ok" in result) {
      return result.Ok.canister_id;
    } else {
      throw result.Err;
    }
  }
  async forwardCall(canisterId, method, func, ...args) {
    const encoded = bufferToArray(IDL.encode(func.argTypes, args));
    const result = await this._wallet.wallet_call({
      args: encoded,
      cycles: BigInt(1),
      method_name: method,
      canister: canisterId,
    });
    if ("Ok" in result) {
      return IDL.decode(func.retTypes, Buffer.from(result.Ok.return));
    } else {
      throw result.Err;
    }
  }
  async install(canister_id, wasm_module, arg, mode) {
    const func = Object.fromEntries(Actor.interfaceOf(ic0)._fields)['install_code'];
    return await this.forwardCall(Principal.fromHex(''), 'install_code', func, {arg:bufferToArray(arg), wasm_module:bufferToArray(wasm_module), mode: {[mode]:null}, canister_id});
  }
}

// TODO add a config UI to update wallet id
const wallet_id = is_local(agent)?'rwlgt-iiaaa-aaaaa-aaaaa-cai':'a3hwk-dyaaa-aaaab-qaa4a-cai';
export const wallet = new Wallet(Principal.fromText(wallet_id));
