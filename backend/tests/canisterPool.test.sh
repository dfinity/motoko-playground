#!ic-repl -r http://localhost:8000

import S = "rwlgt-iiaaa-aaaaa-aaaaa-cai";

let c1 = call S.getCanisterId();
let c2 = call S.getCanisterId();
let c3 = call S.getCanisterId();
let c4 = call S.getCanisterId();
call S.dump();
