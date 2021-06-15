import Iter "mo:base/Iter";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Error "mo:base/Error";
import RBTree "mo:base/RBTree";
import State "./State";
import ICType "./IC";

actor {
    let IC : ICType.Self = actor "aaaaa-aa";
    let MIN_CYCLE = 105_000_000_000;
    let MAX_NUM_CANISTERS = 2;
    let TTL = 5_000_000_000;

    var state = State.empty();
    var pool = State.CanisterPool(MAX_NUM_CANISTERS, TTL);
    
    public query({caller}) func loadProject() : async ?State.ProjectInfo {
        state.project.get(caller)
    };
    public shared({caller}) func saveProject(info : State.ProjectInfo) : async () {
        state.project.put(caller, info);
    };
    
    // TODO: only playground frontend can call these functions
    public func getCanisterId() : async State.CanisterInfo {
        switch (pool.getExpiredCanisterId()) {
        case (#newId) {
                 Cycles.add(MIN_CYCLE);
                 let cid = await IC.create_canister({ settings = null });
                 let info = { id = cid.canister_id; timestamp = Time.now() };
                 pool.add(info);
                 info
             };
        case (#reuse(info)) {
                 let cid = { canister_id = info.id };
                 let status = await IC.canister_status(cid);
                 let top_up_cycles : Nat = MIN_CYCLE - status.cycles;
                 Cycles.add(top_up_cycles);
                 await IC.uninstall_code(cid);
                 info
             };
        case (#outOfCapacity(time)) {
                 let second = time / 1_000_000_000;
                 throw Error.reject("No available canister id, wait for " # debug_show(second) # " seconds.");
             };
        };
    };
    public func installCode(info: State.CanisterInfo, args: State.InstallArgs) : async State.CanisterInfo {
        let new_info = pool.refresh(info);
        await IC.install_code(args);
        new_info
    };
    public func removeCode(info: State.CanisterInfo) : async () {
        pool.retire(info);
        await IC.uninstall_code({canister_id=info.id});
    };
    public func GCCanisters() {
        let list = pool.gcList();
        for (id in list.vals()) {
            await IC.uninstall_code({canister_id=id});
        };
    };
    
    public query func dump() : async RBTree.Tree<State.CanisterInfo, ()> {
        //Iter.toArray(state.project.entries());
        pool.share()
    };
}
