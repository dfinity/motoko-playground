import Principal "mo:base/Principal";
import Buffer "mo:base/Buffer";
import Map "mo:base/HashMap";

module {
    type Map<K,V> = Map.HashMap<K,V>;
    type Buffer<T> = Buffer.Buffer<T>;
    public type CanisterInfo = {
        name: Text;
        id: Principal;
        owner: Principal;
        timestamp: Int;
    };
    public type ProjectInfo = {
        files: [(Text, Text)];
        packages: [Text];
        canisters: [CanisterInfo];
    };
    public type SharedProjectInfo = {
        files: [(Text, Text)];
        packages: [Text];
        canisters: [CanisterInfo];        
    };
    public type State = {
        project: Map<Principal, ProjectInfo>;
        canisterPool: [Principal];
    };
    public func empty() : State {
        {
            project = Map.HashMap<Principal, ProjectInfo>(0, Principal.equal, Principal.hash);
            canisterPool = [];
        }
    };
}
