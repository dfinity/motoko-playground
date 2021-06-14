import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import RBTree "mo:base/RBTree";
import Time "mo:base/Time";

module {
    type Map<K,V> = Map.HashMap<K,V>;
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
    func canisterInfoCompare(x: CanisterInfo, y: CanisterInfo): {#less;#equal;#greater} {
        if (x.timestamp < y.timestamp) { #less }
        else if (x.timestamp == y.timestamp and x.id < y.id) { #less }
        else if (x.id == y.id) { #equal }
        else { #greater }
    };
    public class CanisterPool(size: Nat, TTL: Nat) {
        var len = 0;
        var tree = RBTree.RBTree<CanisterInfo, ()>(canisterInfoCompare);
        public type NewId = { #newId; #reuse:Principal; #outOfCapacity:Int };
        public func getExpiredCanisterId() : NewId {
            if (len < size) {
                #newId
            } else {
                switch (tree.entries().next()) {
                case null #outOfCapacity(-1);
                case (?(info,_)) {
                         let now = Time.now();
                         let elapsed = now - info.timestamp;
                         if (elapsed >= TTL) {
                             tree.delete(info);
                             tree.put({ timestamp = now; id = info.id }, ());
                             #reuse(info.id)
                         } else {
                             #outOfCapacity(TTL - elapsed)
                         }
                     };
                };
            };
        };
        public func add(info: CanisterInfo) {
            if (len >= size) {
                assert false;
            };
            len += 1;
            tree.put(info, ());
        };
        public func getInfo(id: Principal) : ?CanisterInfo {
            let now = Time.now();
            for ((info, _) in tree.entriesRev()) {
                if (info.id == id) return ?info;
                if (info.timestamp < now - TTL) return null;
            };
            null
        };
        public func refresh(info: CanisterInfo) {
            tree.delete(info);
            tree.put({ timestamp = Time.now(); id = info.id }, ());
        };
        public func retire(info: CanisterInfo) {
            tree.delete(info);
            tree.put({ timestamp = 0; id = info.id }, ());
        };
        public func share() : RBTree.Tree<CanisterInfo, ()> {
            tree.share()
        };
    };
    public type ProjectInfo = {
        files: [(Text, Text)];
        packages: [Text];
    };
    public type State = {
        project: Map<Principal, ProjectInfo>;
    };
    public func empty() : State {
        {
            project = Map.HashMap<Principal, ProjectInfo>(0, Principal.equal, Principal.hash);
        }
    };
}
