import * as ic from './bootstrap';
import { retrieve, codeToUri } from '../util';

export class MotokoWorker {
  constructor(ctx) {
    retrieve('mo_js.js').then(js => {
      const uri = codeToUri(js);
      importScripts(uri);
      console.log('moc imported');
      console.log(self);
      self.postMessage({msg: 'moc_init'});
    });
    this._ctx = ctx;
    this._buffer = [];
  }
  syncFile(name, content) {
    if (typeof Motoko === 'undefined') {
      // Put request into buffer before moc is loaded
      this._buffer.push([name, content]);
    } else {
      this.cleanupBuffer();
      Motoko.saveFile(name, content);
    }
  }
  async doValidation(name) {
    this.cleanupBuffer();
    const diags = Motoko.check(name).diagnostics;
    return Promise.resolve(diags);
  }
  syncPackage(name, path) {
    Motoko.addPackage(name, path);
  }
  cleanupBuffer() {
    this._buffer.forEach(([name, content]) => {
      console.log(name);
      Motoko.saveFile(name, content);
    });
    this._buffer = [];
  }
}
