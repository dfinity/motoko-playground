import { blobFromUint8Array, BinaryBlob } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { getActor } from "./config/actor";
import { ILoggingStore } from './components/Logger';

export interface CanisterInfo {
  id: Principal,
  timestamp: bigint,
  name?: string,
  candid?: string | null,
}
/*
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
}*/

interface Diagnostics {
  message: String,
  range: {
    start: { line: number, character: number },
    end: { line: number, character: number },
  },
  severity: number,
  source: string,
}

function logDiags(diagnostics: Diagnostics[], logger: ILoggingStore) {
  diagnostics.forEach(d => {
    const { message,severity, source, range: { start } } = d;
    const severityText = severity === 1 ? "Error" : "Warning";
    const out = `${severityText} in file ${source}:${start.line}:${start.character}   ${message}`
    logger.log(out);
  })
}

export async function compileCandid(worker, file: string, logger: ILoggingStore): Promise<string|undefined> {
  const candid_result = await worker.Moc({ type:"candid", file });
  if (candid_result.diagnostics) logDiags(candid_result.diagnostics, logger);
  // setMarkers(candid_result.diagnostics);
  const candid_source = candid_result.code;
  if (!candid_source) {
    logger.log(`cannot deploy: syntax error`);
    return;
  } else if (candid_source.trim() === "") {
    logger.log(`cannot deploy: ${file} has no actor`);
    return;
  }
  return candid_source;
}

export async function deploy(worker, canisterName: string, canisterInfo: CanisterInfo|null, args: BinaryBlob, mode: string, file: string, logger: ILoggingStore): Promise<CanisterInfo | undefined> {
  logger.clearLogs();
  logger.log('Compiling code...');

  // NOTE: Will change to "ic" in a future moc release
  const out = await worker.Moc({ type:"compile", file });
  if (out.diagnostics) logDiags(out.diagnostics, logger);
  // setMarkers(out.diagnostics);
  if (out.code === null) {
    logger.log("syntax error");
  } else {
    const wasm = out.code;
    logger.log(`Compiled Wasm size: ${Math.floor(wasm.length/1024)}KB`);
    const module = blobFromUint8Array(wasm);
    try {
      logger.log(`Deploying code...`);
      let updatedState: CanisterInfo | null = null;
      if (!canisterInfo) {
        if (mode !== "install") {
          throw new Error(`Cannot ${mode} for new canister`);
        }
        logger.log(`Requesting a new canister id...`);
        canisterInfo = await createCanister(worker, logger);
        updatedState = await install(
          canisterInfo,
          module,
          args,
          "install",
          logger
        );
      } else {
        if (mode !== "reinstall" && mode !== "upgrade") {
          throw new Error(`Unknown mode ${mode}`);
        }
        updatedState = await install(
          canisterInfo,
          module,
          args,
          mode,
          logger
        );
      }
      //updatedState.candid = candid_source;
      updatedState.name = canisterName;
      return updatedState;
    } catch (err) {
      logger.log(err.message);
      throw err;
    }
  }
}

async function createCanister(worker, logger: ILoggingStore): Promise<CanisterInfo> {
  const backend = await getActor();
  const timestamp = BigInt(Date.now()) * BigInt(1_000_000);
  console.log(timestamp);
  const nonce = await worker.pow(timestamp);
  console.log(nonce);
  const info = await backend.getCanisterId(nonce);
  logger.log(`Get canister id ${info.id}`);
  return {
    id: info.id,
    timestamp: info.timestamp,
  };
}

export async function deleteCanister(info: CanisterInfo) {
  const backend = await getActor();
  await backend.removeCode(info);
}

async function install(
  canisterInfo: CanisterInfo,
  module: BinaryBlob,
  args: BinaryBlob,
  mode: string,
  logger: ILoggingStore): Promise<CanisterInfo>
{
  if (!canisterInfo) {
    throw new Error("no canister id");
  }
  const canisterId = canisterInfo.id;
  const installArgs = {
    arg: [...args],
    wasm_module: [...module],
    mode: { [mode]: null },
    canister_id: canisterId,
  };
  const backend = await getActor();
  const new_info = await backend.installCode(canisterInfo, installArgs);
  canisterInfo = new_info;
  logger.log(`Code installed at canister id ${canisterInfo.id}`);
  return canisterInfo;
}

export function getCanisterName(file: string): string {
  const path = file.split("/");
  const name = path.pop()!;
  if (name === "Main.mo" && path.length) {
    return path.pop()!;
  } else {
    return name.slice(0, -3);
  }
}
