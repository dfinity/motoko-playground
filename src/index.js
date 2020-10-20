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
const fac = `import Debug "mo:base/Debug";
func fac(n : Nat) : Nat {
  if (n == 0) return 1;
  return n * fac(n-1);
};
Debug.print(debug_show (fac(20)));
`;
const matchers = `import Suite "mo:matchers/Suite";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";

func fac(n : Nat) : Nat {
  if (n == 0) return 1;
  return n * fac(n-1);
};

let suite = Suite.suite("factorial", [
  Suite.test("fac(0)", fac(0), M.equals(T.nat 1)),
  Suite.test("fac(10)", fac(10), M.equals(T.nat 3628800)),
]);
Suite.run(suite);
`;
const type = `module {
  public type Counter = { topic: Text; value: Nat; };
  public type List<T> = ?(T, List<T>);
}
`;
const pub = `import Array "mo:base/Array";
import T "./types";
actor Publisher {
    public type Subscriber = { topic: Text; callback: shared T.Counter -> (); };
    var subscribers: [Subscriber] = [];

    public func subscribe(subscriber: Subscriber) {
        subscribers := Array.append<Subscriber>(subscribers, [subscriber]);
    };

    public func publish(counter: T.Counter) {
        for (subscriber in subscribers.vals()) {
            if (subscriber.topic == counter.topic) {
                subscriber.callback(counter);
            };
        };
    };
};
`;
const sub = `import Publisher "canister:pub";
import T "./types";
actor Subscriber {
    let counter_topic = "Apples";
    var count: Nat = 0;

    public func init() {
        Publisher.subscribe({ topic = counter_topic; callback = updateCount; });
    };
    public func updateCount(counter: T.Counter) {
        count += counter.value;
    };
    public query func getCount(): async Nat {
        count
    };
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
    const content = [`// Fetched from ${repo}@${version}/${dir}`, ...fetchedFiles.map(s => `mo:${s.slice(0,-3)}`)].join('\n');
    const model = monaco.editor.createModel(content, 'motoko');
    addFileEntry('package', `mo:${name}`, model);
  });
}

function addFile(name, content) {
  const model = monaco.editor.createModel(content, 'motoko');
  files[name] = {model, state: null};
  addFileEntry('file', name, model);
}

function saveCodeToMotoko() {
  for (const [name, session] of Object.entries(files)) {
    Motoko.saveFile(name, session.model.getValue());
  }
  const aliases = [];
  for (const [name, id] of Object.entries(canister)) {
    aliases.push([name, id.toText()]);
  }
  Motoko.setActorAliases(aliases);
}

let output;
let editor;
let filetab;

let current_session_name;
const ic0 = Actor.createActor(ic_idl, { canisterId: Principal.fromHex('') });
// map filepath to code session { state, model }
const files = {};
// map canister name to canister id
const canister = {};
// map canister name to ui
const canister_ui = {};
// map canister name to candid
const canister_candid = {};

function getCanisterName(path) {
  return path.split('/').pop().slice(0,-3);
}

function addFileEntry(type, name, model) {
  const entry = document.createElement('button');
  entry.innerText = name;
  if (type === 'package') {
    entry.style = 'color:blue';
  } else if (type === 'canister') {
    entry.style = 'color:green';
  }
  filetab.appendChild(entry);
  entry.addEventListener('click', () => {
    for (const e of filetab.children) {
      e.className = '';
    }
    entry.className = 'active';
    if (type === 'canister') {
      clearLogs();      
      const ui = canister_ui[name.slice(9)];
      log(ui);      
    } else {
      if (files[current_session_name]) {
        files[current_session_name].state = editor.saveViewState();
      }
      if (files[name] && files[name].state) {
        editor.restoreViewState(files[name].state);
      }
      editor.setModel(model);
      current_session_name = name;
    }
  });
  return entry;
}

