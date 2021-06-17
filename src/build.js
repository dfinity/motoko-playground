import { saveWorkplaceToMotoko } from "./file";
import * as Wasi from "./wasiPolyfill";
import { getActor, agent, didToJs, uiCanisterUrl } from "./config/actor";
import { Actor, blobFromUint8Array, Principal, IDL, UI } from "@dfinity/agent";

// const ic0 = Actor.createActor(ic_idl, { canisterId: Principal.fromHex('') });

// map canister name to canister id
export const canister = {};
let canisterInfo = null;
// map canister name to ui
export const canister_ui = {};
let canisterUi = null;
// map canister name to candid
let canisterCandid = null;
export const canister_candid = null;

function build(status, logger, func) {
  logger.clearLogs();
  logger.log(status);
  try {
    func();
  } catch (err) {
    logger.log("Exception:\n" + err);
    throw err;
  }
}

export function interpret(file, logger) {
  build("Running...", logger, () => {
    const tStart = Date.now();
    // @ts-ignore
    const out = Motoko.run([], file);
    const duration = (Date.now() - tStart) / 1000;
    logger.log(out.stderr + out.stdout);
    logger.log(`\n(run time: ${duration}s)`);
  });
}

export function wasi(file, logger) {
  build("Compiling...", logger, () => {
    const tStart = Date.now();
    const out = Motoko.compileWasm("wasi", file);
    const duration = (Date.now() - tStart) / 1000;
    // TODO implement setting markers on files
    // setMarkers(out.diagnostics);
    if (out.code === null) {
      logger.log("syntax error");
    } else {
      logger.log(`(compile time: ${duration}s)`);
      const wasiPolyfill = new Wasi.barebonesWASI();
      Wasi.importWasmModule(out.code, wasiPolyfill, {});
    }
  });
}

// TODO this should be async, fix async
export async function deploy(file, logger) {
  build("Compiling...", logger, async () => {
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
    // setMarkers(out.diagnostics);
    if (out.code === null) {
      logger.log("syntax error");
    } else {
      logger.log(`(compile time: ${duration}s)`);
      const wasm = out.code;
      const module = blobFromUint8Array(wasm);
      try {
        logger.log(`Deploying on IC...`);
        canisterCandid = candid_source;
        const candid = await didToJs(candid_source);
        let updatedState = {};
        if (!canisterInfo) {
          canisterInfo = await createCanister(logger);
          updatedState = await install(
            canisterInfo,
            module,
            "install",
            candid.default,
            logger
          );
        } else {
          updatedState = await install(
            canisterInfo,
            module,
            "reinstall",
            candid.default,
            logger
          );
        }
        return updatedState;
      } catch (err) {
        logger.log("IC Exception:\n" + err.stack);
        throw err;
      }
    }
  });
}

async function createCanister(logger) {
  const backend = await getActor();
  const info = await backend.getCanisterId();
  return canisterInfo;
}

async function install(canisterInfo, module, mode, candid, logger) {
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
  logger.log("Code installed");
  canisterUi = { canisterUrl: uiCanisterUrl, canisterId };
  // TODO don't think this is needed
  // const canister = Actor.createActor(candid, { agent, canisterId });
  // TODO add in iframe
  // canisterUi =
  Motoko.saveFile(`idl/${canisterId}.did`, canister);
  return {
    canisterInfo,
    canisterUi,
    canisterCandid,
  };
}

function getCanisterName(path) {
  return path.split("/").pop().slice(0, -3);
}
