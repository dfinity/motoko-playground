import Principal "mo:base/Principal";

actor {
    public func getCanisterId() : async Principal {
        Principal.fromText("aaaaa-aa")
    }
}
