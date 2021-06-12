import { setMarkers, editor } from './monaco';
import { log, clearLogs } from './log';
import { canister, canister_ui } from './build';
import { backend } from './agent';

// map filepath to code session { state, model }
export const files = {};
export var current_session_name = "main.mo";
export const filetab = document.createElement('div');

export function addFile(name, content) {
  const model = monaco.editor.createModel(content, 'motoko');
  files[name] = {model, state: null};
  addFileEntry('file', name, model);
  let handle;
  model.onDidChangeContent(() => {
    clearTimeout(handle);
    handle = setTimeout(() => {
      /*const proxy = worker.getProxy();
      proxy.then((p) => {
        p.doValidate(null).then((r) => { console.log(r) })
      });*/
      saveCodeToMotoko();
      const diags = Motoko.check(name).diagnostics;
      setMarkers(diags);
    }, 500);
  });
}

export function addFileEntry(type, name, model) {
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

export async function addPackage(name, repo, version, dir) {
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

export function saveCodeToMotoko() {
  for (const [name, session] of Object.entries(files)) {
    Motoko.saveFile(name, session.model.getValue());
  }
  const aliases = [];
  for (const [name, id] of Object.entries(canister)) {
    aliases.push([name, id.toText()]);
  }
  Motoko.setActorAliases(aliases);
}

export async function saveFiles() {
  const code = [];
  for (const [name, session] of Object.entries(files)) {
    code.push([name, session.model.getValue()]);
  }
  const canisters = [];
  for (const [name, id] of Object.entries(canister)) {
    canisters.push({ name, id, owner: id, timestamp: 0n });
  }
  await backend.saveProject({ files: code, packages: [], canisters });
}

export async function loadFiles() {
  let project = await backend.loadProject();
  for (const info of project.canisters) {
    console.log(info);
  }
}
