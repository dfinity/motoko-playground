#!ic-repl

// Immediately expire
let cycles = (100_000_000_000_000 : nat);
let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  TTL = 1;
};
load "install.sh";
let c1 = call S.getCanisterId();
c1;
let c2 = call S.getCanisterId();
c2;
let c3 = call S.getCanisterId();
c3;
let c4 = call S.getCanisterId();
c4;
assert c1.id == c3.id;
assert c2.id == c4.id;

// Out of capacity
let init = opt record {
  cycles_per_canister = 105_000_000_000;
  max_num_canisters = 2;
  TTL = 60_000_000_000;
};
load "install.sh";
call S.getCanisterId();
call S.getCanisterId();
fail call S.getCanisterId();
assert _ ~= "No available canister id";

// Out of cycle
let cycles = (10_000_000 : nat);
let init = (null : opt record {});
load "install.sh";
fail call S.getCanisterId();
assert _ ~= "from a call when only 10000000 was available";
