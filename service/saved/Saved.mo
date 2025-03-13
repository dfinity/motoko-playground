import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Prim "mo:⛔";

import Types "Types";

shared ({ caller = owner }) actor class Saved() {

  public type Project = Types.MotokoProject;

  public type HashId = Nat;

  public type SavedProject = {
    timestamp : Time.Time;
    project : Project
  };

  // Represents a set of saved projects, using their hashes.
  // (But rather than store this type directly, we use ProjectTable instead.)
  public type Projects = Trie.Trie<SavedProject, ()>;

  /// Indexes a set of Projects; permits lookup by hash,
  /// without knowing the "full project" as a key.
  public type ProjectTable = Trie.Trie<HashId, SavedProject>;

  func hashProject(p : Project) : (Nat32, Nat) {
    // TODO input validation, e.g. duplicate filenames
    var size = 0;
    var x : Nat32 = 5381;
    func hashCont(x_ : Nat32, text : Text) : Nat32 {
      var x = x_;
      for (char in text.chars()) {
        let c : Nat32 = Prim.charToNat32(char);
        x := ((x << 5) +% x) +% c
      };
      x
    };
    // Hash is only computed based on files. Packages and canisters
    // are considered as configs which can be updated with the same code.
    for (file in p.files.vals()) {
      x := hashCont(x, file.name);
      x := hashCont(x, file.content);
      size += file.content.size() + file.name.size()
    };
    (x, size)
  };

  stable var stableProjects : ProjectTable = Trie.empty();
  stable var byteSize : Nat = 0;

  public func putProject(p : Project) : async HashId {
    let (hashId, size) = hashProject(p);
    let key = { key = Nat32.toNat(hashId); hash = hashId };
    let saved = {
      timestamp = Time.now();
      project = p
    };
    let (ps, existing) = Trie.replace<Nat, SavedProject>(stableProjects, key, Nat.equal, ?saved);
    switch existing {
      case (?_) {};
      case null {
        byteSize += size
      }
    };
    stableProjects := ps;
    key.key
  };

  public query func getProject(hashId : HashId) : async ?SavedProject {
    let key = { hash = Nat32.fromNat(hashId); key = hashId };
    Trie.find<Nat, SavedProject>(stableProjects, key, Nat.equal)
  };

  type StatResult = {
    num_projects : Nat;
    byte_size : Nat
  };
  public query func getStats() : async StatResult {
    {
      num_projects = Trie.size(stableProjects);
      byte_size = byteSize
    }
  };

  public query ({ caller }) func getProjectsPage(start : Nat, size : Nat) : async [(HashId, SavedProject)] {
    assert owner == caller;
    let iter = Trie.iter(stableProjects);

    for (i in Iter.range(0, start - 1)) {
      ignore iter.next()
    };

    let result = Buffer.Buffer<(HashId, SavedProject)>(size);

    label l for (i in Iter.range(start, start + size - 1)) {
      let ?item = iter.next() else break l;
      result.add(item)
    };

    Buffer.toArray(result)
  }
}
