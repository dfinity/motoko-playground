export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'binding' : IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    'did_to_js' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    'subtype' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
