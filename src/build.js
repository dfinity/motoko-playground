import { log, clearLogs, output } from './log';
import { saveCodeToMotoko, addFileEntry } from './file';
import { setMarkers } from './monaco';
import * as Wasi from './wasiPolyfill';
import ic_idl from './management';
import { fetchActor, didToJs, render } from './candid';
import { Actor, blobFromUint8Array, Principal, IDL, UI } from '@dfinity/agent';

const ic0 = Actor.createActor(ic_idl, { canisterId: Principal.fromHex('') });

// map canister name to canister id
export const canister = {};
// map canister name to ui
export const canister_ui = {};
// map canister name to candid
export const canister_candid = {};

function build(status, func) {
  clearLogs();
  saveCodeToMotoko();
  log(status);
  try {
    func()
  } catch(err) {
    log('Exception:\n' + err);
    throw err;
  }
}

export function interpret(file) {
  build("Running...", () => {
    const tStart = Date.now();
    const out = Motoko.run(file);
    const duration = (Date.now() - tStart) / 1000;
    log(out.stderr + out.stdout);
    log(`\n(run time: ${duration}s)`);    
  });
}

export function wasi(file) {
  build("Compiling...", () => {
    const tStart = Date.now();
    const out = Motoko.compileWasm("wasi", file);
    const duration = (Date.now() - tStart) / 1000;
    setMarkers(out.diagnostics);
    if (out.code === null) {
      log("syntax error");
    } else {
      log(`(compile time: ${duration}s)`);
      const wasiPolyfill = new Wasi.barebonesWASI();
      Wasi.importWasmModule(out.code, wasiPolyfill, log);
    }
  });
}

function getCanisterName(path) {
  return path.split('/').pop().slice(0,-3);
}

export function deploy(file) {
  build("Compiling...", () => {
    const candid_result = Motoko.candid(file);
    setMarkers(candid_result.diagnostics);
    const candid_source = candid_result.code;
    if (!candid_source || candid_source.trim() === '') {
      log('cannot deploy: syntax error or empty candid file');
      return;
    }
    const tStart = Date.now();
    const out = Motoko.compileWasm("dfinity", file);
    const duration = (Date.now() - tStart) / 1000;
    setMarkers(out.diagnostics);
    if (out.code === null) {
      log("syntax error");
    } else {
      log(`(compile time: ${duration}s)`);
      const wasm = out.code;
      (async () => {
        log(`Deploying on IC...`);
        const canister_name = prompt('Please enter canister name', getCanisterName(file));
        if (!canister_name) { return; }
        canister_candid[canister_name] = candid_source;
        // init args
        const candid = await didToJs(candid_source);
        const line = document.createElement('div');
        line.id = 'install';
        log(line);
        renderInstall(line, canister_name, candid, wasm);
      })().catch(err => {
        log('IC Exception:\n' + err.stack);
        throw err;
      });
    }    
  });
}

async function install(name, canisterId, module, arg, mode, candid) {
  if (!canisterId) {
    throw new Error('no canister id');
  }
  await Actor.install({ module, arg, mode }, { canisterId });
  log('Code installed');
  const canister = Actor.createActor(candid, { canisterId });
  const line = document.createElement('div');
  line.id = name;
  log(line);
  render(line, canisterId, canister);
  canister_ui[name] = line;
  Motoko.saveFile(`idl/${canisterId}.did`, canister_candid[name]);
}

function renderInstall(item, name, candid, wasm) {
  const module = blobFromUint8Array(wasm);
  const argTypes = candid.init({ IDL });
  item.innerHTML = `<div>This service requires the following installation arguments:</div>`;
  const sig = document.createElement('div');
  sig.className = 'signature';
  sig.innerHTML = `Init arguments: (${argTypes.map(arg => arg.name).join(', ')})`;
  item.appendChild(sig);

  const inputs = [];
  argTypes.forEach((arg, i) => {
    const inputbox = UI.renderInput(arg);
    inputs.push(inputbox);
    inputbox.render(item);
  });

  const parse = () => {
    const args = inputs.map(arg => arg.parse());
    const isReject = inputs.some(arg => arg.isRejected());
    if (isReject) {
      return undefined;
    }
    return blobFromUint8Array(IDL.encode(argTypes, args));      
  };
  
  const canisterId = canister[name];
  if (canisterId) {
    const upgrade = document.createElement('button');
    upgrade.className = 'btn';
    upgrade.innerText = 'Upgrade';
    item.appendChild(upgrade);
    upgrade.addEventListener('click', () => {
      const encoded = parse();
      if (encoded) {
        output.removeChild(item.parentNode);
        log(`Upgrading ${canisterId}...`);
        install(name, canisterId, module, encoded, 'upgrade', candid.default);
      }
    });
  }

  const button = document.createElement('button');
  button.className = 'btn';
  button.innerText = canisterId ? 'Reinstall' : 'Install';
  item.appendChild(button);  
  
  button.addEventListener('click', () => {
    const encoded = parse();
    if (encoded) {
      output.removeChild(item.parentNode);
      if (!canisterId) {
        log(`Creating canister id for ${name}...`);
        (async () => {
          const new_id = await Actor.createCanister();
          canister[name] = new_id;
          log(`Created canisterId ${new_id}`);
          install(name, new_id, module, encoded, 'install', candid.default);
          const entry = addFileEntry('canister', 'canister:' + name);
          deleteButton(name, entry);
        })();
      } else {
        log(`Reinstalling ${canisterId}...`);
        install(name, canisterId, module, encoded, 'reinstall', candid.default);
      }
    }
  });
}

function deleteButton(name, entry) {
  const canisterId = canister[name];
  const close = document.createElement('input');
  close.type = 'button';
  close.value = `Delete ${name}`;
  document.body.appendChild(close);
  close.addEventListener('click', () => {
    const ui = document.getElementById(name);
    if (ui) {
      output.removeChild(ui.parentNode);
    }
    (async () => {
      log(`Deleting canister ${name}...`);
      await ic0.stop_canister({ canister_id: canisterId });
      log('Canister stopped');
      await ic0.delete_canister({ canister_id: canisterId });
      log('Canister deleted');
      delete canister[name];
      delete canister_ui[name];
      delete canister_candid[name];
      entry.remove();
      close.remove();
    })();
  });  
}
