export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'makeChild' : IDL.Func([IDL.Nat], [], []),
    'removeChild' : IDL.Func([IDL.Nat], [], []),
    'sayHi' : IDL.Func([IDL.Nat], [IDL.Opt(IDL.Text)], []),
    'startCanister' : IDL.Func([IDL.Nat], [], []),
    'stopChild' : IDL.Func([IDL.Nat], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
