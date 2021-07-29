
module {
  public type MotokoProject = {
    files : [NamedFile];
  };
  public type NamedFile = {
    name : Text;
    content : Text;
  };
}
