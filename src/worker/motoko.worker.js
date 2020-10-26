import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker';
import { MotokoWorker } from './motoko';

self.onmessage = () => {
  worker.initialize((ctx, createData) => {
    return new MotokoWorker(ctx, createData);
  });
}
