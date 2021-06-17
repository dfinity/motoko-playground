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

export function deploy(file, logger) {
  build("Compiling...", logger, () => {
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
      (async () => {
        logger.log(`Deploying on IC...`);
        const canister_name = prompt(
          "Please enter canister name",
          getCanisterName(file)
        );
        if (!canister_name) {
          return;
        }
        canister_candid[canister_name] = candid_source;
        // init args
        const candid = await didToJs(candid_source);
        const line = document.createElement("div");
        line.id = "install";
        logger.log(line);
      })().catch((err) => {
        logger.log("IC Exception:\n" + err.stack);
        throw err;
      });
    }
  });
}

function getCanisterName(path) {
  return path.split("/").pop().slice(0, -3);
}
