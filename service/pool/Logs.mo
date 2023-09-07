import Map "mo:base/RBTree";
import {compare} "mo:base/Text";
import {toArray} "mo:base/Iter";
import {now = timeNow} "mo:base/Time";
import {toText} "mo:base/Int";

module {
    public type SharedStatsByOrigin = (Map.Tree<Text,Nat>, Map.Tree<Text,Nat>);
    public class StatsByOrigin() {
        var canisters = Map.RBTree<Text, Nat>(compare);
        var installs = Map.RBTree<Text, Nat>(compare);
        public func share() : SharedStatsByOrigin = (canisters.share(), installs.share());
        public func unshare(x : SharedStatsByOrigin) {
            canisters.unshare(x.0);
            installs.unshare(x.1);
        };
        public func addCanister(origin: Text) {
            switch (canisters.get(origin)) {
            case null { canisters.put(origin, 1) };
            case (?n) { canisters.put(origin, n + 1) };
            }
        };
        public func addInstall(origin: Text, referrer: ?Text) {
            // TODO: keep track of `referrer`
            switch (installs.get(origin)) {
            case null { installs.put(origin, 1) };
            case (?n) { installs.put(origin, n + 1) };
            }
        };
        public func dump() : ([(Text, Nat)], [(Text, Nat)]) {
            (toArray<(Text, Nat)>(canisters.entries()),
             toArray<(Text, Nat)>(installs.entries()))
        };
        public func metrics() : Text {
            var result = "";
            let now = timeNow() / 1_000_000;
            for ((origin, count) in canisters.entries()) {
                let name = "canisters_" # origin;
                let desc = "Number of canisters deployed from " # origin;
                result := result # encode_single_value("counter", name, count, desc, now);
            };
            for ((origin, count) in installs.entries()) {
                let name = "installs_" # origin;
                let desc = "Number of Wasm installed from " # origin;
                result := result # encode_single_value("counter", name, count, desc, now);
            };
            result;
        };
    };
    public func encode_single_value(kind: Text, name: Text, number: Int, desc: Text, time: Int) : Text {
        "# HELP " # name # " " # desc # "\n" #
        "# TYPE " # name # " " # kind # "\n" #
        name # " " # toText(number) # " " # toText(time) # "\n"
    };

    public type Stats = {
        num_of_canisters: Nat;
        num_of_installs: Nat;
        cycles_used: Nat;
        error_out_of_capacity: Nat;
        error_total_wait_time: Nat;
        error_mismatch: Nat;
    };
    public let defaultStats : Stats = {
        num_of_canisters = 0;
        num_of_installs = 0;
        cycles_used = 0;
        error_out_of_capacity = 0;
        error_total_wait_time = 0;
        error_mismatch = 0;
    };
    public type EventType = {
        #getId : Nat;
        #outOfCapacity : Nat;
        #install;
        #mismatch;
    };
    public func updateStats(stats: Stats, event: EventType) : Stats {
        switch (event) {
        case (#getId(cycles)) { {
                 num_of_canisters = stats.num_of_canisters + 1;
                 cycles_used = stats.cycles_used + cycles;
                 num_of_installs = stats.num_of_installs;
                 error_out_of_capacity = stats.error_out_of_capacity;
                 error_total_wait_time = stats.error_total_wait_time;
                 error_mismatch = stats.error_mismatch;
                                } };
        case (#outOfCapacity(time)) { {
                 num_of_canisters = stats.num_of_canisters;
                 cycles_used = stats.cycles_used;
                 num_of_installs = stats.num_of_installs;
                 error_out_of_capacity = stats.error_out_of_capacity + 1;
                 error_total_wait_time = stats.error_total_wait_time + time;                 
                 error_mismatch = stats.error_mismatch;
                                  } };
        case (#install) { {
                 num_of_canisters = stats.num_of_canisters;
                 cycles_used = stats.cycles_used;
                 num_of_installs = stats.num_of_installs + 1;
                 error_out_of_capacity = stats.error_out_of_capacity;
                 error_total_wait_time = stats.error_total_wait_time;
                 error_mismatch = stats.error_mismatch;
                          } };
        case (#mismatch) { {
                 num_of_canisters = stats.num_of_canisters;
                 cycles_used = stats.cycles_used;
                 num_of_installs = stats.num_of_installs;
                 error_out_of_capacity = stats.error_out_of_capacity; 
                 error_total_wait_time = stats.error_total_wait_time;
                 error_mismatch = stats.error_mismatch + 1;
                           } };
        };
    };
}
