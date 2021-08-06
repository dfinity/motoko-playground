import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Error "mo:base/Error";
import Option "mo:base/Option";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Types "./Types";
import ICType "./IC";
import PoW "./PoW";
import Logs "./Logs";
import Metrics "./Metrics";
import MetricType "./MetricType";
import Wasm "canister:wasm-utils";

shared(creator) actor class Self(opt_params : ?Types.InitParams) {
    let IC : ICType.Self = actor "aaaaa-aa";
    let params = Option.get(opt_params, Types.defaultParams);
    var pool = Types.CanisterPool(params.max_num_canisters, params.canister_time_to_live);
    let nonceCache = PoW.NonceCache(params.nonce_time_to_live);

    stable let controller = creator.caller;
    stable var stats = Logs.defaultStats;
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
    public query func getInitParams() : async Types.InitParams {
        params
    };
    public query func getStats() : async Logs.Stats {
        stats
    };
    public query func balance() : async Nat {
        Cycles.balance()
    };
    public func wallet_receive() : async () {
        let amount = Cycles.available();
        ignore Cycles.accept(amount);
    };
    public shared({caller}) func getCanisterId(nonce: PoW.Nonce) : async Types.CanisterInfo {
        let now = Time.now();
        if (caller != controller and not nonceCache.checkProofOfWork(nonce)) {
            stats := Logs.updateStats(stats, #mismatch);
            throw Error.reject("Proof of work check failed");
        };
        nonceCache.pruneExpired();
        if (nonceCache.contains(nonce)) {
            stats := Logs.updateStats(stats, #mismatch);
            throw Error.reject("Nonce already used");
        };
        
        switch (pool.getExpiredCanisterId()) {
        case (#newId) {
                 Cycles.add(params.cycles_per_canister);
                 let cid = await IC.create_canister({ settings = null });
                 let info = { id = cid.canister_id; timestamp = now };
                 pool.add(info);
                 nonceCache.add(nonce);
                 stats := Logs.updateStats(stats, #getId(params.cycles_per_canister));
                 info
             };
        case (#reuse(info)) {
                 let cid = { canister_id = info.id };
                 let status = await IC.canister_status(cid);
                 let top_up_cycles : Nat = if (status.cycles < params.cycles_per_canister) {
                     params.cycles_per_canister - status.cycles;
                 } else { 0 };
                 if (top_up_cycles > 0) {
                     Cycles.add(top_up_cycles);
                     await IC.deposit_cycles(cid);
                 };
                 await IC.uninstall_code(cid);
                 nonceCache.add(nonce);
                 stats := Logs.updateStats(stats, #getId(top_up_cycles));
                 info
             };
        case (#outOfCapacity(time)) {
                 let second = time / 1_000_000_000;
                 stats := Logs.updateStats(stats, #outOfCapacity(second));
                 throw Error.reject("No available canister id, wait for " # debug_show(second) # " seconds.");
             };
        };
    };
    public func installCode(info: Types.CanisterInfo, args: Types.InstallArgs) : async Types.CanisterInfo {
        if (info.timestamp == 0) {
            stats := Logs.updateStats(stats, #mismatch);
            throw Error.reject("Cannot install removed canister");
        };
        switch (pool.refresh(info)) {
        case null {
                 stats := Logs.updateStats(stats, #mismatch);
                 throw Error.reject("Cannot find canister");
             };
        case (?new_info) {
                 let wasm = await Wasm.transform(args.wasm_module);
                 let new_args = { arg = args.arg; wasm_module = wasm; mode = args.mode; canister_id = args.canister_id };
                 await IC.install_code(new_args);
                 stats := Logs.updateStats(stats, #install);
                 new_info
          };
        }
    };
    public func removeCode(info: Types.CanisterInfo) : async () {
        if (pool.retire(info)) {
            await IC.uninstall_code({canister_id=info.id});
        } else {
            stats := Logs.updateStats(stats, #mismatch);
        }
    };
    /*public func GCCanisters() {
        let list = pool.gcList();
        for (id in list.vals()) {
            await IC.uninstall_code({canister_id=id});
        };
    };*/
    public query({caller}) func dump() : async [Types.CanisterInfo] {
        if (caller != controller) {
            throw Error.reject("Only called by controller");
        };
        pool.share()
    };
    public shared({caller}) func resetStats() : async () {
        if (caller != controller) {
            throw Error.reject("Only called by controller");          
        };
        stats := Logs.defaultStats;
    };
    // Metrics
    public query func http_request(req: Metrics.HttpRequest): async Metrics.HttpResponse {
        if (req.url == "/metrics") {
            let body = Metrics.metrics(stats);
            {
                status_code = 200;
                headers = [("Content-Type", "text/plain; version=0.0.4"), ("Content-Length", Nat.toText(body.size()))];
                body = body;
            }
        } else {
            {
                status_code = 404;
                headers = [];
                body = Text.encodeUtf8("Not supported");
            }
        }
    };
    public query func getDeployCanisters() : async Nat {
        stats.num_of_canisters
    };
    public func track() : async MetricType.MetricsResponse {
        let Metrics = actor "bsusq-diaaa-aaaah-qac5q-cai" : MetricType.MetricsService;
        let response = await Metrics.track(
          { attributeId = null;
            action = #Set(
              { name = "deployed canisters";
                description = ?"deployed canisters from playground";
                getter = getDeployCanisters;
                polling_frequency = ?{ n = 30; period = #Minute };
              });
          });
        response
    };
}
