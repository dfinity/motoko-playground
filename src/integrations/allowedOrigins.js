// If you would like to use the editor integration system in a production environment,
// please submit a PR including the URL prefix for your application.
// Read more: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concerns

const ALLOWED_ORIGINS = [
  /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/, // Localhost
  "https://blocks-editor.github.io", // Blocks (visual Motoko smart contract editor)
];

export default ALLOWED_ORIGINS;
