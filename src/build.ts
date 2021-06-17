import { blobFromUint8Array, BinaryBlob, Principal } from "@dfinity/agent";

import { getActor, didToJs, getUiCanisterUrl } from "./config/actor";
import { ILoggingStore } from './components/Logger';

// const ic0 = Actor.createActor(ic_idl, { canisterId: Principal.fromHex('') });

// map canister name to canister id

declare var Motoko: any;

interface CanisterInfo {
  id: Principal,
  timestamp: BigInt,
  name?: string,
  candid?: string | null,
}

let canisterInfo: CanisterInfo | null = null;
// map canister name to ui
// export const canister_ui = {};
// // map canister name to candid
// export const canister_candid = null;

export function interpret(file: string, logger: ILoggingStore): void {
  logger.clearLogs();
  logger.log('Running code...');
  try {
    const tStart = Date.now();
    // @ts-ignore
    const out = Motoko.run([], file);
    const duration = (Date.now() - tStart) / 1000;
    logger.log(out.stderr + out.stdout);
    logger.log(`\n(run time: ${duration}s)`);
  } catch (err) {
    logger.log("Exception:\n" + err);
    throw err;
  }
}

export async function deploy(file: string, logger: ILoggingStore): Promise<CanisterInfo | undefined> {
  logger.clearLogs();
  logger.log('Compiling code...');

  const candid_result = Motoko.candid(file);
  // setMarkers(candid_result.diagnostics);
  const candid_source = candid_result.code;
  if (!candid_source || candid_source.trim() === "") {
    logger.log("cannot deploy: syntax error or empty candid file");
    return;
  }
  const tStart = Date.now();
  // NOTE: Will change to "ic" in a future moc release
  const out = Motoko.compileWasm("dfinity", file);
  const duration = (Date.now() - tStart) / 1000;
  // TODO output diags, run setmarkers
  // setMarkers(out.diagnostics);
  if (out.code === null) {
    logger.log("syntax error");
  } else {
    logger.log(`(compile time: ${duration}s)`);
    const wasm = out.code;
    const module = blobFromUint8Array(wasm);
    try {
      logger.log(`Deploying code...`);
      let updatedState: CanisterInfo | null = null;
      if (!canisterInfo) {
        canisterInfo = await createCanister(logger);
        updatedState = await install(
          canisterInfo,
          module,
          "install",
          candid_source,
          logger
        );
      } else {
        updatedState = await install(
          canisterInfo,
          module,
          "reinstall",
          candid_source,
          logger
        );
      }
      // updatedState.candid = candid_source;
      canisterInfo = updatedState;
      return updatedState;
    } catch (err) {
      logger.log("IC Exception:\n" + err.stack);
      throw err;
    }
  }
}

async function createCanister(logger: ILoggingStore): Promise<CanisterInfo> {
  const backend = await getActor();
  const info = await backend.getCanisterId();
  logger.log(`Created canister with id: ${info.id}`);
  return {
    id: info.id,
    timestamp: info.timestamp,
  };
}

async function install(
  canisterInfo: CanisterInfo,
  module: BinaryBlob,
  mode: string,
  candid_source: string,
  logger: ILoggingStore): Promise<CanisterInfo>
{
  if (!canisterInfo) {
    throw new Error("no canister id");
  }
  const canisterId = canisterInfo.id;
  const installArgs = {
    arg: [],
    wasm_module: [...module],
    mode: { [mode]: null },
    canister_id: canisterId,
  };
  const backend = await getActor();
  const new_info = await backend.installCode(canisterInfo, installArgs);
  canisterInfo = new_info;
  logger.log(`Code installed at canister with id: ${canisterInfo.id}`);
  Motoko.saveFile(`idl/${canisterId}.did`, candid_source);
  return canisterInfo;
}

function getCanisterName(path) {
  return path.split("/").pop().slice(0, -3);
}
