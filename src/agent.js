import { HttpAgent, makeNonceTransform } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';

function is_local(hostname) {
  return hostname === '127.0.0.1' || hostname.endsWith('localhost');
}

const identity = Ed25519KeyIdentity.generate();
export const agent = Promise.resolve(new HttpAgent({identity})).then(
  async agent => {
    if (is_local(agent._host.hostname)) {
      await agent.fetchRootKey();
    }
    agent.addTransform(makeNonceTransform());
    return agent;
  }
);
