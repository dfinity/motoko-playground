import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Error "mo:base/Error";
import Heap "mo:base/Heap";
import State "./State";
import ICType "./IC";

actor {
    var state = State.empty();
    stable var totalCanisters = 0;
    let IC : ICType.Self = actor "aaaaa-aa";
    let MIN_CYCLE = 105_000_000_000;
    let MAX_NUM_CANISTERS = 2;
    let TTL = 5_000_000_000;
    
    public query(msg) func loadProject() : async ?State.ProjectInfo {
        state.project.get(msg.caller)
    };
    public shared(msg) func saveProject(info : State.ProjectInfo) : async () {
        state.project.put(msg.caller, info);
    };
    public func getCanisterId() : async Principal {
        if (totalCanisters < MAX_NUM_CANISTERS) {
            Cycles.add(MIN_CYCLE);
            let cid = await IC.create_canister({ settings = null });
            let info = { id = cid.canister_id; timestamp = Time.now() };
            totalCanisters += 1;            
            state.canisterPool.put(info);
            cid.canister_id
        } else {
            let opt_cid = do ? {
                let info = state.canisterPool.peekMin()!;
                if (Time.now() - info.timestamp >= TTL) {
                    state.canisterPool.deleteMin();
                    info.id
                } else {
                    null!
                }
            };
            switch opt_cid {
            case (?cid) cid;
            case null throw Error.reject("No available canister id");
            };
        };
    };
    
    public query func dump() : async Heap.Tree<State.CanisterInfo> {
        //Iter.toArray(state.project.entries());
        state.canisterPool.share()
    };
}
