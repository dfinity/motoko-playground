
module {
  public type MotokoProject = {
      files : [NamedFile];
      packages : ?[PackageInfo];
      canisters : ?[CanisterInfo];
  };
  public type NamedFile = {
      name : Text;
      content : Text;
  };
  public type PackageInfo = {
      name: Text;
      repo: Text;
      version: Text;
      dir: ?Text;
      homepage: ?Text;
  };
  public type CanisterInfo = {
      id: Principal;
      name: Text;
      candid: Text;
  };
}
