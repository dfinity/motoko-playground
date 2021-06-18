import Iter "mo:base/Iter";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Error "mo:base/Error";
import RBTree "mo:base/RBTree";
import Option "mo:base/Option";
import Types "./Types";
import ICType "./IC";

actor class Self(opt_params : ?Types.InitParams) {
    let IC : ICType.Self = actor "aaaaa-aa";
    let params = Option.get(opt_params, Types.defaultParams);

    var pool = Types.CanisterPool(params.max_num_canisters, params.TTL);
    
    // TODO: only playground frontend can call these functions
    public func getCanisterId() : async Types.CanisterInfo {
        switch (pool.getExpiredCanisterId()) {
        case (#newId) {
                 Cycles.add(params.cycles_per_canister);
                 let cid = await IC.create_canister({ settings = null });
                 let info = { id = cid.canister_id; timestamp = Time.now() };
                 pool.add(info);
                 info
             };
        case (#reuse(info)) {
                 let cid = { canister_id = info.id };
                 let status = await IC.canister_status(cid);
                 let top_up_cycles : Nat = params.cycles_per_canister - status.cycles;
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
    public func installCode(info: Types.CanisterInfo, args: Types.InstallArgs) : async Types.CanisterInfo {
        let new_info = pool.refresh(info);
        await IC.install_code(args);
        new_info
    };
    public func removeCode(info: Types.CanisterInfo) : async () {
        pool.retire(info);
        await IC.uninstall_code({canister_id=info.id});
    };
    public func GCCanisters() {
        let list = pool.gcList();
        for (id in list.vals()) {
            await IC.uninstall_code({canister_id=id});
        };
    };
    
    public query func dump() : async RBTree.Tree<Types.CanisterInfo, ()> {
        //Iter.toArray(state.project.entries());
        pool.share()
    };
}
