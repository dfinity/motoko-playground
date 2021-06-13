import Principal "mo:base/Principal";
import Buffer "mo:base/Buffer";
import Map "mo:base/HashMap";
import Heap "mo:base/Heap";

module {
    type Map<K,V> = Map.HashMap<K,V>;
    type Buffer<T> = Buffer.Buffer<T>;
    public type InstallArgs = {
        arg : Blob;
        wasm_module : Blob;
        mode : { #reinstall; #upgrade; #install };
        canister_id : Principal;        
    };
    public type CanisterInfo = {
        id: Principal;
        timestamp: Int;
    };
    public type ProjectInfo = {
        files: [(Text, Text)];
        packages: [Text];
    };
    public type State = {
        project: Map<Principal, ProjectInfo>;
        canisterPool: Heap.Heap<CanisterInfo>;
    };
    public func empty() : State {
        func compare(x: CanisterInfo, y: CanisterInfo) : { #less; #equal; #greater } {
            if (x.timestamp < y.timestamp) { #greater } else { #less };
        };
        {
            project = Map.HashMap<Principal, ProjectInfo>(0, Principal.equal, Principal.hash);
            canisterPool = Heap.Heap(compare);
        }
    };
}
