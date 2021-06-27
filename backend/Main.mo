import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Error "mo:base/Error";
import Option "mo:base/Option";
import Types "./Types";
import ICType "./IC";
import PoW "./PoW";

shared(creator) actor class Self(opt_params : ?Types.InitParams) {
    let IC : ICType.Self = actor "aaaaa-aa";
    let params = Option.get(opt_params, Types.defaultParams);
    var pool = Types.CanisterPool(params.max_num_canisters, params.canister_time_to_live);
    let nonceCache = PoW.NonceCache(params.nonce_time_to_live);

    stable let controller = creator.caller;
    stable var stablePool : [Types.CanisterInfo] = [];
    stable var previousParam : ?Types.InitParams = null;
    system func preupgrade() {
        stablePool := pool.share();
        previousParam := ?params;
    };
    system func postupgrade() {
        switch previousParam {
        case (?old) {
                 if (old.max_num_canisters > params.max_num_canisters) {
                     //throw Error.reject("Cannot reduce canisterPool for upgrade");
                     assert false;
                 };
             };
        case null {};
        };
        pool.unshare(stablePool);
    };
    
    // TODO: only playground frontend can call these functions
    public shared({caller}) func getCanisterId(nonce: PoW.Nonce) : async Types.CanisterInfo {
        let now = Time.now();
        if (caller != controller and not nonceCache.checkProofOfWork(nonce)) {
            throw Error.reject("Proof of work check failed");
        };
        nonceCache.pruneExpired();        
        if (nonceCache.contains(nonce)) {
            throw Error.reject("Nonce already used");
        };
        
        switch (pool.getExpiredCanisterId()) {
        case (#newId) {
                 Cycles.add(params.cycles_per_canister);
                 let cid = await IC.create_canister({ settings = null });
                 let info = { id = cid.canister_id; timestamp = now };
                 pool.add(info);
                 nonceCache.add(nonce);
                 info
             };
        case (#reuse(info)) {
                 let cid = { canister_id = info.id };
                 let status = await IC.canister_status(cid);
                 if (status.cycles < params.cycles_per_canister) {
                     let top_up_cycles : Nat = params.cycles_per_canister - status.cycles;
                     Cycles.add(top_up_cycles);
                 };
                 await IC.uninstall_code(cid);
                 nonceCache.add(nonce);
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
    public query({caller}) func dump() : async [Types.CanisterInfo] {
        if (caller != controller) {
            throw Error.reject("Only called by controller");            
        };
        pool.share()
    };
}
