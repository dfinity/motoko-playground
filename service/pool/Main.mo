import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Error "mo:base/Error";
import Option "mo:base/Option";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Types "./Types";
import ICType "./IC";
import PoW "./PoW";
import Logs "./Logs";
import Metrics "./Metrics";
import MetricType "./MetricType";
import Wasm "canister:wasm-utils";

shared(creator) actor class Self(opt_params : ?Types.InitParams) = this {
    let IC : ICType.Self = actor "aaaaa-aa";
    let params = Option.get(opt_params, Types.defaultParams);
    var pool = Types.CanisterPool(params.max_num_canisters, params.canister_time_to_live, params.max_num_children);
    let nonceCache = PoW.NonceCache(params.nonce_time_to_live);

    stable let controller = creator.caller;
    stable var stats = Logs.defaultStats;
    stable var stablePool : ([Types.CanisterInfo], [(Principal, [Principal])]) = ([], []);
    stable var previousParam : ?Types.InitParams = null;

    system func preupgrade() {
        stablePool := pool.share();
        previousParam := ?params;
    };

    system func postupgrade() {
        ignore do ? {
            if (previousParam!.max_num_canisters > params.max_num_canisters) {
                //throw Error.reject("Cannot reduce canisterPool for upgrade");
                assert false;
            }
        };
        pool.unshare stablePool;
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
        ignore Cycles.accept amount;
    };

    private func getExpiredCanisterInfo() : async Types.CanisterInfo {
        switch (pool.getExpiredCanisterId()) {
            case (#newId) {
                Cycles.add(params.cycles_per_canister);
                let cid = await IC.create_canister { settings = null };
                let now = Time.now();
                let info = { id = cid.canister_id; timestamp = now; profiling = ?false };
                pool.add info;
                stats := Logs.updateStats(stats, #getId(params.cycles_per_canister));
                info
            };
            case (#reuse(info)) {
                let cid = { canister_id = info.id };
                let status = await IC.canister_status cid;
                let top_up_cycles : Nat =
                    if (status.cycles < params.cycles_per_canister) {
                        params.cycles_per_canister - status.cycles;
                    } else { 0 };
                if (top_up_cycles > 0) {
                    Cycles.add top_up_cycles;
                    await IC.deposit_cycles cid;
                };
                await IC.uninstall_code cid;
                switch (status.status) {
                    case (#stopped or #stopping) {
                        await IC.start_canister cid;
                    };
                    case _ { };
                }
                stats := Logs.updateStats(stats, #getId top_up_cycles);
                info
            };
            case (#outOfCapacity(time)) {
                let second = time / 1_000_000_000;
                stats := Logs.updateStats(stats, #outOfCapacity second);
                throw Error.reject("No available canister id, wait for " # debug_show(second) # " seconds.");
            };
        };
    };

    public shared({caller}) func getCanisterId(nonce: PoW.Nonce) : async Types.CanisterInfo {
        if (caller != controller and not nonceCache.checkProofOfWork(nonce)) {
            stats := Logs.updateStats(stats, #mismatch);
            throw Error.reject "Proof of work check failed";
        };
        nonceCache.pruneExpired();
        if (nonceCache.contains nonce) {
            stats := Logs.updateStats(stats, #mismatch);
            throw Error.reject "Nonce already used";
        };
        nonceCache.add nonce;
        await getExpiredCanisterInfo()
    };

    public func installCode(info: Types.CanisterInfo, args: Types.InstallArgs, profiling: Bool) : async Types.CanisterInfo {
        if (info.timestamp == 0) {
            stats := Logs.updateStats(stats, #mismatch);
            throw Error.reject "Cannot install removed canister";
        };
        if (not pool.find info) {
            stats := Logs.updateStats(stats, #mismatch);
            throw Error.reject "Cannot find canister";
        } else {
            let config = {
                profiling;
                remove_cycles_add = true;
                limit_stable_memory_page = ?(16384 : Nat32); // Limit to 1G of stable memory
                backend_canister_id = ?Principal.fromActor(this);
            };
            let wasm = await Wasm.transform(args.wasm_module, config);
            let new_args = { arg = args.arg; wasm_module = wasm; mode = args.mode; canister_id = args.canister_id };
            await IC.install_code new_args;
            stats := Logs.updateStats(stats, #install);
            switch(pool.refresh(info, profiling)) {
                case (?newInfo) newInfo;
                case null { throw Error.reject "Cannot find canister" };
            }
        };
    };

    public func removeCode(info: Types.CanisterInfo) : async () {
        if (pool.find info) {
            await IC.uninstall_code { canister_id = info.id };
            ignore pool.retire info;
        } else {
            stats := Logs.updateStats(stats, #mismatch);
        }
    };

    public func GCCanisters() {
        for (id in pool.gcList().vals()) {
            await IC.uninstall_code { canister_id = id };
        };
    };

    public query({caller}) func dump() : async [Types.CanisterInfo] {
        if (caller != controller) {
            throw Error.reject "Only called by controller";
        };
        pool.share().0
    };

    public shared({caller}) func resetStats() : async () {
        if (caller != controller) {
            throw Error.reject "Only called by controller"; 
        };
        stats := Logs.defaultStats;
    };

    // Metrics
    public query func http_request(req: Metrics.HttpRequest): async Metrics.HttpResponse {
        if (req.url == "/metrics") {
            let body = Metrics.metrics stats;
            {
                status_code = 200;
                headers = [("Content-Type", "text/plain; version=0.0.4"), ("Content-Length", Nat.toText(body.size()))];
                body = body;
            }
        } else {
            {
                status_code = 404;
                headers = [];
                body = Text.encodeUtf8 "Not supported";
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

    /*
    * The following methods are wrappers/immitations of the management canister's methods that require controller permissions.
    * In general, the backend is the sole controller of all playground pool canisters.
    */
    private func sanitizeInputs(caller: Principal, callee: Principal, methodName: Text) : async Types.CanisterInfo {
        if (not pool.findId caller) {
            throw Error.reject("Only a canister managed by the Motoko Playground can call " # methodName);
        };
        switch (pool.getInfo callee) {
            case null {
                throw Error.reject("Can only call " # methodName # " on canisters in the Motoko Playground");
            };
            case (?info) {
                if (not pool.isParentOf(caller, callee)) {
                    throw Error.reject("Can only call " # methodName # " on canisters spawned by your own code");
                } else {
                    info
                }
            }
        }
    };

    public shared({caller}) func create_canister({ settings: ?ICType.canister_settings }) : async { canister_id: ICType.canister_id } {
        if (not pool.findId caller) {
            throw Error.reject "Only a canister managed by the Motoko Playground can call create_canister";
        };
        let info = await getExpiredCanisterInfo();
        let result = pool.setChild(caller, info.id);
        if (not result) {
            throw Error.reject("Actor classes can only spawn up to " # Nat.toText(params.max_num_children) # " children");
        };
        { canister_id = info.id }
    };

    public shared({caller}) func update_settings({ canister_id: ICType.canister_id; settings: ICType.canister_settings }) : async () {
        throw Error.reject "Cannot call update_settings from within Motoko Playground";
    };

    public shared({caller}) func install_code({ arg: Blob; wasm_module: ICType.wasm_module; mode: { #reinstall; #upgrade; #install }; canister_id: ICType.canister_id }) : async () {
        let info = await sanitizeInputs(caller, canister_id, "install_code");
        let args = { arg; wasm_module; mode; canister_id; };
        let profiling = pool.getProfiling canister_id;
        ignore await installCode(info, args, profiling);
    };

    public shared({caller}) func uninstall_code({ canister_id: ICType.canister_id }) : async () {
        ignore await sanitizeInputs(caller, canister_id, "uninstall_code");
        await IC.uninstall_code { canister_id };
    };
    
    public shared({caller}) func canister_status({ canister_id: ICType.canister_id }) : async { status: { #stopped; #stopping; #running }; memory_size: Nat; cycles: Nat; settings: ICType.definite_canister_settings; module_hash: ?Blob; } {
        ignore await sanitizeInputs(caller, canister_id, "canister_status");
        await IC.canister_status { canister_id };
    };

    public shared({caller}) func stop_canister({ canister_id: ICType.canister_id }) : async () {
        ignore await sanitizeInputs(caller, canister_id, "stop_canister");
        await IC.stop_canister { canister_id };
    };

    public shared({caller}) func start_canister({ canister_id: ICType.canister_id }) : async () {
        ignore await sanitizeInputs(caller, canister_id, "start_canister");
        await IC.start_canister { canister_id };
    };

    public shared({caller}) func delete_canister({ canister_id: ICType.canister_id }) : async () {
        let info = await sanitizeInputs(caller, canister_id, "delete_canister");
        await removeCode(info);
    };

    system func inspect({ msg : {
        #GCCanisters : Any;
        #balance : Any;
        #dump : Any;
        #getCanisterId : Any;
        #getDeployCanisters : Any;
        #getInitParams : Any;
        #getStats : Any;
        #http_request : Any;
        #installCode : Any;
        #removeCode : Any;
        #resetStats : Any;
        #track : Any;
        #wallet_receive : Any;


        #create_canister : Any;
        #update_settings : Any;
        #install_code : Any;
        #uninstall_code : Any;
        #canister_status : Any;
        #start_canister : Any;
        #stop_canister : Any;
        #delete_canister : Any;
        }}) : Bool {
            switch msg {
                case (#create_canister _) false;
                case (#update_settings _) false;
                case (#install_code _) false;
                case (#uninstall_code _) false;
                case (#canister_status _) false;
                case (#start_canister _) false;
                case (#stop_canister _) false;
                case (#delete_canister _) false;

                case _ true;
            }
    };

}
