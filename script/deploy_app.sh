#!ic-repl

identity dfx "~/.config/dfx/identity/default/identity.pem";
load "deployed.env";

function deploy_backend(wasm) {
  let info = ite(exist(info), info, null);
  let new_info = call Backend.deployCanister(info, opt record { arg = encode (); wasm_module = wasm; });
  if ne(new_info, info) {
      stringify("get a new canister id ", new_info.id);
    };
};
