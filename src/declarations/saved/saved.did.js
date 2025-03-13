export const idlFactory = ({ IDL }) => {
  const HashId = IDL.Nat;
  const Time = IDL.Int;
  const NamedFile = IDL.Record({ content: IDL.Text, name: IDL.Text });
  const PackageInfo = IDL.Record({
    dir: IDL.Opt(IDL.Text),
    name: IDL.Text,
    homepage: IDL.Opt(IDL.Text),
    repo: IDL.Text,
    version: IDL.Text,
  });
  const CanisterInfo = IDL.Record({
    id: IDL.Principal,
    name: IDL.Text,
    candid: IDL.Text,
  });
  const Project = IDL.Record({
    files: IDL.Vec(NamedFile),
    packages: IDL.Opt(IDL.Vec(PackageInfo)),
    canisters: IDL.Opt(IDL.Vec(CanisterInfo)),
  });
  const SavedProject = IDL.Record({ timestamp: Time, project: Project });
  const StatResult = IDL.Record({
    byte_size: IDL.Nat,
    num_projects: IDL.Nat,
  });
  const Saved = IDL.Service({
    getProject: IDL.Func([HashId], [IDL.Opt(SavedProject)], ["query"]),
    getProjectsPage: IDL.Func(
      [IDL.Nat, IDL.Nat],
      [IDL.Vec(IDL.Tuple(HashId, SavedProject))],
      ["query"],
    ),
    getStats: IDL.Func([], [StatResult], ["query"]),
    putProject: IDL.Func([Project], [HashId], []),
  });
  return Saved;
};
export const init = ({ IDL }) => {
  return [];
};
