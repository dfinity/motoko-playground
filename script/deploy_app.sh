#!ic-repl

identity dfx "~/.config/dfx/identity/default/identity.pem";
load "deployed.env";

function is_expired(info, ttl) {
  let now = exec("date", "+%s000000000");
  let elapsed = sub(now, info.timestamp);
  let _ = gte(elapsed, ttl);
};

function deploy_backend(wasm) {
  let info = ite(exist(backend_info), opt backend_info, null);
  let new_info = call Backend.deployCanister(info, opt record { arg = encode (); wasm_module = wasm; });
  stringify("Deployed canister id ", new_info[0].id, " with ", new_info[1]);
  let _ = new_info[0];
};

function deploy_frontend(dist) {
  let expired = ite(exist(frontend_info), is_expired(frontend_info, frontend_init?.canister_time_to_live), true);
  let info = ite(exist(frontend_info), opt frontend_info, null);
  if expired {
      "Frontend caniter expired, fetching a new one...";
      let new_info = call Frontend.deployCanister(info, null);
  } else {
      let new_info = record { info? };
  };
  let id = new_info[0].id;
  stringify("Uploading assets to canister ", id);
  let _ = exec("./chunked-sync", dist, "--canister-id", stringify(id));
  let _ = new_info[0];
};

function __main(name, backend_wasm_path, frontend_dist_path) {
  let env = stringify(name, ".env");
  load stringify(env, "?");
  let backend_info = deploy_backend(file(backend_wasm_path));
  let frontend_info = deploy_frontend(frontend_dist_path);
  let _ = export(env, backend_info, frontend_info);
};
