export const canisterSet = {
  "aaaaa-aa": {
    name: "ic",
    candid: `// from spec 0.18.5
type canister_id = principal;
type user_id = principal;
type wasm_module = blob;

type canister_settings = record {
  controllers : opt vec principal;
  compute_allocation : opt nat;
  memory_allocation : opt nat;
  freezing_threshold : opt nat;
};

type definite_canister_settings = record {
  controllers : vec principal;
  compute_allocation : nat;
  memory_allocation : nat;
  freezing_threshold : nat;
};

type ecdsa_curve = variant { secp256k1; };

type satoshi = nat64;

type bitcoin_network = variant {
  mainnet;
  testnet;
};

type bitcoin_address = text;

type block_hash = blob;

type outpoint = record {
  txid : blob;
  vout : nat32
};

type utxo = record {
  outpoint: outpoint;
  value: satoshi;
  height: nat32;
};

type get_utxos_request = record {
  address : bitcoin_address;
  network: bitcoin_network;
  filter: opt variant {
    min_confirmations: nat32;
    page: blob;
  };
};

type get_current_fee_percentiles_request = record {
  network: bitcoin_network;
};

type get_utxos_response = record {
  utxos: vec utxo;
  tip_block_hash: block_hash;
  tip_height: nat32;
  next_page: opt blob;
};

type get_balance_request = record {
  address : bitcoin_address;
  network: bitcoin_network;
  min_confirmations: opt nat32;
};

type send_transaction_request = record {
  transaction: blob;
  network: bitcoin_network;
};

type millisatoshi_per_byte = nat64;

service ic : {
  create_canister : (record {
    settings : opt canister_settings
  }) -> (record {canister_id : canister_id});
  update_settings : (record {
    canister_id : principal;
    settings : canister_settings
  }) -> ();
  install_code : (record {
    mode : variant {install; reinstall; upgrade};
    canister_id : canister_id;
    wasm_module : wasm_module;
    arg : blob;
  }) -> ();
  uninstall_code : (record {canister_id : canister_id}) -> ();
  start_canister : (record {canister_id : canister_id}) -> ();
  stop_canister : (record {canister_id : canister_id}) -> ();
  canister_status : (record {canister_id : canister_id}) -> (record {
      status : variant { running; stopping; stopped };
      settings: definite_canister_settings;
      module_hash: opt blob;
      memory_size: nat;
      cycles: nat;
      idle_cycles_burned_per_day: nat;
  });
  delete_canister : (record {canister_id : canister_id}) -> ();
  deposit_cycles : (record {canister_id : canister_id}) -> ();
  raw_rand : () -> (blob);

  // Threshold ECDSA signature
  ecdsa_public_key : (record {
    canister_id : opt canister_id;
    derivation_path : vec blob;
    key_id : record { curve: ecdsa_curve; name: text };
  }) -> (record { public_key : blob; chain_code : blob; });
  sign_with_ecdsa : (record {
    message_hash : blob;
    derivation_path : vec blob;
    key_id : record { curve: ecdsa_curve; name: text };
  }) -> (record { signature : blob });

  // bitcoin interface
  bitcoin_get_balance: (get_balance_request) -> (satoshi);
  bitcoin_get_utxos: (get_utxos_request) -> (get_utxos_response);
  bitcoin_send_transaction: (send_transaction_request) -> ();
  bitcoin_get_current_fee_percentiles: (get_current_fee_percentiles_request) -> (vec millisatoshi_per_byte);

  // provisional interfaces for the pre-ledger world
  provisional_create_canister_with_cycles : (record {
    amount: opt nat;
    settings : opt canister_settings
  }) -> (record {canister_id : canister_id});
  provisional_top_up_canister :
    (record { canister_id: canister_id; amount: nat }) -> ();
}`,
  },
  "rrkah-fqaaa-aaaaa-aaaaq-cai": {
    name: "governance",
    candid: `type AccountIdentifier = record { hash : vec nat8 };
type Action = variant {
  RegisterKnownNeuron : KnownNeuron;
  ManageNeuron : ManageNeuron;
  ExecuteNnsFunction : ExecuteNnsFunction;
  RewardNodeProvider : RewardNodeProvider;
  SetDefaultFollowees : SetDefaultFollowees;
  RewardNodeProviders : RewardNodeProviders;
  ManageNetworkEconomics : NetworkEconomics;
  ApproveGenesisKyc : ApproveGenesisKyc;
  AddOrRemoveNodeProvider : AddOrRemoveNodeProvider;
  Motion : Motion;
};
type AddHotKey = record { new_hot_key : opt principal };
type AddOrRemoveNodeProvider = record { change : opt Change };
type Amount = record { e8s : nat64 };
type ApproveGenesisKyc = record { principals : vec principal };
type Ballot = record { vote : int32; voting_power : nat64 };
type BallotInfo = record { vote : int32; proposal_id : opt NeuronId };
type By = variant {
  NeuronIdOrSubaccount : record {};
  MemoAndController : ClaimOrRefreshNeuronFromAccount;
  Memo : nat64;
};
type Change = variant { ToRemove : NodeProvider; ToAdd : NodeProvider };
type ClaimOrRefresh = record { by : opt By };
type ClaimOrRefreshNeuronFromAccount = record {
  controller : opt principal;
  memo : nat64;
};
type ClaimOrRefreshNeuronFromAccountResponse = record { result : opt Result_1 };
type ClaimOrRefreshResponse = record { refreshed_neuron_id : opt NeuronId };
type Command = variant {
  Spawn : Spawn;
  Split : Split;
  Follow : Follow;
  ClaimOrRefresh : ClaimOrRefresh;
  Configure : Configure;
  RegisterVote : RegisterVote;
  Merge : Merge;
  DisburseToNeuron : DisburseToNeuron;
  MakeProposal : Proposal;
  MergeMaturity : MergeMaturity;
  Disburse : Disburse;
};
type Command_1 = variant {
  Error : GovernanceError;
  Spawn : SpawnResponse;
  Split : SpawnResponse;
  Follow : record {};
  ClaimOrRefresh : ClaimOrRefreshResponse;
  Configure : record {};
  RegisterVote : record {};
  Merge : record {};
  DisburseToNeuron : SpawnResponse;
  MakeProposal : MakeProposalResponse;
  MergeMaturity : MergeMaturityResponse;
  Disburse : DisburseResponse;
};
type Command_2 = variant {
  Spawn : Spawn;
  Split : Split;
  Configure : Configure;
  Merge : Merge;
  DisburseToNeuron : DisburseToNeuron;
  ClaimOrRefreshNeuron : ClaimOrRefresh;
  MergeMaturity : MergeMaturity;
  Disburse : Disburse;
};
type Configure = record { operation : opt Operation };
type Disburse = record {
  to_account : opt AccountIdentifier;
  amount : opt Amount;
};
type DisburseResponse = record { transfer_block_height : nat64 };
type DisburseToNeuron = record {
  dissolve_delay_seconds : nat64;
  kyc_verified : bool;
  amount_e8s : nat64;
  new_controller : opt principal;
  nonce : nat64;
};
type DissolveState = variant {
  DissolveDelaySeconds : nat64;
  WhenDissolvedTimestampSeconds : nat64;
};
type ExecuteNnsFunction = record { nns_function : int32; payload : vec nat8 };
type Follow = record { topic : int32; followees : vec NeuronId };
type Followees = record { followees : vec NeuronId };
type Governance = record {
  default_followees : vec record { int32; Followees };
  most_recent_monthly_node_provider_rewards : opt MostRecentMonthlyNodeProviderRewards;
  wait_for_quiet_threshold_seconds : nat64;
  metrics : opt GovernanceCachedMetrics;
  node_providers : vec NodeProvider;
  economics : opt NetworkEconomics;
  latest_reward_event : opt RewardEvent;
  to_claim_transfers : vec NeuronStakeTransfer;
  short_voting_period_seconds : nat64;
  proposals : vec record { nat64; ProposalData };
  in_flight_commands : vec record { nat64; NeuronInFlightCommand };
  neurons : vec record { nat64; Neuron };
  genesis_timestamp_seconds : nat64;
};
type GovernanceCachedMetrics = record {
  not_dissolving_neurons_e8s_buckets : vec record { nat64; float64 };
  garbage_collectable_neurons_count : nat64;
  neurons_with_invalid_stake_count : nat64;
  not_dissolving_neurons_count_buckets : vec record { nat64; nat64 };
  total_supply_icp : nat64;
  neurons_with_less_than_6_months_dissolve_delay_count : nat64;
  dissolved_neurons_count : nat64;
  total_staked_e8s : nat64;
  not_dissolving_neurons_count : nat64;
  dissolved_neurons_e8s : nat64;
  neurons_with_less_than_6_months_dissolve_delay_e8s : nat64;
  dissolving_neurons_count_buckets : vec record { nat64; nat64 };
  dissolving_neurons_count : nat64;
  dissolving_neurons_e8s_buckets : vec record { nat64; float64 };
  community_fund_total_staked_e8s : nat64;
  timestamp_seconds : nat64;
};
type GovernanceError = record { error_message : text; error_type : int32 };
type IncreaseDissolveDelay = record {
  additional_dissolve_delay_seconds : nat32;
};
type KnownNeuron = record {
  id : opt NeuronId;
  known_neuron_data : opt KnownNeuronData;
};
type KnownNeuronData = record { name : text; description : opt text };
type ListKnownNeuronsResponse = record { known_neurons : vec KnownNeuron };
type ListNeurons = record {
  neuron_ids : vec nat64;
  include_neurons_readable_by_caller : bool;
};
type ListNeuronsResponse = record {
  neuron_infos : vec record { nat64; NeuronInfo };
  full_neurons : vec Neuron;
};
type ListNodeProvidersResponse = record { node_providers : vec NodeProvider };
type ListProposalInfo = record {
  include_reward_status : vec int32;
  before_proposal : opt NeuronId;
  limit : nat32;
  exclude_topic : vec int32;
  include_status : vec int32;
};
type ListProposalInfoResponse = record { proposal_info : vec ProposalInfo };
type MakeProposalResponse = record { proposal_id : opt NeuronId };
type ManageNeuron = record {
  id : opt NeuronId;
  command : opt Command;
  neuron_id_or_subaccount : opt NeuronIdOrSubaccount;
};
type ManageNeuronResponse = record { command : opt Command_1 };
type Merge = record { source_neuron_id : opt NeuronId };
type MergeMaturity = record { percentage_to_merge : nat32 };
type MergeMaturityResponse = record {
  merged_maturity_e8s : nat64;
  new_stake_e8s : nat64;
};
type MostRecentMonthlyNodeProviderRewards = record {
  timestamp : nat64;
  rewards : vec RewardNodeProvider;
};
type Motion = record { motion_text : text };
type NetworkEconomics = record {
  neuron_minimum_stake_e8s : nat64;
  max_proposals_to_keep_per_topic : nat32;
  neuron_management_fee_per_proposal_e8s : nat64;
  reject_cost_e8s : nat64;
  transaction_fee_e8s : nat64;
  neuron_spawn_dissolve_delay_seconds : nat64;
  minimum_icp_xdr_rate : nat64;
  maximum_node_provider_rewards_e8s : nat64;
};
type Neuron = record {
  id : opt NeuronId;
  controller : opt principal;
  recent_ballots : vec BallotInfo;
  kyc_verified : bool;
  not_for_profit : bool;
  maturity_e8s_equivalent : nat64;
  cached_neuron_stake_e8s : nat64;
  created_timestamp_seconds : nat64;
  aging_since_timestamp_seconds : nat64;
  hot_keys : vec principal;
  account : vec nat8;
  joined_community_fund_timestamp_seconds : opt nat64;
  dissolve_state : opt DissolveState;
  followees : vec record { int32; Followees };
  neuron_fees_e8s : nat64;
  transfer : opt NeuronStakeTransfer;
  known_neuron_data : opt KnownNeuronData;
};
type NeuronId = record { id : nat64 };
type NeuronIdOrSubaccount = variant {
  Subaccount : vec nat8;
  NeuronId : NeuronId;
};
type NeuronInFlightCommand = record {
  command : opt Command_2;
  timestamp : nat64;
};
type NeuronInfo = record {
  dissolve_delay_seconds : nat64;
  recent_ballots : vec BallotInfo;
  created_timestamp_seconds : nat64;
  state : int32;
  stake_e8s : nat64;
  joined_community_fund_timestamp_seconds : opt nat64;
  retrieved_at_timestamp_seconds : nat64;
  known_neuron_data : opt KnownNeuronData;
  voting_power : nat64;
  age_seconds : nat64;
};
type NeuronStakeTransfer = record {
  to_subaccount : vec nat8;
  neuron_stake_e8s : nat64;
  from : opt principal;
  memo : nat64;
  from_subaccount : vec nat8;
  transfer_timestamp : nat64;
  block_height : nat64;
};
type NodeProvider = record {
  id : opt principal;
  reward_account : opt AccountIdentifier;
};
type Operation = variant {
  RemoveHotKey : RemoveHotKey;
  AddHotKey : AddHotKey;
  StopDissolving : record {};
  StartDissolving : record {};
  IncreaseDissolveDelay : IncreaseDissolveDelay;
  JoinCommunityFund : record {};
  SetDissolveTimestamp : SetDissolveTimestamp;
};
type Proposal = record {
  url : text;
  title : opt text;
  action : opt Action;
  summary : text;
};
type ProposalData = record {
  id : opt NeuronId;
  failure_reason : opt GovernanceError;
  ballots : vec record { nat64; Ballot };
  proposal_timestamp_seconds : nat64;
  reward_event_round : nat64;
  failed_timestamp_seconds : nat64;
  reject_cost_e8s : nat64;
  latest_tally : opt Tally;
  decided_timestamp_seconds : nat64;
  proposal : opt Proposal;
  proposer : opt NeuronId;
  wait_for_quiet_state : opt WaitForQuietState;
  executed_timestamp_seconds : nat64;
};
type ProposalInfo = record {
  id : opt NeuronId;
  status : int32;
  topic : int32;
  failure_reason : opt GovernanceError;
  ballots : vec record { nat64; Ballot };
  proposal_timestamp_seconds : nat64;
  reward_event_round : nat64;
  deadline_timestamp_seconds : opt nat64;
  failed_timestamp_seconds : nat64;
  reject_cost_e8s : nat64;
  latest_tally : opt Tally;
  reward_status : int32;
  decided_timestamp_seconds : nat64;
  proposal : opt Proposal;
  proposer : opt NeuronId;
  executed_timestamp_seconds : nat64;
};
type RegisterVote = record { vote : int32; proposal : opt NeuronId };
type RemoveHotKey = record { hot_key_to_remove : opt principal };
type Result = variant { Ok; Err : GovernanceError };
type Result_1 = variant { Error : GovernanceError; NeuronId : NeuronId };
type Result_2 = variant { Ok : Neuron; Err : GovernanceError };
type Result_3 = variant { Ok : RewardNodeProviders; Err : GovernanceError };
type Result_4 = variant { Ok : NeuronInfo; Err : GovernanceError };
type Result_5 = variant { Ok : NodeProvider; Err : GovernanceError };
type RewardEvent = record {
  day_after_genesis : nat64;
  actual_timestamp_seconds : nat64;
  distributed_e8s_equivalent : nat64;
  settled_proposals : vec NeuronId;
};
type RewardMode = variant {
  RewardToNeuron : RewardToNeuron;
  RewardToAccount : RewardToAccount;
};
type RewardNodeProvider = record {
  node_provider : opt NodeProvider;
  reward_mode : opt RewardMode;
  amount_e8s : nat64;
};
type RewardNodeProviders = record {
  use_registry_derived_rewards : opt bool;
  rewards : vec RewardNodeProvider;
};
type RewardToAccount = record { to_account : opt AccountIdentifier };
type RewardToNeuron = record { dissolve_delay_seconds : nat64 };
type SetDefaultFollowees = record {
  default_followees : vec record { int32; Followees };
};
type SetDissolveTimestamp = record { dissolve_timestamp_seconds : nat64 };
type Spawn = record {
  percentage_to_spawn : opt nat32;
  new_controller : opt principal;
  nonce : opt nat64;
};
type SpawnResponse = record { created_neuron_id : opt NeuronId };
type Split = record { amount_e8s : nat64 };
type Tally = record {
  no : nat64;
  yes : nat64;
  total : nat64;
  timestamp_seconds : nat64;
};
type UpdateNodeProvider = record { reward_account : opt AccountIdentifier };
type WaitForQuietState = record { current_deadline_timestamp_seconds : nat64 };
service : {
  claim_gtc_neurons : (principal, vec NeuronId) -> (Result);
  claim_or_refresh_neuron_from_account : (ClaimOrRefreshNeuronFromAccount) -> (
      ClaimOrRefreshNeuronFromAccountResponse,
    );
  get_build_metadata : () -> (text) query;
  get_full_neuron : (nat64) -> (Result_2) query;
  get_full_neuron_by_id_or_subaccount : (NeuronIdOrSubaccount) -> (
      Result_2,
    ) query;
  get_monthly_node_provider_rewards : () -> (Result_3);
  get_most_recent_monthly_node_provider_rewards : () -> (
      opt MostRecentMonthlyNodeProviderRewards,
    ) query;
  get_network_economics_parameters : () -> (NetworkEconomics) query;
  get_neuron_ids : () -> (vec nat64) query;
  get_neuron_info : (nat64) -> (Result_4) query;
  get_neuron_info_by_id_or_subaccount : (NeuronIdOrSubaccount) -> (
      Result_4,
    ) query;
  get_node_provider_by_caller : (null) -> (Result_5) query;
  get_pending_proposals : () -> (vec ProposalInfo) query;
  get_proposal_info : (nat64) -> (opt ProposalInfo) query;
  list_known_neurons : () -> (ListKnownNeuronsResponse) query;
  list_neurons : (ListNeurons) -> (ListNeuronsResponse) query;
  list_node_providers : () -> (ListNodeProvidersResponse) query;
  list_proposals : (ListProposalInfo) -> (ListProposalInfoResponse) query;
  manage_neuron : (ManageNeuron) -> (ManageNeuronResponse);
  transfer_gtc_neuron : (NeuronId, NeuronId) -> (Result);
  update_node_provider : (UpdateNodeProvider) -> (Result);
}`,
  },
  "ryjl3-tyaaa-aaaaa-aaaba-cai": {
    name: "ledger",
  },
};
