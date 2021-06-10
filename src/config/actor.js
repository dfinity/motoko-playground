import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory, canisterId } from 'dfx-generated/motoko_app'

import dfxConfig from '../../../dfx.json'

const DFX_NETWORK = process.env.DFX_NETWORK || 'local'
function getHost() {
  // Setting host to undefined will default to the window location 👍🏻
  return DFX_NETWORK === 'local' ? dfxConfig.networks.local.bind : undefined
}

const host = getHost()

// Since we're using webpack-dev-server as part of create-react-app, we need to
// add its port to our HttpAgent config as the host.
const agent = new HttpAgent({ host })
export const baseActor = Actor.createActor(idlFactory, {
  agent,
  canisterId,
})

export class CanisterActor {
  actor
  constructor(overrideActor) {
    this.actor = overrideActor ?? baseActor
  }
}

const actor = new CanisterActor()
export default actor
