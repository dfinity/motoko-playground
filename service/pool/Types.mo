import Principal "mo:base/Principal";
import Splay "mo:splay";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";
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
        canister_time_to_live = 1200_000_000_000;
        nonce_time_to_live = 300_000_000_000;
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
    public class CanisterPool(size: Nat, ttl: Nat) {
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
                        if (elapsed >= ttl) {
                            tree.remove(info);
                            let new_info = { timestamp = now; id = info.id };
                            tree.insert(new_info);
                            #reuse(new_info)
                        } else {
                            #outOfCapacity(ttl - elapsed)
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
        public func find(info: CanisterInfo) : Bool = tree.find(info);
        public func refresh(info: CanisterInfo) : ?CanisterInfo {
            if (not tree.find(info)) { return null };
            tree.remove(info);
            let new_info = { timestamp = Time.now(); id = info.id };
            tree.insert(new_info);
            ?new_info
        };
        public func retire(info: CanisterInfo) : Bool {
            if (not tree.find(info)) { return false; };
            tree.remove(info);
            tree.insert({ timestamp = 0; id = info.id });
            return true;
        };
        public func gcList() : Buffer.Buffer<Principal> {
            let now = Time.now();
            let result = Buffer.Buffer<Principal>(len);
            for (info in tree.entries()) {
                if (info.timestamp > 0) {
                    // assumes when timestamp == 0, uninstall_code is already done
                    if (info.timestamp > now - ttl) { return result };
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

    public class MetadataMap() {
        var map = TrieMap.TrieMap<Principal, (Int, Bool)>(Principal.equal, Principal.hash);

        public func getTimestamp(canister_id: Principal) : ?Int {
            do ? {
                get(canister_id)!.0
            }
        };
        public func getProfiling(canister_id: Principal) : Bool {
            switch (get(canister_id)) {
                case (?(_, profiling)) {
                    profiling
                };
                case null {
                    false
                };
            };
        };
        public func get(canister_id: Principal) : ?(Int, Bool) = map.get(canister_id);
        public func getInfo(canister_id: Principal) : ?CanisterInfo {
            do ? {
                let timestamp = getTimestamp(canister_id)!;
                { id = canister_id; timestamp}
            };
        };
        public func putTimestamp(canister_id: Principal, timestamp: Int) {
            let profiling = switch(get(canister_id)) { case null false; case (?(_, profiling)) profiling };
            map.put(canister_id, (timestamp, profiling));
        };
        public func updateProfiling(canister_id: Principal, profiling: Bool) {
            ignore do ? {
                let timestamp = getTimestamp(canister_id)!;
                map.put(canister_id, (timestamp, profiling));
            }
        };
        public func put(canister_id: Principal, metadata: (Int, Bool)) = map.put(canister_id, metadata);
        public func refreshTimestamp(canister_id: Principal) = putTimestamp(canister_id, Time.now());
        public func retire(canister_id: Principal) = put(canister_id, (0, false));
    }
}