function initUI() {
  document.title = 'Motoko Playground';
  const dom = document.createElement('div');
  dom.width = "100%";
  dom.style = "width:100%;height:90vh;display:flex;align-items:stretch; position:relative";
  document.body.appendChild(dom);

  filetab = document.createElement('div');
  filetab.className = 'tab';
  
  const code = document.createElement('div');
  code.id = "editor";
  code.style = "height:90vh;width:50%;border:1px solid black;";

  output = document.createElement('div');
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
      const candid_result = Motoko.candid(current_session_name);
      log(candid_result.stderr);
      const candid_source = candid_result.result;
      if (!candid_source || candid_source.trim() === '') {
        log('cannot deploy empty candid file');
        return;
      }
      const tStart = Date.now();
      const out = Motoko.compileWasm("dfinity", current_session_name);
      const duration = (Date.now() - tStart) / 1000;
      if (out.result.code === null) {
        log(JSON.stringify(out.result.diagnostics));
      } else {
        log(`(compile time: ${duration}s)`);
        log(out.stderr + out.stdout);
        const wasm = out.result.code;
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

function log(content) {
  const line = document.createElement('div');
  line.className = 'console-line';
  if (content instanceof Element) {
    line.appendChild(content);
  } else {
    line.innerText = content;
  }
  output.appendChild(line);
  return line;
}

function clearLogs() {
  while (output.firstChild) {
    output.removeChild(output.firstChild);
  }
}

function registerMotoko() {
  monaco.languages.register({ id: 'motoko' });
  monaco.languages.setLanguageConfiguration('motoko', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },    
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "<", close: ">" },
    ],
  });
  monaco.languages.setMonarchTokensProvider('motoko', {
    defaultToken: '',
    tokenPostfix: '.mo',
    keywords: ['actor', 'and', 'async', 'assert', 'await', 'break', 'case', 'catch', 'class',
               'continue', 'debug', 'else', 'false', 'for', 'func', 'if', 'in', 'import',
               'module', 'not', 'null', 'object', 'or', 'label', 'let', 'loop', 'private',
               'public', 'return', 'shared', 'try', 'throw', 'debug_show', 'query', 'switch',
               'true', 'type', 'var', 'while', 'stable', 'flexible', 'system'
              ],
    accessmodifiers: ['public', 'private', 'shared'],
    typeKeywords: ['Any', 'None', 'Null', 'Bool', 'Int', 'Int8', 'Int16', 'Int32', 'Int64',
                   'Nat', 'Nat8', 'Nat16', 'Nat32', 'Nat64', 'Word8', 'Word16', 'Word32', 'Word64',
                   'Float', 'Char', 'Text', 'Blob', 'Error', 'Principal'
                  ],
    operators: ['=', '<', '>', ':', '<:', '?', '+', '-', '*', '/', '%', '**', '&', '|', '^',
                '<<', '>>', '#', '==', '!=', '>=', '<=', ':=', '+=', '-=', '*=', '/=',
                '%=', '**=', '&=', '|=', '^=', '<<=', '>>=', '#=', '->'
               ],
    symbols: /[=(){}\[\].,:;@#\_&\-<>`?!+*\\\/]/,
    // C# style strings
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        // identifiers and keywords
        [/[a-zA-Z_$][\w$]*/, { cases: { '@typeKeywords': 'keyword.type',
                                     '@keywords': 'keyword',
                                     '@default': 'identifier' } }],
        // whitespace
        { include: '@whitespace' },

        // delimiters and operators
        [/[{}()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, { cases: { '@operators': 'operator',
                                '@default'  : '' } } ],
        // numbers
        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'],

        // delimiter: after number because of .\d floats
        [/[;,.]/, 'delimiter'],
        
        // strings
        [/"([^"\\]|\\.)*$/, 'string.invalid' ],  // non-teminated string
        [/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ],

        // characters
        [/'[^\\']'/, 'string'],
        [/(')(@escapes)(')/, ['string','string.escape','string']],
        [/'/, 'string.invalid']
      ],

      comment: [
        [/[^\/*]+/, 'comment' ],
        [/\/\*/,    'comment', '@push' ],    // nested comment
        ["\\*/",    'comment', '@pop'  ],
        [/[\/*]/,   'comment' ]
      ],

      string: [
        [/[^\\"]+/,  'string'],
        [/@escapes/, 'string.escape'],
        [/\\./,      'string.escape.invalid'],
        [/"/,        { token: 'string.quote', bracket: '@close', next: '@pop' } ]
      ],

      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/,       'comment', '@comment' ],
        [/\/\/.*$/,    'comment'],
      ],        
    },
  });
}

function loadEditor() {
  const link = document.createElement('link');
  link.rel = "stylesheet";
  link.setAttribute('data-name', "vs/editor/editor.main");
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs/editor/editor.main.min.css';
  document.getElementsByTagName('head')[0].appendChild(link);
  const script = document.createElement('script');
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs/loader.min.js";
  document.body.appendChild(script);
  script.addEventListener('load', () => {
    const code = document.getElementById('editor');
    __non_webpack_require__.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs' }});
    window.MonacoEnvironment = {
      getWorkerUrl: function(workerId, label) {
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
        self.MonacoEnvironment = {
          baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min'
        };
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs/base/worker/workerMain.min.js');`
      )}`;
      }
    };
    __non_webpack_require__(["vs/editor/editor.main"], function () {
      registerMotoko();
      addFile('main.mo', prog);
      addFile('types.mo', type);
      addFile('pub.mo', pub);
      addFile('sub.mo', sub);
      addFile('fac.mo', fac);
      addFile('test.mo', matchers);      
      editor = monaco.editor.create(code, {
        model: files['main.mo'].model,
        language: 'motoko',
        theme: 'vs',
        wordWrap: 'on',
        wrappingIndent: "indent",
        minimap: { enabled: false },
      });
      current_session_name = 'main.mo';
      filetab.firstChild.click();
      log('Editor loaded.');
    });
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
