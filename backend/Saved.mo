import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Hash "mo:base/Hash";
import Error "mo:base/Error";
import Prim "mo:⛔";

import Types "Types";

actor class Self() {

  public type Project = Types.MotokoProject;

  public type HashId = Nat;

  public type SavedProject = {
    timestamp : Time.Time;
    project : Project;
  };

  public type StableProjects =
    Trie.Trie<HashId, SavedProject>;

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

  stable var stableProjects : StableProjects = Trie.empty();

  public func putProject(p : Project) : async HashId {
    let hashId  = hashProject(p);
    let key = { key = Nat32.toNat(hashId); hash = hashId };
    let saved = {
      timestamp = Time.now();
      project = p;
    };
    let (ps, existing) = Trie.replace<Nat, SavedProject>(stableProjects, key, Nat.equal, ?saved);
    switch existing {
      case (?_) { throw Error.reject("This project already exists.") };
      case null { };
    };
    stableProjects := ps;
    key.key
  };

  public query func getProject(hashId : HashId) : async SavedProject {
    let key = { hash = Nat32.fromNat(hashId); key = hashId };
    switch (Trie.find<Nat, SavedProject>(stableProjects, key, Nat.equal)) {
      case null {
             throw Error.reject("Unknown hash identifier.")
           };
      case (?saved) {
             saved
           }
    }
  };
}
