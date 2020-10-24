import assets from 'ic:canisters/playground_assets';

async function retrieve(file) {
  const content = await assets.retrieve(file);
  return new TextDecoder().decode(new Uint8Array(content));
}

export var worker;

retrieve('motoko.worker.js').then(js => {
  const uri = URL.createObjectURL(new Blob([js], { type: 'application/javascript' }));
  worker = new Worker(uri);
});
