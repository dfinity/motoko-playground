import assets from 'ic:canisters/playground_assets';
import didjs from 'ic:canisters/didjs';
import * as Wasi from './wasiPolyfill';
import { Actor, blobFromUint8Array, Principal, IDL, UI } from '@dfinity/agent';
import ic_idl from './management';
import { fetchActor, didToJs, render } from './candid';
import { setMarkers, loadEditor, editor } from './monaco';
import { addFile, addFileEntry, addPackage, saveCodeToMotoko, files, current_session_name, filetab } from './file';
import { log, clearLogs, output } from './log';
import { canister, canister_ui, canister_candid } from './build';
import './candid.css';
import './playground.css';

const ic0 = Actor.createActor(ic_idl, { canisterId: Principal.fromHex('') });

async function retrieve(file) {
  const content = await assets.retrieve(file);
  return new TextDecoder().decode(new Uint8Array(content));
}

function getCanisterName(path) {
  return path.split('/').pop().slice(0,-3);
}

function initUI() {
  document.title = 'Motoko Playground';
  const dom = document.createElement('div');
  dom.width = "100%";
  dom.style = "width:100%;height:90vh;display:flex;align-items:stretch; position:relative";
  document.body.appendChild(dom);

  filetab.className = 'tab';
  
  const code = document.createElement('div');
  code.id = "editor";
  code.style = "height:90vh;width:50%;border:1px solid black;";

  output.className = "console";
  output.style = "width:50%;height:90vh;border:1px solid black;overflow:scroll";
  log("Loading...(Do nothing before you see 'Ready')");

  const newfile = document.createElement('input');
  newfile.type = "button";
  newfile.value = "New file";

  const newpack = document.createElement('input');
  newpack.type = 'button';
  newpack.value = 'New package';
  
  const run = document.createElement('input');
  run.type = "button";
  run.value = "Run";
  const compile = document.createElement('input');
  compile.type = "button";
  compile.value = "Compile to WASI";
  const ic = document.createElement('input');
  ic.type = "button";
  ic.value = "Deploy on IC";

  dom.appendChild(filetab);
  dom.appendChild(code);
  dom.appendChild(output);
  document.body.appendChild(newfile);
  document.body.appendChild(newpack);  
  document.body.appendChild(run);
  document.body.appendChild(compile);
  document.body.appendChild(ic);

  newfile.addEventListener('click', () => {
    const name = prompt('Please enter new file name', '');
    if (name) {
      addFile(name, `// ${name}`);
    }
  });
  newpack.addEventListener('click', () => {
    const pack = prompt('Please enter package info (name, github repo, version, directory)', 'matchers, kritzcreek/motoko-matchers, 0.1.3, src');
    if (pack) {
      const args = pack.split(',').map(s => s.trim());
      addPackage(...args);
    }
  });
  
  run.addEventListener('click', () => {
    clearLogs();
    saveCodeToMotoko();
    log('Running...');
    try {
      const tStart = Date.now();
      const out = Motoko.run(editor.getModel().getValue());
      const duration = (Date.now() - tStart) / 1000;
      log(out.stderr + out.stdout);
      log(out.result);
      log(`\n(run time: ${duration}s)`);
    } catch(err) {
      log('Exception:\n' + err);
      throw err;
    };
  });

  compile.addEventListener('click', () => {
    clearLogs();
    saveCodeToMotoko();
    log('Compiling...');
    try {
      const tStart = Date.now();
      const out = Motoko.compileWasm("wasi", current_session_name);
      const duration = (Date.now() - tStart) / 1000;
      setMarkers(out.diagnostics);
      if (out.code === null) {
        log(JSON.stringify(out.diagnostics));
      } else {
        log(`(compile time: ${duration}s)`);
        const wasiPolyfill = new Wasi.barebonesWASI();
        Wasi.importWasmModule(out.code, wasiPolyfill, log);
      }
    } catch(err) {
      log('Exception:\n' + err);
      throw err;
    };
  });

  ic.addEventListener('click', () => {
    clearLogs();
    saveCodeToMotoko();    
    log('Compiling...');
    try {
      const candid_result = Motoko.candid(current_session_name);
      setMarkers(candid_result.diagnostics);
      const candid_source = candid_result.code;
      if (!candid_source || candid_source.trim() === '') {
        log('cannot deploy empty candid file');
        return;
      }
      const tStart = Date.now();
      const out = Motoko.compileWasm("dfinity", current_session_name);
      const duration = (Date.now() - tStart) / 1000;
      setMarkers(out.diagnostics);
      if (out.code === null) {
        log(JSON.stringify(out.diagnostics));
      } else {
        log(`(compile time: ${duration}s)`);
        const wasm = out.code;
        (async () => {
          log(`Deploying on IC...`);
          const canister_name = prompt('Please enter canister name', getCanisterName(current_session_name));
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
    } catch(err) {
      log('Exception:\n' + err);
      throw err;
    };    
  });
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

async function init() {
  // Load Monaco editor
  loadEditor();
  // Load Motoko compiler
  const js = await retrieve('mo_js.js');
  const script = document.createElement('script');
  script.text = js;
  document.body.appendChild(script);
  log('Compiler loaded.');
}

initUI();
init().then(() => {
  // Load library
  addPackage('base', 'dfinity/motoko-base', 'dfx-0.6.12', 'src');
  log('Ready.');
});
