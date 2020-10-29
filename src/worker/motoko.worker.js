import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker';
import { MotokoWorker } from './motoko';

self.onmessage = () => {
  worker.initialize(ctx => {
    return new MotokoWorker(ctx);
  });
}
