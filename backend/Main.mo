import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Error "mo:base/Error";
import Heap "mo:base/Heap";
import Option "mo:base/Option";
import State "./State";
import ICType "./IC";

actor {
    var state = State.empty();
    var totalCanisters = 0;
    let IC : ICType.Self = actor "aaaaa-aa";
    let MIN_CYCLE = 105_000_000_000;
    let MAX_NUM_CANISTERS = 2;
    let TTL = 5_000_000_000;
    
    public query({caller}) func loadProject() : async ?State.ProjectInfo {
        state.project.get(caller)
    };
    public shared({caller}) func saveProject(info : State.ProjectInfo) : async () {
        state.project.put(caller, info);
    };
    
    // TODO: only playground frontend can call these functions
    public func getCanisterId() : async Principal {
        if (totalCanisters < MAX_NUM_CANISTERS) {
            Cycles.add(MIN_CYCLE);
            let cid = await IC.create_canister({ settings = null });
            let info = { id = cid.canister_id; timestamp = Time.now() };
            totalCanisters += 1;            
            state.canisterPool.put(info);
            cid.canister_id
        } else {
            let info = Option.unwrap(state.canisterPool.peekMin());
            let now = Time.now();
            if (now - info.timestamp >= TTL) {
                state.canisterPool.deleteMin();
                state.canisterPool.put({ id = info.id; timestamp = now });
                let cid = { canister_id = info.id };
                let status = await IC.canister_status(cid);
                let top_up_cycles : Nat = MIN_CYCLE - status.cycles;
                Cycles.add(top_up_cycles);
                await IC.uninstall_code(cid);
                info.id
            } else {
                let left = TTL - (now - info.timestamp);
                throw Error.reject("No available canister id, wait for " # debug_show(left) # " seconds.");
            };
        };
    };
    public func installCode(args: State.InstallArgs) : async () {
        // TODO update TTL
        await IC.install_code(args);
    };
    
    public query func dump() : async Heap.Tree<State.CanisterInfo> {
        //Iter.toArray(state.project.entries());
        state.canisterPool.share()
    };
}
