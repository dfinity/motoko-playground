import { setMarkers, editor, worker } from './monaco';
import { log, clearLogs } from './log';
import { canister, canister_ui } from './build';

// map filepath to code session { state, model }
export const files = {};
//export var current_session_name = "main.mo";
export const filetab = document.createElement('div');

export const resources = new Resources();

export class Resources {
  constructor() {
    this.files = {};
    this.canisters = {};
    //this.filetab = document.createElement('div');
    this.current_name = 'main.mo';
  }
  addFile(name, content) {
    const uri = monaco.Uri.file(name);
    const model = monaco.editor.createModel(content, 'motoko', uri);
    this.files[name] = { model, state: null };
    this.addEntry('file', name, model);
    worker().then(m => m.syncFile(name, content));
    let handle;
    model.onDidChangeContent(() => {
      clearTimeout(handle);
      handle = setTimeout(() => {
        const proxy = worker();
        proxy.then(m => {
          m.syncFile(name, model.getValue());
          m.doValidation(name).then(setMarkers);
        });
      });
    });
  }
  async addPackage(name, repo, version, dir) {
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
          worker().then(m => {
            m.syncFile(stripped, content);
          });
        })();
        promises.push(promise);
      }
    }
    Promise.all(promises).then(() => {
      worker().then(m => m.syncPackage(name, name + '/'));
      log(`Package ${name} loaded (${promises.length} files).`)
      // add ui
      const content = [`// Fetched from ${repo}@${version}/${dir}`, ...fetchedFiles.map(s => `mo:${s.slice(0,-3)}`)].join('\n');
      const model = monaco.editor.createModel(content, 'motoko', `mo:${name}`);
      this.addEntry('package', `mo:${name}`, model);
    });
  }
  getModel(name) {
    return this.files[name].model;
  }
  addEntry(type, name, model) {
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
      editor.setModel(model);
      if (this.files[this.current_name]) {
        this.files[this.current_name].state = editor.saveViewState();
      }
      if (this.files[name] && this.files[name].state) {
        editor.restoreViewState(this.files[name].state);
      }
      this.current_name = name;
    });
  }
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
