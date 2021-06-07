import { HttpAgent } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';

const identity = Ed25519KeyIdentity.generate();
export const agent = new HttpAgent({identity});
