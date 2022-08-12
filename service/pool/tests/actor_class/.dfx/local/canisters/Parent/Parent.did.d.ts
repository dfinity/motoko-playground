import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface _SERVICE {
  'makeChild' : ActorMethod<[bigint], undefined>,
  'removeChild' : ActorMethod<[bigint], undefined>,
  'sayHi' : ActorMethod<[bigint], [] | [string]>,
  'startCanister' : ActorMethod<[bigint], undefined>,
  'stopChild' : ActorMethod<[bigint], undefined>,
}
