import assets from 'ic:canisters/playground_assets';
import didjs from 'ic:canisters/didjs';
import * as Wasi from './wasiPolyfill';
import { Actor, blobFromUint8Array, Principal, IDL, UI } from '@dfinity/agent';
import ic_idl from './management';
import { fetchActor, didToJs, render } from './candid';
import './candid.css';
import './playground.css';

const prog = `import Time "mo:base/Time";
import P "mo:base/Principal";
import Prim "mo:prim";
import T "./types";
shared {caller} actor class Example(init : Int) {
  stable let controller = caller;
  stable let init_time = Time.now();
  var counter = init;

  public query(msg) func getId() : async {caller:Principal; creator:Principal} {
    {caller = msg.caller; creator = controller}
  };
  public query func greet(name : Text) : async Text {
    let uptime = (Time.now() - init_time)/1000000;
    return "Hello, " # name # " at " # (debug_show uptime) # "ms";
  };
  public func add() : async Int { counter += 1; counter };
};`;

async function retrieve(file) {
  const content = await assets.retrieve(file);
  return new TextDecoder().decode(new Uint8Array(content));
}

async function loadBase() {
  const base_url = 'https://raw.githubusercontent.com/dfinity/motoko-base/master/src/';
  const libs = ['Array', 'AssocList', 'Blob', 'Bool', 'Buffer', 'Char', 'Debug',
                'Deque', 'Error', 'Float', 'Func', 'Hash', 'HashMap', 'Heap',
                'Int', 'Int8', 'Int16', 'Int32', 'Int64', 'Iter', 'IterType', 'List',
                'Nat', 'Nat8', 'Nat16', 'Nat32', 'Nat64', 'None', 'Option', 'Order',
                'Prelude', 'Principal', 'RBTree', 'Random', 'Result', 'Stack', 'Text',
                'Time', 'Trie', 'TrieMap', 'TrieSet', 'Word8', 'Word16', 'Word32', 'Word64'];
  for (const lib of libs) {
    (async () => {
      const response = await fetch(base_url + lib + '.mo');
      const content = await response.text();
      Motoko.saveFile(`base/${lib}.mo`, content);
      log(lib + ' loaded');
    })();
  }
}

function fetchCode(name) {
  return files[name].getValue();
}
window.fetchCode = fetchCode;

let output;
let editor;
let filetab;
let canisterId;
// mo_js has a mount point src/ which calls fetchCode(filename)
let main_file = 'src/main.mo';
const ic0 = Actor.createActor(ic_idl, { canisterId: Principal.fromHex('') });
const files = {};

function addFile(ace, tab, name, content) {
  const entry = document.createElement('button');
  entry.innerText = name;
  tab.appendChild(entry);
  files[name] = ace.createEditSession(content, 'ace/mode/swift');
  entry.addEventListener('click', () => {
    const session = files[name];
    editor.setSession(session);
    for (const e of tab.children) {
      e.className = '';
    }
    entry.className += ' active';
  });
}

