#!ic-repl

identity dfx "~/.config/dfx/identity/default/identity.pem";
load "deployed.env";

function deploy_backend(wasm) {
  let info = ite(exist(backend_info), opt backend_info, null);
  let new_info = call Backend.deployCanister(info, opt record { arg = encode (); wasm_module = wasm; });
  stringify("Deployed canister id ", new_info[0].id, " with ", new_info[1]);
  let _ = new_info[0];
};

function deploy_frontend(dist) {
  let info = ite(exist(frontend_info), opt frontend_info, null);
  let new_info = call Frontend.deployCanister(info, null);
  let id = new_info[0].id;
};

function __main(name, backend_wasm_path) {
  let env = stringify(name, ".env");
  load stringify(env, "?");
  let backend_info = deploy_backend(file(backend_wasm_path));
  let _ = export(env, backend_info);
};
