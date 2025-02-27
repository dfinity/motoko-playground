export const idlFactory = ({ IDL }) => {
  const Config = IDL.Record({
    backend_canister_id: IDL.Opt(IDL.Principal),
    remove_cycles_add: IDL.Bool,
    profiling: IDL.Opt(
      IDL.Record({
        start_page: IDL.Opt(IDL.Nat32),
        page_limit: IDL.Opt(IDL.Nat32),
      }),
    ),
    limit_stable_memory_page: IDL.Opt(IDL.Nat32),
    limit_heap_memory_page: IDL.Opt(IDL.Nat32),
  });
  return IDL.Service({
    is_whitelisted: IDL.Func(
      [IDL.Vec(IDL.Nat8)],
      [IDL.Vec(IDL.Nat8)],
      ["query"],
    ),
    transform: IDL.Func(
      [IDL.Vec(IDL.Nat8), Config],
      [IDL.Vec(IDL.Nat8)],
      ["query"],
    ),
  });
};
export const init = ({ IDL }) => {
  return [];
};