function initUI() {
  const dom = document.createElement('div');
  dom.width = "100%";
  dom.style = "width:100%;display:flex;align-items:stretch; position:relative";
  document.body.appendChild(dom);

  filetab = document.createElement('div');
  filetab.className = 'tab';
  
  const code = document.createElement('div');
  code.id = "editor";
  code.style = "height:400px;width:50%;border:1px solid black;";

  output = document.createElement('div');
  output.className = "console";
  output.style = "width:50%;height:400px;border:1px solid black;overflow:scroll";
  log("Loading...(Do nothing before you see 'Ready')");

  const newfile = document.createElement('input');
  newfile.type = "button";
  newfile.value = "New file";
  
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
  document.body.appendChild(run);
  document.body.appendChild(compile);
  document.body.appendChild(ic);

  newfile.addEventListener('click', () => {
    const name = prompt('Please enter new file name', '');
    if (name) {
      addFile(ace, filetab, name, `// ${name}`);
    }
  });
  
  run.addEventListener('click', () => {
    clearLogs();
    log('Running...');
    try {
      const tStart = Date.now();
      const out = Motoko.run(editor.session.getValue());
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
    log('Compiling...');
    try {
      const tStart = Date.now();
      const out = Motoko.compileWasm("wasi", main_file);
      const duration = (Date.now() - tStart) / 1000;
      if (out.result.code === null) {
        const diags = out.result.diagnostics;
        log(diags);
        /*
        for (const diag of diags) {
          const Range = ace.require('ace/range').Range;
          editor.session.addMarker(new Range(diag.range.start.line, diag.range.start.character, diag.range.end.line, diag.range.end.character), 'codeMarker', 'range');
          log(diag.message);
        }*/
      } else {
        log(`(compile time: ${duration}s)`);
        const wasiPolyfill = new Wasi.barebonesWASI();
        Wasi.importWasmModule(out.result.code, wasiPolyfill, log);
        log(out.stderr + out.stdout);
      }
    } catch(err) {
      log('Exception:\n' + err);
      throw err;
    };
  });

  ic.addEventListener('click', () => {
    clearLogs();
    log('Compiling...');
    try {
      const tStart = Date.now();
      const out = Motoko.compileWasm("dfinity", main_file);
      const candid_source = Motoko.candid(main_file).result;
      const duration = (Date.now() - tStart) / 1000;
      if (out.result.code === null) {
        log(JSON.stringify(out.result.diagnostics));
      } else {
        log(`(compile time: ${duration}s)`);
        log(out.stderr + out.stdout);
        const wasm = out.result.code;
        (async () => {
          log(`Deploying on IC...`);
          // init args
          const candid = await didToJs(candid_source);
          const line = document.createElement('div');
          line.id = 'install';
          log(line);
          renderInstall(line, candid, wasm);
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

export function renderInstall(item, candid, wasm) {
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
        install(module, encoded, 'upgrade', candid.default);
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
        log('Creating canister id...');
        (async () => {
          canisterId = await Actor.createCanister();
          log(`Created canisterId ${canisterId}`);
          deleteButton();
          install(module, encoded, 'install', candid.default);
        })();
      } else {
        log(`Reinstalling ${canisterId}...`);
        install(module, encoded, 'reinstall', candid.default);
      }
    }
  });
}

async function install(module, arg, mode, candid) {
  if (!canisterId) {
    throw new Error('no canister id');
  }
  await Actor.install({ module, arg, mode }, { canisterId });
  log('Code installed');
  const canister = Actor.createActor(candid, { canisterId });
  const line = document.createElement('div');
  line.id = 'candid-ui';
  log(line);
  render(line, canisterId, canister);  
}

function deleteButton() {
  const close = document.createElement('input');
  close.type = 'button';
  close.value = 'Delete canister';
  document.body.appendChild(close);
  close.addEventListener('click', () => {
    const ui = document.getElementById('candid-ui');
    if (ui) {
      output.removeChild(ui.parentNode);
    }
    (async () => {
      log('Deleting canister...');
      await ic0.stop_canister({ canister_id: canisterId });
      log('Canister stopped');
      await ic0.delete_canister({ canister_id: canisterId });
      log('Canister deleted');
      canisterId = undefined;
      close.remove();
    })();
  });  
}

function log(content) {
  const line = document.createElement('div');
  line.className = 'console-line';
  if (content instanceof Element) {
    line.appendChild(content);
  } else {
    line.innerHTML = content;
  }
  output.appendChild(line);
  return line;
}

function clearLogs() {
  while (output.firstChild) {
    output.removeChild(output.firstChild);
  }
}

async function init() {
  // Load Ace editor
  const ace_script = document.createElement('script');
  ace_script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.min.js';
  document.body.appendChild(ace_script);
  ace_script.addEventListener('load', () => {
    ace.config.set('basePath', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/');
    editor = ace.edit("editor");
    editor.setTheme('ace/theme/chrome');
    addFile(ace, filetab, 'main.mo', prog);
    addFile(ace, filetab, 'types.mo', 'type List<T> = ?(T, List<T>);');
    filetab.firstChild.className += ' active';
    editor.setSession(files['main.mo']);
    log('Editor loaded.');
  });
  // Load Motoko compiler
  const js = await retrieve('mo_js.js');
  const script = document.createElement('script');
  script.text = js;
  document.body.appendChild(script);
  log('Compiler loaded.');
  // Load base library
  loadBase();
  // TODO check if base library are loaded
  log('Ready.');
}

initUI();
init();
