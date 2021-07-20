import Principal "mo:base/Principal";
import Splay "mo:splay";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Int "mo:base/Int";

module {
    public type InitParams = {
        cycles_per_canister: Nat;
        max_num_canisters: Nat;
        canister_time_to_live: Nat;
        nonce_time_to_live: Nat;
    };
    public let defaultParams : InitParams = {
        cycles_per_canister = 550_000_000_000;
        max_num_canisters = 100;
        canister_time_to_live = 600_000_000_000;
        nonce_time_to_live = 300_000_000_000;
    };
    public type InstallArgs = {
        arg : Blob;
        wasm_module : Blob;
        motoko_project: ?MotokoProject;
        mode : { #reinstall; #upgrade; #install };
        canister_id : Principal;
    };
    public type MotokoProject = {
      name : Text;
      files : [NamedFile];
    };
    public type NamedFile = {
      name : Text;
      file : File;
    };
    public type File = {
      #text : Text;
      #directory : [NamedFile];
    };
    public type CanisterInfo = {
        id: Principal;
        timestamp: Int;
        /// When motoko_project in InstallArgs is non-null, this id is non-null.
        /// The non-null id recovers the Motoko project with a query call.
        motoko_project_id: ?Nat;
    };
    func canisterInfoCompare(x: CanisterInfo, y: CanisterInfo): {#less;#equal;#greater} {
        if (x.timestamp < y.timestamp) { #less }
        else if (x.timestamp == y.timestamp and x.id < y.id) { #less }
        else if (x.timestamp == y.timestamp and x.id == y.id) { #equal }
        else { #greater }
    };
    public class CanisterPool(size: Nat, TTL: Nat) {
        var len = 0;
        var tree = Splay.Splay<CanisterInfo>(canisterInfoCompare);
        public type NewId = { #newId; #reuse:CanisterInfo; #outOfCapacity:Nat };
        public func getExpiredCanisterId() : NewId {
            if (len < size) {
                #newId
            } else {
                switch (tree.entries().next()) {
                case null { assert false; loop(); };
                case (?info) {
                         let now = Time.now();
                         let elapsed : Nat = Int.abs(now) - Int.abs(info.timestamp);
                         if (elapsed >= TTL) {
                             tree.remove(info);
                             let new_info = { timestamp = now; id = info.id ;
                                              motoko_project_id = null };
                             tree.insert(new_info);
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
            tree.insert(info);
        };
        public func refresh(info: CanisterInfo) : ?CanisterInfo {
            if (not tree.find(info)) { return null };
            tree.remove(info);
            let new_info = { timestamp = Time.now(); id = info.id ;
                             motoko_project_id = null };
            tree.insert(new_info);
            ?new_info
        };
        public func retire(info: CanisterInfo) : Bool {
            if (not tree.find(info)) { return false; };
            tree.remove(info);
            tree.insert({ timestamp = 0; id = info.id ;
                          motoko_project_id = null });
            return true;
        };
        public func gcList() : Buffer.Buffer<Principal> {
            let now = Time.now();
            let result = Buffer.Buffer<Principal>(len);
            for (info in tree.entries()) {
                if (info.timestamp > 0) {
                    // assumes when timestamp == 0, uninstall_code is already done
                    if (info.timestamp > now - TTL) { return result };
                    result.add(info.id);
                    ignore retire(info);
                }
            };
            result
        };
        public func share() : [CanisterInfo] {
            Iter.toArray(tree.entries())
        };
        public func unshare(list: [CanisterInfo]) {
            len := list.size();
            tree.fromArray(list);
        };
    };
}
