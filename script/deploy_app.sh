#!ic-repl
load "prelude.sh";

identity dfx "~/.config/dfx/identity/default/identity.pem";
load env_name("testnet");

function is_expired(info, ttl) {
  let now = exec("date", "+%s000000000", record { silence = true });
  let elapsed = sub(now, info.timestamp);
  gte(elapsed, ttl);
};

function deploy_backend(base_path) {
  let wasm = file(stringify(base_path, "backend.wasm"));
  let expired = ite(exist(backend_info), is_expired(backend_info, backend_init?.canister_time_to_live), true);
  if expired {
      "Canister expired. Skipping stable types check."
  } else {
      "Checking stable types...";
      let old_file_path = stringify(base_path, "backend.most.old");
      let old_stable_types = read_state("canister", backend_info.id, "metadata/motoko:stable-types");
      let _ = exec("rm", "-f", old_file_path);
      let _ = output(old_file_path, old_stable_types);
      let _ = exec("mops-cli", "moc", "--", "--stable-compatible", old_file_path, stringify(base_path, "backend.most"));
  };
  let info = ite(exist(backend_info), opt backend_info, null);
  let new_info = call Backend.deployCanister(info, opt record { arg = encode (); wasm_module = wasm; });
  stringify("Deployed backend canister id ", new_info[0].id, " with ", new_info[1]);
  new_info[0];
};

function build_frontend(name) {
  "Building frontend...";
  let project_path = stringify(name, "/frontend");
  let hbs_data = stringify(project_path, "/hbs_data.json");
  exec("rm", "-f", hbs_data);
  let _ = output(hbs_data, stringify("{ \"canister_name\": \"backend\", \"canister_name_ident\": \"backend\", \"canister_name_process_env\": \"'", backend_info.id, "'\" }"));
  let candid_file = stringify(name, "/backend/backend.did");
  let declaration_path = stringify(project_path, "/declarations/backend");
  let _ = exec("node", "bindgen.js", candid_file, declaration_path, hbs_data);
  let _ = exec("npm", "run", "build", record { cwd = project_path });
};

function deploy_frontend(dist) {
  let expired = ite(exist(frontend_info), is_expired(frontend_info, frontend_init?.canister_time_to_live), true);
  let info = ite(exist(frontend_info), opt frontend_info, null);
  if expired { // TODO: check it is also not transferred
      "Frontend caniter expired, fetching a new one...";
      let new_info = call Frontend.deployCanister(info, null);
  } else {
      let new_info = record { info? };
  };
  let id = new_info[0].id;
  stringify("Uploading assets to canister ", id);
  let _ = exec("./chunked-sync", dist, "--canister-id", stringify(id));
  new_info[0];
};

function __main(name) {
  let env = stringify(name, "/app.env");
  load stringify(env, "?");
  let _ = exec("bash", "../../build_motoko.sh", "main.mo", record { cwd = stringify(name, "/backend") });
  let wasm_path = stringify(name, "/backend/");
  stringify("Built backend at ", wasm_path);
  let backend_info = deploy_backend(wasm_path);
  build_frontend(name);
  "Built frontend";
  let frontend_info = deploy_frontend(stringify(name, "/frontend/dist"));
  export(env, backend_info, frontend_info);
  stringify(frontend_info.id);
};
