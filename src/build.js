import { saveWorkplaceToMotoko } from "./file";
import * as Wasi from "./wasiPolyfill";
import { fetchActor, didToJs, render } from "./candid";
import { Actor, blobFromUint8Array, Principal, IDL, UI } from "@dfinity/agent";

// const ic0 = Actor.createActor(ic_idl, { canisterId: Principal.fromHex('') });

// map canister name to canister id
export const canister = {};
// map canister name to ui
export const canister_ui = {};
// map canister name to candid
export const canister_candid = {};

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

function getCanisterName(path) {
  return path.split("/").pop().slice(0, -3);
}
