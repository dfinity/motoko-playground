import assets from 'ic:canisters/playground_assets';
import didjs from 'ic:canisters/didjs';
import * as Wasi from './wasiPolyfill';
import { Actor, blobFromUint8Array, Principal, IDL, UI } from '@dfinity/agent';
import ic_idl from './management';
import { fetchActor, didToJs, render } from './candid';
import './candid.css';
import './playground.css';

const prog = `import P "mo:base/Principal";
import List "mo:base/List";
import T "./types";
shared {caller} actor class Example(init : Int) = Self {
  public type Id = { caller : Principal; creator : Principal; canister : Principal };
  stable let controller = caller;
  stable var history = List.nil<Int>();
  var counter = init;
  
  system func preupgrade(){
    history := List.push(counter, history);
  };

  public query func getHistory() : async T.List<Int> { history };
  public query(msg) func getId() : async Id {
    {canister = P.fromActor(Self); creator = controller; caller = msg.caller}
  };
  public func add() : async Int { counter += 1; counter };
};
`;

async function retrieve(file) {
  const content = await assets.retrieve(file);
  return new TextDecoder().decode(new Uint8Array(content));
}

async function addPackage(name, repo, version, dir) {
  const meta_url = `https://data.jsdelivr.com/v1/package/gh/${repo}@${version}/flat`;
  const base_url = `https://cdn.jsdelivr.net/gh/${repo}@${version}`;
  const response = await fetch(meta_url);
  const json = await response.json()
  const promises = [];
  const fetchedFiles = [];
  for (const f of json.files) {
    if (f.name.startsWith(`/${dir}/`) && /\.mo$/.test(f.name)) {
      const promise = (async () => {
        const content = await (await fetch(base_url + f.name)).text();
        const stripped = name + f.name.slice(dir.length + 1);
        fetchedFiles.push(stripped);
        Motoko.saveFile(stripped, content);
      })();
      promises.push(promise);
    }
  }
  Promise.all(promises).then(() => {
    Motoko.addPackage(name, name + '/');
    log(`Package ${name} loaded (${promises.length} files).`)
    // add ui
    const content = [`Fetched from ${repo}@${version}/${dir}`, ...fetchedFiles.map(s => `mo:${s.slice(0,-3)}`)];
    const session = ace.createEditSession(content, 'ace/mode/text');
    addFileEntry(`mo:${name}`, session, true);
  });
}

function addFile(name, content) {
  const session = ace.createEditSession(content, 'ace/mode/swift');
  files[name] = session;
  addFileEntry(name, session, false);
}

function saveCodeToMotoko() {
  for (const [name, content] of Object.entries(files)) {
    Motoko.saveFile(name, content.getValue());
  }
}

let output;
let editor;
let filetab;
let canisterId;
let main_file = 'main.mo';
const ic0 = Actor.createActor(ic_idl, { canisterId: Principal.fromHex('') });
const files = {};

function addFileEntry(name, session, isPackage) {
  const entry = document.createElement('button');
  entry.innerText = name;
  if (isPackage) {
    entry.style = 'color:blue';
  }
  filetab.appendChild(entry);
  entry.addEventListener('click', () => {
    editor.setSession(session);
    for (const e of filetab.children) {
      e.className = '';
    }
    entry.className = 'active';
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
    saveCodeToMotoko();    
    log('Compiling...');
    try {
      const tStart = Date.now();
      const out = Motoko.compileWasm("wasi", main_file);
      const duration = (Date.now() - tStart) / 1000;
      if (out.result.code === null) {
        const diags = out.result.diagnostics;
        log(JSON.stringify(diags));
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
    saveCodeToMotoko();    
    log('Compiling...');
    try {
      // There is a bug in jsoo that will raise an exception when type checking fails.
      // This seems to only happen in dfinity mode
      const check = Motoko.check(main_file);
      log(JSON.stringify(check.result.diagnostics));
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
    addFile('main.mo', prog);
    addFile('types.mo', 'type List<T> = ?(T, List<T>);');
    filetab.firstChild.click();
    log('Editor loaded.');
  });
  // Load Motoko compiler
  const js = await retrieve('mo_js.js');
  const script = document.createElement('script');
  script.text = js;
  document.body.appendChild(script);
  log('Compiler loaded.');
  // Load library  
  addPackage('base', 'dfinity/motoko-base', 'dfx-0.6.6', 'src');
}

initUI();
init().then(() => { log('Ready.'); });
