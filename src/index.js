import { loadEditor } from './monaco';
import { addFile, addPackage, current_session_name, filetab } from './file';
import { log, output } from './log';
import { interpret, wasi, deploy } from './build';
import './candid.css';
import './playground.css';

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
    const pack = prompt('Please enter package info (name, github repo, version, directory)', 'matchers, kritzcreek/motoko-matchers, 1.1.1, src');
    if (pack) {
      const args = pack.split(',').map(s => s.trim());
      addPackage(...args);
    }
  });
  
  run.addEventListener('click', () => interpret(current_session_name));
  compile.addEventListener('click', () => wasi(current_session_name));
  ic.addEventListener('click', () => deploy(current_session_name));
}

async function init() {
  // Load Monaco editor
  loadEditor();
  // Load Motoko compiler
  const script = document.createElement('script');
  document.body.appendChild(script);
  script.addEventListener('load', async () => {
    log('Compiler loaded.');
    await addPackage('base', 'dfinity/motoko-base', 'dfx-0.7.0', 'src');
    log('Ready.');
  });
  script.src = 'https://download.dfinity.systems/motoko/0.6.2/js/moc-0.6.2.js';
}

initUI();
init();
