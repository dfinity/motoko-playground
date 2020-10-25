import assets from 'ic:canisters/playground_assets';

export async function retrieve(file) {
  const content = await assets.retrieve(file);
  return new TextDecoder().decode(new Uint8Array(content));
}

export function codeToUri(code) {
  return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
}
