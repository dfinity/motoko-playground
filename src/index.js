import assets from 'ic:canisters/playground_assets';
import didjs from 'ic:canisters/didjs';
import * as Wasi from './wasiPolyfill';
import { Actor, blobFromUint8Array, Principal, IDL, UI } from '@dfinity/agent';
import ic_idl from './management';
import { fetchActor, didToJs, render } from './candid';
import './candid.css';

const prog = `import Time "mo:base/Time";
import Prim "mo:prim";
shared {caller} actor class Example(init : Int) {
  let controller = caller;
  let init_time = Time.now();
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

async function loadBase(lib) {
  Motoko.loadFile(lib, await retrieve(lib));
}

let output;
let editor;
let overlay;
let hide;
const ic0 = Actor.createActor(ic_idl, { canisterId: Principal.fromHex('') });

function initUI() {
  const dom = document.createElement('div');
  dom.width = "100%";
  dom.style = "width:100%;display:flex;align-items:stretch; position:relative";
  document.body.appendChild(dom);
  
  const code = document.createElement('div');
  code.id = "editor";
  code.style = "height:400px;width:50%;border:1px solid black;";

  output = document.createElement('textarea');
  output.style.width = "50%";
  output.value = "Loading...(Do nothing before you see 'Ready')\n";

  overlay = document.createElement('div');
  overlay.style = "position:absolute; top:4em; right:0; z-index:10; width:50%; height: 80%; visibility:hidden; overflow:scroll;";
  
  const run = document.createElement('input');
  run.type = "button";
  run.value = "Run";
  const compile = document.createElement('input');
  compile.type = "button";
  compile.value = "Compile to WASI";
  const ic = document.createElement('input');
  ic.type = "button";
  ic.value = "Deploy on IC";
  // Hide button
  hide = document.createElement('input');
  hide.type = "button";
  hide.value = "Hide UI";
  
  dom.appendChild(code);
  dom.appendChild(output);
  dom.appendChild(overlay);
  document.body.appendChild(run);
  document.body.appendChild(compile);
  document.body.appendChild(ic);
  document.body.appendChild(hide);  

  hide.addEventListener('click', () => {
    if (overlay.style.visibility === 'visible') {
      overlay.style.visibility = 'hidden';
      hide.value = 'Show UI';
    } else {
      overlay.style.visibility = 'visible';
      hide.value = 'Hide UI';
    }
  });
  
  run.addEventListener('click', () => {
    output.value = 'Running...';
    try {
      const tStart = Date.now();
      const out = Motoko.run(editor.session.getValue());
      const duration = (Date.now() - tStart) / 1000;
      output.value = out.stderr + out.stdout + out.result;
      output.value += `\n(run time: ${duration}s)\n`;
    } catch(err) {
      output.value = 'Exception:\n' + err;
      throw err;
    };
  });

  compile.addEventListener('click', () => {
    output.value = 'Compiling...';
    try {
      const tStart = Date.now();
      const out = Motoko.compileWasm("wasi", editor.session.getValue());
      const duration = (Date.now() - tStart) / 1000;
      if (out.result.code === null) {
        output.value = JSON.stringify(out.result.diagnostics);
      } else {
        output.value = `(compile time: ${duration}s)\n`;
        const wasiPolyfill = new Wasi.barebonesWASI();
        Wasi.importWasmModule(out.result.code, wasiPolyfill, output);
        output.value += out.stderr + out.stdout;
      }
    } catch(err) {
      output.value = 'Exception:\n' + err;
      throw err;
    };
  });

  ic.addEventListener('click', () => {
    output.value = 'Compiling...';
    try {
      const tStart = Date.now();
      const out = Motoko.compileWasm("dfinity", editor.session.getValue());
      const candid_source = Motoko.candid(editor.session.getValue()).result;
      const duration = (Date.now() - tStart) / 1000;
      if (out.result.code === null) {
        output.value = JSON.stringify(out.result.diagnostics);
      } else {
        output.value = `(compile time: ${duration}s)\n`;
        output.value += out.stderr + out.stdout;
        const wasm = out.result.code;
        (async () => {
          output.value += `Deploying on IC...\n`;
          // TODO: recycle canisterIds
          const canisterId = await Actor.createCanister();
          output.value += `Created canisterId ${canisterId}\n`;          
          // init args
          const candid = await didToJs(candid_source);
          overlay.style.visibility = 'visible';
          renderInit(overlay, candid, wasm, canisterId);
          return;

          await Actor.install({ module: blobFromUint8Array(wasm) }, { canisterId });
          output.value += `Code installed\n`;
          const actor = await fetchActor(canisterId);
          overlay.style.visibility = 'visible';
          render(overlay, canisterId, actor);
          // close button
          const close = document.createElement('input');
          close.type = 'button';
          close.value = 'Delete canister';
          document.body.appendChild(close);
          close.addEventListener('click', () => {
            (async () => {
              if (overlay.style.visibility === 'visible') {
                hide.click();
              }
              output.value += 'Deleting canister...\n';
              await ic0.stop_canister({ canister_id: canisterId });
              output.value += 'Canister stopped\n';
              await ic0.delete_canister({ canister_id: canisterId });
              output.value += 'Canister deleted\n';
              close.remove();
            })();
          });
        })().catch(err => {
          output.value += 'IC Exception:\n' + err.stack;
          throw err;
        });
      }
    } catch(err) {
      output.value = 'Exception:\n' + err;
      throw err;
    };    
  });  
}

export function renderInit(item, candid, wasm, canisterId) {
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
  const button = document.createElement('button');
  button.className = 'btn';
  button.innerText = 'Install';
  item.appendChild(button);
  
  const resultDiv = document.createElement('div');
  resultDiv.className = 'result';
  item.appendChild(resultDiv);
  
  button.addEventListener('click', () => {
    const args = inputs.map(arg => arg.parse());
    const isReject = inputs.some(arg => arg.isRejected());
    if (isReject) {
      return;
    }
    const encoded = IDL.encode(argTypes, args);
    (async () => {
      resultDiv.innerText = 'Waiting...';
      resultDiv.style.display = 'block';
      await Actor.install({ module: blobFromUint8Array(wasm), arg: blobFromUint8Array(encoded) }, { canisterId });
      output.value += 'Code installed\n';
      const canister = Actor.createActor(candid.default, { canisterId });
      render(item, canisterId, canister);
    })();
  });
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
    editor.session.setOptions({
      'mode': 'ace/mode/swift',
      'wrap': true,
      'tabSize': 2,
    });
    editor.session.setValue(prog);
    output.value += 'Editor loaded.\n';
  });
  // Load Motoko compiler
  const js = await retrieve('mo_js.js');
  const script = document.createElement('script');
  script.text = js;
  document.body.appendChild(script);
  output.value += 'Compiler loaded.\n';
  // Load base library
  loadBase('Time.mo');
  // TODO check if base library are loaded
  output.value += 'Ready.\n';
}

initUI();
init();
