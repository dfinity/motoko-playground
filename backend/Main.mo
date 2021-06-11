import State "./State";

actor {
    var state = State.empty();
    
    public shared(msg) func loadProject() : async ?State.ProjectInfo {
        state.project.get(msg.caller)
    };
    public shared(msg) func saveProject(info : State.ProjectInfo) : async () {
        state.project.put(msg.caller, info);
    };
}
