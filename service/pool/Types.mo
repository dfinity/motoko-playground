import Principal "mo:base/Principal";
import Splay "mo:splay";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";
import TrieSet "mo:base/TrieSet";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
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
        profiling: ?Bool;
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
        var metadata = TrieMap.TrieMap<Principal, (Int, Bool)>(Principal.equal, Principal.hash);
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
                            let new_info = { timestamp = now; id = info.id; profiling = info.profiling };
                            tree.insert(new_info);
                            metadata.put(new_info.id, (new_info.timestamp, unwrapProfiling(new_info)));
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
            metadata.put(info.id, (info.timestamp, false));
        };
        public func find(info: CanisterInfo) : Bool = tree.find(info);
        public func getMetadata(canister_id: Principal) : ?(Int, Bool) = metadata.get(canister_id);
        public func getInfo(canister_id: Principal) : ?CanisterInfo {
            do ? {
                let (timestamp, profiling) = getMetadata(canister_id)!;
                { timestamp; id = canister_id; profiling = ?profiling}
            }
        };
        public func getProfiling(canister_id: Principal) : Bool {
            switch (metadata.get(canister_id)) {
                case null false;
                case (?(_, profiling)) profiling;
            }
        };
        private func unwrapProfiling(info: CanisterInfo) : Bool {
            switch (info.profiling) {
                case null false;
                case (?profiling) profiling;
            }
        };
        public func refresh(info: CanisterInfo, profiling: Bool) : ?CanisterInfo {
            if (not tree.find(info)) { return null };
            tree.remove(info);
            let new_info = { timestamp = Time.now(); id = info.id; profiling = ?profiling };
            tree.insert(new_info);
            metadata.put(new_info.id, (new_info.timestamp, unwrapProfiling(new_info)));
            ?new_info
        };
        public func retire(info: CanisterInfo) : Bool {
            if (not tree.find(info)) { return false; };
            tree.remove(info);
            tree.insert({ timestamp = 0; id = info.id; profiling = ?false; });
            metadata.put(info.id, (0, false));
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
            Iter.iterate<CanisterInfo>(
                list.vals(),
                func(info, _) = metadata.put(info.id, (info.timestamp, unwrapProfiling(info))));
        };
    };

    public class FamilyTree() {
        // Bimap to represent parent-children tree with back pointers
        // Parent is null iff root
        var childrens = TrieMap.TrieMap<Principal, TrieSet.Set<Principal>>(Principal.equal, Principal.hash);
        var parents = TrieMap.TrieMap<Principal, Principal>(Principal.equal, Principal.hash);

        public func addChild(parent: Principal, child: Principal) : Bool {
            switch (parents.get(child)) {
                case (?_) {
                    // child should have at most one parent at a time
                    return false;
                };
                case null {
                    parents.put(child, parent);
                };
            };
            let children =
                switch (childrens.get(parent)) {
                    case null TrieSet.empty();
                    case (?children) children;
                };
            let newChildren = TrieSet.put<Principal>(children, child, Principal.hash(child), Principal.equal);
            childrens.put(parent, newChildren);
            return true;
        };

        public func isParentOf(parent: Principal, child: Principal) : Bool {
            switch(parents.get(child)) {
                case null {
                    false
                };
                case (?registerdParent) {
                    Principal.equal(registerdParent, parent)
                };
            };
        };

        public func getChildren(parent: Principal) : [Principal] {
            switch (childrens.get(parent)) {
                case null [];
                case (?children) TrieSet.toArray(children);
            }
        };

        public func delete(canister_id: Principal) {
            // Remove children edges
            ignore do ? {
                let children = TrieSet.toArray(childrens.get(canister_id)!);
                for (child in children.vals()) {
                    delete(child);
                }
            };
            childrens.delete(canister_id);

            // Remove parent edges
            ignore do ? {
                let parent = parents.get(canister_id)!;
                childrens.put(parent, TrieSet.delete<Principal>(childrens.get(parent)!, canister_id, Principal.hash(canister_id), Principal.equal));
            };
            parents.delete(canister_id);
        };

        public func share() : [(Principal, [Principal])] {
            Iter.toArray(
                Iter.map<(Principal, TrieSet.Set<Principal>), (Principal, [Principal])>(
                    childrens.entries(),
                    func((parent, children)) = (parent, TrieSet.toArray(children))
                )
            )
        };

        public func unshare(stableChildrens : [(Principal, [Principal])]) {
            childrens := 
                TrieMap.fromEntries(
                    Array.map<(Principal, [Principal]), (Principal, TrieSet.Set<Principal>)>(
                        stableChildrens,
                        func((parent, children)) = (parent, TrieSet.fromArray(children, Principal.hash, Principal.equal))
                    ).vals(), 
                    Principal.equal,
                    Principal.hash
                );
            
            let parentsEntries = 
                Array.flatten(
                    Array.map<(Principal, [Principal]), [(Principal, Principal)]>(
                        stableChildrens, 
                        func((parent, children)) = 
                            Array.map<Principal, (Principal, Principal)>(
                                children,
                                func(child) = (child, parent)
                            )
                    )
                );
            parents := TrieMap.fromEntries(parentsEntries.vals(), Principal.equal, Principal.hash);
        }
    }
}
