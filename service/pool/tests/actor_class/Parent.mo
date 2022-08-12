import Array "mo:base/Array";
import Cycles "mo:base/ExperimentalCycles";
import Child "Child";
import Principal "mo:base/Principal";

actor Parent {
  let IC =
    actor "aaaaa-aa" : actor {
      create_canister : { } -> async { canister_id : Principal };
      stop_canister : { canister_id : Principal } -> async ();
      start_canister : { canister_id : Principal } -> async ();
      delete_canister : { canister_id : Principal } -> async ();
    };

  type Child = Child.Child;
  let children : [var ?Child] = Array.init(5, null);

  public func sayHi(i : Nat) : async ?Text {
    do ? {
      await children[i]!.sayHi()
    }
  };

  public func makeChild(i : Nat) : async () {
    Cycles.add(550_000_000_000);
    let b = await Child.Child();
    children[i] := ?b;
  };

  public func removeChild(i : Nat) : async () {
    ignore do ? {
      await IC.delete_canister { canister_id = Principal.fromActor(children[i]!) };
      children[i] := null;
    }
  };

  public func stopChild(i : Nat) : async () {
    ignore do ? {
      await IC.stop_canister { canister_id = Principal.fromActor(children[i]!) };
    }
  };

  public func startCanister(i : Nat) : async () {
    ignore do ? {
      await IC.start_canister { canister_id = Principal.fromActor(children[i]!) };
    }
  };
}