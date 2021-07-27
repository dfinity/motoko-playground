import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Hash "mo:base/Hash";
import Error "mo:base/Error";
import Prim "mo:⛔";

import Types "Types";

actor {

  public type Project = Types.MotokoProject;

  public type HashId = Nat;

  public type SavedProject = {
    timestamp : Time.Time;
    project : Project;
  };

  // Represents a set of saved projects, using their hashes.
  // (But rather than store this type directly, we use ProjectTable instead.)
  public type Projects =
    Trie.Trie<SavedProject, ()>;

  /// Indexes a set of Projects; permits lookup by hash,
  /// without knowing the "full project" as a key.
  public type ProjectTable =
    Trie.Trie<HashId, SavedProject>;

  func equalProject(p1 : Project, p2 : Project) : Bool {
    p1 == p2
  };

  func hashProject(p : Project) : Nat32 {
    var x : Nat32 = 5381;
    func hashCont(x_ : Nat32, text : Text) : Nat32 {
      var x = x_;
      for (char in text.chars()) {
        let c : Nat32 = Prim.charToNat32(char);
        x := ((x << 5) +% x) +% c;
      };
      x
    };
    for (file in p.files.vals()) {
      x := hashCont(x, file.name);
      x := hashCont(x, file.content);
    };
    x
  };

  stable var stableProjects : ProjectTable = Trie.empty();

  public func putProject(p : Project) : async HashId {
    let hashId  = hashProject(p);
    let key = { key = Nat32.toNat(hashId); hash = hashId };
    let saved = {
      timestamp = Time.now();
      project = p;
    };
    let (ps, _) = Trie.replace<Nat, SavedProject>(stableProjects, key, Nat.equal, ?saved);
    stableProjects := ps;
    key.key
  };

  public query func getProject(hashId : HashId) : async ?SavedProject {
    let key = { hash = Nat32.fromNat(hashId); key = hashId };
    Trie.find<Nat, SavedProject>(stableProjects, key, Nat.equal)
  };
}
