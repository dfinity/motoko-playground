import * as ic from '@dfinity/agent';

const { HttpAgent, IDL, Principal } = ic;

const createAgent = (host) => {
  const keyPair = ic.generateKeyPair();
  const agent = new HttpAgent({
    principal: Principal.selfAuthenticating(keyPair.publicKey),
    host,
  });
  agent.addTransform(ic.makeNonceTransform());
  agent.setAuthTransform(ic.makeAuthTransform(keyPair));
  return agent;
};

global.ic = { agent: createAgent(self.origin), HttpAgent, IDL };
