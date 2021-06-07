export default ({ IDL }) => {
  const Kind = IDL.Variant({
    User: IDL.Null,
    Canister: IDL.Null,
    Unknown: IDL.Null,
  });
  const Role = IDL.Variant({
    Custodian: IDL.Null,
    Contact: IDL.Null,
    Controller: IDL.Null,
  });
  const AddressEntry = IDL.Record({
    id: IDL.Principal,
    kind: Kind,
    name: IDL.Opt(IDL.Text),
    role: Role,
  });
  const EventKind = IDL.Variant({
    CyclesReceived: IDL.Record({
      from: IDL.Principal,
      amount: IDL.Nat64,
    }),
    CanisterCreated: IDL.Record({
      cycles: IDL.Nat64,
      canister: IDL.Principal,
    }),
    CanisterCalled: IDL.Record({
      cycles: IDL.Nat64,
      method_name: IDL.Text,
      canister: IDL.Principal,
    }),
    CyclesSent: IDL.Record({
      to: IDL.Principal,
      amount: IDL.Nat64,
      refund: IDL.Nat64,
    }),
    AddressRemoved: IDL.Record({ id: IDL.Principal }),
    WalletDeployed: IDL.Record({ canister: IDL.Principal }),
    AddressAdded: IDL.Record({
      id: IDL.Principal,
      name: IDL.Opt(IDL.Text),
      role: Role,
    }),
  });
  const Event = IDL.Record({
    id: IDL.Nat32,
    kind: EventKind,
    timestamp: IDL.Nat64,
  });
  const ResultCall = IDL.Variant({
    Ok: IDL.Record({ return: IDL.Vec(IDL.Nat8) }),
    Err: IDL.Text,
  });
  const CanisterSettings = IDL.Record({
    controller: IDL.Opt(IDL.Principal),
    freezing_threshold: IDL.Opt(IDL.Nat),
    memory_allocation: IDL.Opt(IDL.Nat),
    compute_allocation: IDL.Opt(IDL.Nat),
  });
  const CreateCanisterArgs = IDL.Record({
    cycles: IDL.Nat64,
    settings: CanisterSettings,
  });
  const ResultCreate = IDL.Variant({
    Ok: IDL.Record({ canister_id: IDL.Principal }),
    Err: IDL.Text,
  });
  const ResultSend = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  return IDL.Service({
    add_address: IDL.Func([AddressEntry], [], []),
    add_controller: IDL.Func([IDL.Principal], [], []),
    authorize: IDL.Func([IDL.Principal], [], []),
    deauthorize: IDL.Func([IDL.Principal], [], []),
    get_chart: IDL.Func(
      [
        IDL.Opt(
          IDL.Record({
            count: IDL.Opt(IDL.Nat32),
            precision: IDL.Opt(IDL.Nat64),
          })
        ),
      ],
      [IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64))],
      ["query"]
    ),
    get_controllers: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    get_custodians: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    get_events: IDL.Func(
      [
        IDL.Opt(
          IDL.Record({
            to: IDL.Opt(IDL.Nat32),
            from: IDL.Opt(IDL.Nat32),
          })
        ),
      ],
      [IDL.Vec(Event)],
      ["query"]
    ),
    list_addresses: IDL.Func([], [IDL.Vec(AddressEntry)], ["query"]),
    name: IDL.Func([], [IDL.Opt(IDL.Text)], ["query"]),
    remove_address: IDL.Func([IDL.Principal], [], []),
    remove_controller: IDL.Func([IDL.Principal], [], []),
    set_name: IDL.Func([IDL.Text], [], []),
    wallet_balance: IDL.Func(
      [],
      [IDL.Record({ amount: IDL.Nat64 })],
      ["query"]
    ),
    wallet_call: IDL.Func(
      [
        IDL.Record({
          args: IDL.Vec(IDL.Nat8),
          cycles: IDL.Nat64,
          method_name: IDL.Text,
          canister: IDL.Principal,
        }),
      ],
      [ResultCall],
      []
    ),
    wallet_create_canister: IDL.Func([CreateCanisterArgs], [ResultCreate], []),
    wallet_create_wallet: IDL.Func([CreateCanisterArgs], [ResultCreate], []),
    wallet_receive: IDL.Func([], [], []),
    wallet_send: IDL.Func(
      [IDL.Record({ canister: IDL.Principal, amount: IDL.Nat64 })],
      [ResultSend],
      []
    ),
    wallet_store_wallet_wasm: IDL.Func(
      [IDL.Record({ wasm_module: IDL.Vec(IDL.Nat8) })],
      [],
      []
    ),
  });
};
export const init = ({ IDL }) => {
  return [];
};

