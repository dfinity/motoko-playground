export const prog = `import P "mo:base/Principal";
import List "mo:base/List";
import T "./types";
shared {caller} actor class Example(init : Int) = Self {
  public type Id = { caller : Principal; creator : Principal; canister : Principal };
  stable let controller = caller;
  stable var history = List.nil<Int>();
  var counter = init;
  
  system func preupgrade(){
    history := List.push(counter, history);
  };

  public query func getHistory() : async T.List<Int> { history };
  public query(msg) func getId() : async Id {
    {canister = P.fromActor(Self); creator = controller; caller = msg.caller}
  };
  public func add() : async Int { counter += 1; counter };
};
`;
export const fac = `import Debug "mo:base/Debug";
func fac(n : Nat) : Nat {
  if (n == 0) return 1;
  return n * fac(n-1);
};
Debug.print(debug_show (fac(20)));
`;
export const matchers = `import Suite "mo:matchers/Suite";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";

func fac(n : Nat) : Nat {
  if (n == 0) return 1;
  return n * fac(n-1);
};

let suite = Suite.suite("factorial", [
  Suite.test("fac(0)", fac(0), M.equals(T.nat 1)),
  Suite.test("fac(10)", fac(10), M.equals(T.nat 3628800)),
]);
Suite.run(suite);
`;
export const type = `module {
  public type Counter = { topic: Text; value: Nat; };
  public type List<T> = ?(T, List<T>);
}
`;
export const pub = `import Array "mo:base/Array";
import T "./types";
actor Publisher {
    public type Subscriber = { topic: Text; callback: shared T.Counter -> (); };
    var subscribers: [Subscriber] = [];

    public func subscribe(subscriber: Subscriber) {
        subscribers := Array.append<Subscriber>(subscribers, [subscriber]);
    };

    public func publish(counter: T.Counter) {
        for (subscriber in subscribers.vals()) {
            if (subscriber.topic == counter.topic) {
                subscriber.callback(counter);
            };
        };
    };
};
`;
export const sub = `import Publisher "canister:pub";
import T "./types";
actor Subscriber {
    let counter_topic = "Apples";
    var count: Nat = 0;

    public func init() {
        Publisher.subscribe({ topic = counter_topic; callback = updateCount; });
    };
    public func updateCount(counter: T.Counter) {
        count += counter.value;
    };
    public query func getCount(): async Nat {
        count
    };
};
`;
