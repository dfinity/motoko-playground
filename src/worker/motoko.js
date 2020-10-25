

export class MotokoWorker {
  constructor(ctx, createData) {
    this._ctx = ctx;
  }
  async doValidation(uri) {
    const content = this._getDoc(uri);
    //console.log(uri, content);
    if (content) {
      Motoko.saveFile(uri, content);
      const diags = Motoko.check(uri).diagnostics;
      return Promise.resolve(diags);
    }
    return Promise.resolve([]);
  }
  _getDoc(uri) {
    const models = this._ctx.getMirrorModels();
    for (const model of models) {
      console.log(model.uri.toString(), uri)
      if (model.uri.toString() === uri) {
        return model.getValue();
      }
    }
  }
}

