#!ic-repl

let init = record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  TTL = 10;
};
load "install.sh";
let c1 = call S.getCanisterId();
let c2 = call S.getCanisterId();
let c3 = call S.getCanisterId();
let c4 = call S.getCanisterId();
assert c1.id == c3.id;
assert c2.id == c4.id;

