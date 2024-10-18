#!ic-repl
identity dfx "~/.config/dfx/identity/default/identity.pem";

let ttl = 2700_000_000_000;
let now = exec("date", "+%s000000000", record { silence = true });

function is_not_expired(info) {
  let elapsed = sub(now, info.timestamp);
  lt(elapsed, ttl);
};

function __main(backend) {
  let children = call backend.dump();
  let active = children.filter(is_not_expired);
  stringify(active.size());
};
