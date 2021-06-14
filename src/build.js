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

function build(status, func, workplace) {
  // clearLogs();
  saveWorkplaceToMotoko(workplace);
  // log(status);
  try {
    func();
  } catch (err) {
    // log("Exception:\n" + err);
    throw err;
  }
}

export function interpret(file) {
  build("Running...", () => {
    const tStart = Date.now();
    // @ts-ignore
    const out = Motoko.run([], file);
    const duration = (Date.now() - tStart) / 1000;
    // log(out.stderr + out.stdout);
    // log(`\n(run time: ${duration}s)`);
  });
}

export function wasi(file) {
  build("Compiling...", () => {
    const tStart = Date.now();
    const out = Motoko.compileWasm("wasi", file);
    const duration = (Date.now() - tStart) / 1000;
    // setMarkers(out.diagnostics);
    if (out.code === null) {
      // log("syntax error");
    } else {
      // log(`(compile time: ${duration}s)`);
      const wasiPolyfill = new Wasi.barebonesWASI();
      Wasi.importWasmModule(out.code, wasiPolyfill, {});
    }
  });
}

function getCanisterName(path) {
  return path.split("/").pop().slice(0, -3);
}
