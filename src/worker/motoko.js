import * as ic from './bootstrap';
import { retrieve, codeToUri } from '../util';

export class MotokoWorker {
  constructor(ctx, createData) {
    retrieve('mo_js.js').then(js => {
      const uri = codeToUri(js);
      importScripts(uri);
      console.log('moc imported');
    });
    this._ctx = ctx;
  }
  async doValidation(name) {
    const diags = Motoko.check(name).diagnostics;
    return Promise.resolve(diags);
  }
  syncFile(name, content) {
    return Motoko.saveFile(name, content);
  }
}
