import { Principal } from "@dfinity/principal";
import { backend } from "./config/actor";
import { ILoggingStore } from "./components/Logger";
import { Origin } from "./contexts/WorkplaceState";

export interface CanisterInfo {
  id: Principal;
  isExternal: boolean;
  timestamp?: bigint;
  name?: string;
  candid?: string | null;
  stableSig?: string | null;
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
  message: String;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  severity: number;
  source: string;
  code: string;
}
interface CompileResult {
  wasm: Uint8Array;
  candid: String;
  stable: String;
}

function logDiags(diagnostics: Diagnostics[], logger: ILoggingStore) {
  diagnostics.forEach((d) => {
    const {
      message,
      severity,
      source,
      range: { start },
      code,
    } = d;
    const severityText = severity === 1 ? "Error" : "Warning";
    const out = `${severityText} [${code}] in file ${source}:${start.line}:${start.character}   ${message}`;
    logger.log(out);
  });
}

function get_wasm_metadata(
  wasm: WebAssembly.Module,
  name: string
): string | undefined {
  let section = WebAssembly.Module.customSections(wasm, `icp:public ${name}`);
  if (section.length === 0) {
    section = WebAssembly.Module.customSections(wasm, `icp:private ${name}`);
  }
  if (section.length === 0) {
    return undefined;
  }
  const decoder = new TextDecoder();
  const bytes = new Uint8Array(section[0]);
  const str = decoder.decode(bytes);
  return str;
}

export async function extractCandidFromWasm(
  wasm: Uint8Array
): Promise<[string, undefined | string]> {
  const mod = await WebAssembly.compile(wasm);
  const serv = get_wasm_metadata(mod, "candid:service");
  if (!serv) {
    throw new Error("Cannot find candid:service metadata in Wasm module");
  }
  const init = get_wasm_metadata(mod, "candid:args");
  return [serv, init];
}
export async function getBaseDeps(
  worker,
  entry: string
): Promise<Array<string>> {
  const visited = new Set();
  const result = new Set();
  async function go(file: string) {
    if (visited.has(file)) {
      return;
    }
    visited.add(file);
    const deps = await worker.Moc({
      type: "printDeps",
      file,
    });
    for (const imp of deps.split("\n")) {
      if (imp.indexOf(":") > 0) {
        if (imp.startsWith("mo:base/")) {
          result.add(imp.slice(8));
        }
      } else {
        const path = imp.split(" ");
        if (path.length === 2) {
          await go(path[1]);
        }
      }
    }
  }
  await go(entry);
  return Array.from(result);
}

export async function compileCandid(
  worker,
  file: string,
  logger: ILoggingStore
): Promise<string | undefined> {
  const candid_result = await worker.Moc({ type: "candid", file });
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

export async function compileWasm(
  worker,
  file: string,
  logger: ILoggingStore
): Promise<[CompileResult, string[]] | undefined> {
  logger.log("Compiling code...");
  const out = await worker.Moc({ type: "compile", file });
  if (out.diagnostics) logDiags(out.diagnostics, logger);
  if (out.code === null) {
    logger.log("syntax error");
    return;
  }
  if (out.code.candid.trim() === "") {
    logger.log(`cannot deploy: ${file} has no actor`);
    return;
  }
  if (out.code.stable === null) {
    logger.log(`cannot deploy: ${file} cannot generate stable signature`);
    return;
  }
  logger.log(
    `Compiled Wasm size: ${Math.floor(out.code.wasm.length / 1024)}KB`
  );
  let warn_code = [];
  if (out.diagnostics) {
    warn_code = out.diagnostics.map((d) => d.code);
  }
  return [out.code, warn_code];
}

export async function deploy(
  worker,
  canisterName: string,
  canisterInfo: CanisterInfo | null,
  args: Uint8Array,
  mode: string,
  wasm: Uint8Array,
  profiling: boolean,
  hasStartPage: boolean,
  logger: ILoggingStore,
  origin: Origin
): Promise<CanisterInfo | undefined> {
  try {
    logger.log(`Deploying code...`);
    let updatedState: CanisterInfo | null = null;
    if (!canisterInfo) {
      if (mode !== "install") {
        throw new Error(`Cannot ${mode} for new canister`);
      }
      logger.log(`Requesting a new canister id...`);
      canisterInfo = await createCanister(worker, logger, origin);
      updatedState = await install(
        canisterInfo,
        wasm,
        args,
        "install",
        profiling,
        hasStartPage,
        logger,
        origin
      );
    } else {
      if (mode !== "reinstall" && mode !== "upgrade") {
        throw new Error(`Unknown mode ${mode}`);
      }
      updatedState = await install(
        canisterInfo,
        wasm,
        args,
        mode,
        profiling,
        hasStartPage,
        logger,
        origin
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

function mkOrigin(origin: Origin, is_install: boolean) {
  const tags =
    origin.session_tags && is_install
      ? origin.tags.concat(origin.session_tags)
      : origin.tags;
  return { origin: origin.origin, tags: [...new Set(tags)] };
}

async function createCanister(
  worker,
  logger: ILoggingStore,
  origin: Origin
): Promise<CanisterInfo> {
  const timestamp = BigInt(Date.now()) * BigInt(1_000_000);
  const nonce = await worker.pow(timestamp);
  const info = await backend.getCanisterId(nonce, mkOrigin(origin, false));
  logger.log(`Got canister id ${info.id}`);
  return {
    id: info.id,
    isExternal: false,
    timestamp: info.timestamp,
  };
}

export async function deleteCanister(info: CanisterInfo) {
  await backend.removeCode(info);
}

async function install(
  canisterInfo: CanisterInfo,
  module: Uint8Array,
  args: Uint8Array,
  mode: string,
  profiling: boolean,
  hasStartPage: boolean,
  logger: ILoggingStore,
  origin: Origin
): Promise<CanisterInfo> {
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
  const start_page = profiling && hasStartPage ? [16] : [];
  const installConfig = {
    profiling,
    is_whitelisted: false,
    origin: mkOrigin(origin, true),
    start_page,
    page_limit: [],
  };
  const new_info = await backend.installCode(
    canisterInfo,
    installArgs,
    installConfig
  );
  canisterInfo = new_info;
  logger.log(`Code installed at canister id ${canisterInfo.id}`);
  return canisterInfo;
}

export function getCanisterName(file: string): string {
  const path = file.split("/");
  const name = path.pop()!.toLowerCase();
  if (name === "main.mo" && path.length) {
    return path.pop()!.toLowerCase();
  } else {
    const suffix = name.lastIndexOf(".");
    if (suffix === -1) return name;
    return name.slice(0, suffix);
  }
}
