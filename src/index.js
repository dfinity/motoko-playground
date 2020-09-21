import assets from 'ic:canisters/playground_assets';
import didjs from 'ic:canisters/didjs';
import * as Wasi from './wasiPolyfill';
import { Actor, blobFromUint8Array, Principal } from '@dfinity/agent';
import ic_idl from './management';

const prog = `import Time "mo:base/Time";
import Prim "mo:prim";
actor {
  var c = Time.now();
  public query func greet(name : Text) : async Text {
    let uptime = (Time.now() - c)/1000000;
    return "Hello, " # name # " at " # (debug_show uptime) # "ms";
  };
  public func add() : async Int { c += 1; c };
};
`;

async function fetchActor(canisterId) {
  const common_interface = ({ IDL }) => IDL.Service({
    __get_candid_interface_tmp_hack: IDL.Func([], [IDL.Text], ['query']),
  });
  const actor = Actor.createActor(common_interface, { canisterId });
  const candid_source = await actor.__get_candid_interface_tmp_hack();
  const js = await didjs.did_to_js(candid_source);
  if (js === []) {
    return undefined;
  }
  console.log(js[0]);
  const dataUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(js[0]);
  const candid = await eval('import("' + dataUri + '")');
  return Actor.createActor(candid.default, { canisterId });
}

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

  overlay = document.createElement('iframe');
  overlay.style = "position:absolute; top:4em; right:0; z-index:10; width:50%; height: 80%; visibility:hidden; border:0;";
  
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
          await Actor.install({ module: blobFromUint8Array(wasm) }, { canisterId });
          output.value += `Code installed\n`;
          const actor = await fetchActor(canisterId);
          /*
          const url = window.location.origin + `/candid?canisterId=${canisterId}`;
          overlay.src = url;
          overlay.style.visibility = 'visible';*/
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
