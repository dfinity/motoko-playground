// This is a generated Motoko binding.
module {
  public type canister_id = Principal;
  public type snapshot_id = Blob;
  public type canister_settings = {
    controllers : ?[Principal];
    freezing_threshold : ?Nat;
    memory_allocation : ?Nat;
    compute_allocation : ?Nat;
  };
  public type definite_canister_settings = {
    controllers : [Principal];
    freezing_threshold : Nat;
    memory_allocation : Nat;
    compute_allocation : Nat;
  };
  public type snapshot = {
      id : snapshot_id;
      total_size : Nat64;
      taken_at_timestamp : Nat64;
  };
  public type user_id = Principal;
  public type wasm_module = Blob;
  public type Self = actor {
    canister_status : shared { canister_id : canister_id } -> async {
        status : { #stopped; #stopping; #running };
        memory_size : Nat;
        cycles : Nat;
        settings : definite_canister_settings;
        module_hash : ?Blob;
      };
    create_canister : shared { settings : ?canister_settings } -> async {
        canister_id : canister_id;
      };
    delete_canister : shared { canister_id : canister_id } -> async ();
    deposit_cycles : shared { canister_id : canister_id } -> async ();
    install_code : shared {
        arg : Blob;
        wasm_module : wasm_module;
        mode : { #reinstall; #upgrade; #install };
        canister_id : canister_id;
    } -> async ();
    list_canister_snapshots : shared { canister_id : canister_id } -> async [snapshot];
    take_canister_snapshot : shared { replace_snapshot : ?snapshot_id; canister_id : canister_id } -> async snapshot;
    load_canister_snapshot : shared { canister_id : canister_id; snapshot_id : snapshot_id } -> async ();
    delete_canister_snapshot : shared { canister_id : canister_id; snapshot_id : snapshot_id } -> async ();
    provisional_create_canister_with_cycles : shared {
        settings : ?canister_settings;
        amount : ?Nat;
      } -> async { canister_id : canister_id };
    provisional_top_up_canister : shared {
        canister_id : canister_id;
        amount : Nat;
      } -> async ();
    raw_rand : shared () -> async Blob;
    start_canister : shared { canister_id : canister_id } -> async ();
    stop_canister : shared { canister_id : canister_id } -> async ();
    uninstall_code : shared { canister_id : canister_id } -> async ();
    update_settings : shared {
        canister_id : Principal;
        settings : canister_settings;
      } -> async ();
  };
}
