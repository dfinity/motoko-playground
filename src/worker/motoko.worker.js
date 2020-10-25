import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker';
import { MotokoWorker } from './motoko';
import * as ic from './bootstrap';
import { retrieve, codeToUri } from '../util';

retrieve('mo_js.js').then(js => {
  const uri = codeToUri(js);
  importScripts(uri);
  console.log('moc imported');
});

self.onmessage = () => {
  worker.initialize((ctx, createData) => {
    return new MotokoWorker(ctx, createData);
  });
}
