import Iter "mo:base/Iter";
import State "./State";

actor {
    var state = State.empty();
    
    public query(msg) func loadProject() : async ?State.SharedProjectInfo {
        state.project.get(msg.caller)
    };
    public shared(msg) func saveProject(info : State.SharedProjectInfo) : async () {
        state.project.put(msg.caller, info);
    };
    public query func dump() : async [(Principal, State.SharedProjectInfo)] {
        Iter.toArray(state.project.entries());
    };
}
