// If you would like to use the editor integration system in a production environment,
// please submit a PR including the URL prefix for your application.
// Read more: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concerns

const ALLOWED_ORIGIN_PREFIXES = [
  "http://localhost", // Local machine
  "https://blocks-editor.github.io", // Blocks (visual Motoko smart contract editor)
];

export default ALLOWED_ORIGIN_PREFIXES;
