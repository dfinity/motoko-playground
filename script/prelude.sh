
function network_name() {
  if or(eq(replica_url(), "https://icp0.io"), eq(replica_url(), "https://ic0.app")) {
    let _ = "ic";
  } else {
    let _ = "local";
  };
};

function unwrap_result(res) {
  if exist(res.Ok) {
    res.Ok;
  } else {
    stringify(res.Err);
    fail res.Err;
  };
};

function env_name(name) {
  let _ = stringify(name, "-", network_name(), ".env");
};

function get_subnet_for_canister(opt_canister_id) {
  let res = call registry.get_subnet_for_canister(record { "principal" = opt_canister_id });
  if exist(res.Ok) {
      res.Ok.subnet_id;
  } else {
      stringify(res.Err);
      null;
  };
};

function create_canister_from_cycles_ledger(opt_cycles, opt_next_to_id) {
  let opt_subnet_id = get_subnet_for_canister(opt_next_to_id);
  let subnet_selection = ite(exist(opt_subnet_id?), opt variant { Subnet = record { subnet = opt_subnet_id? } }, null);
  let res = unwrap_result(call cycles_ledger.create_canister(record {
    from_subaccount = null;
    created_at_time = null;
    amount = opt_cycles?;
    creation_args = opt record {
      subnet_selection = subnet_selection;
      settings = opt record {
        controllers = opt vec { dfx };
      };
    };
  }));
  res.canister_id;
};

function install(id, wasm, args, mode) {
  call ic.install_code(
    record {
      arg = encode wasm.__init_args(args);
      wasm_module = wasm;
      mode = mode;
      canister_id = id;
    });  
};
