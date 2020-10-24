import * as ic from './bootstrap';
import assets from 'ic:canisters/playground_assets';

async function retrieve(file) {
  const content = await assets.retrieve(file);
  return new TextDecoder().decode(new Uint8Array(content));
}

retrieve('mo_js.js').then(js => {
  const uri = URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
  importScripts(uri);
  console.log('moc imported');
});

self.onmessage = () => {
  console.log("motoko worker");
  console.log(Motoko.check('test.mo'));
}
