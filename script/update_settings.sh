#!ic-repl

identity dfx "~/.config/dfx/identity/default/identity.pem";

function __main(backend) {
  let children = call backend.dump();
  let i = 0;
  while lt(i, children.size()) {
      let info = children[i];
      call backend.update_settings(record { canister_id = info.id; settings = record { log_visibility = opt variant { public } } });
      stringify("Updated ", i, ": ", info.id);
      let i = add(i, 1);
  };
};

