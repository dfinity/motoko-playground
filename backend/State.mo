import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import RBTree "mo:base/RBTree";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";

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
        public type NewId = { #newId; #reuse:CanisterInfo; #outOfCapacity:Int };
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
                             let new_info = { timestamp = now; id = info.id };
                             tree.put(new_info, ());
                             #reuse(new_info)
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
        public func refresh(info: CanisterInfo) : CanisterInfo {
            tree.delete(info);
            let new_info = { timestamp = Time.now(); id = info.id };
            tree.put(new_info, ());
            new_info
        };
        public func retire(info: CanisterInfo) {
            tree.delete(info);
            tree.put({ timestamp = 0; id = info.id }, ());
        };
        public func gcList() : Buffer.Buffer<Principal> {
            let now = Time.now();
            let result = Buffer.Buffer<Principal>(len);
            for ((info, _) in tree.entries()) {
                if (info.timestamp > 0) {
                    // assumes when timestamp == 0, uninstall_code is already done
                    if (info.timestamp > now - TTL) { return result };
                    result.add(info.id);
                    retire(info);
                }
            };
            result
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
