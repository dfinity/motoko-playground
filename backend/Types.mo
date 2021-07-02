import Principal "mo:base/Principal";
import Splay "mo:splay";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";

module {
    public type InitParams = {
        cycles_per_canister: Nat;
        max_num_canisters: Nat;
        canister_time_to_live: Nat;
        nonce_time_to_live: Nat;
    };
    public let defaultParams : InitParams = {
        cycles_per_canister = 550_000_000_000;
        max_num_canisters = 5;
        canister_time_to_live = 600_000_000_000;
        nonce_time_to_live = 300_000_000_000;
    };
    public type Stats = {
        num_of_canisters: Nat;
        cycles_used: Nat;
    };
    public let defaultStats : Stats = {
        num_of_canisters = 0;
        cycles_used = 0;
    };
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
        else if (x.timestamp == y.timestamp and x.id == y.id) { #equal }
        else { #greater }
    };
    public class CanisterPool(size: Nat, TTL: Nat) {
        var len = 0;
        var tree = Splay.Splay<CanisterInfo>(canisterInfoCompare);
        public type NewId = { #newId; #reuse:CanisterInfo; #outOfCapacity:Int };
        public func getExpiredCanisterId() : NewId {
            if (len < size) {
                #newId
            } else {
                switch (tree.entries().next()) {
                case null #outOfCapacity(-1);
                case (?info) {
                         let now = Time.now();
                         let elapsed = now - info.timestamp;
                         if (elapsed >= TTL) {
                             tree.remove(info);
                             let new_info = { timestamp = now; id = info.id };
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
        public func refresh(info: CanisterInfo) : CanisterInfo {
            tree.remove(info);
            let new_info = { timestamp = Time.now(); id = info.id };
            tree.insert(new_info);
            new_info
        };
        public func retire(info: CanisterInfo) {
            tree.remove(info);
            tree.insert({ timestamp = 0; id = info.id });
        };
        public func gcList() : Buffer.Buffer<Principal> {
            let now = Time.now();
            let result = Buffer.Buffer<Principal>(len);
            for (info in tree.entries()) {
                if (info.timestamp > 0) {
                    // assumes when timestamp == 0, uninstall_code is already done
                    if (info.timestamp > now - TTL) { return result };
                    result.add(info.id);
                    retire(info);
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
