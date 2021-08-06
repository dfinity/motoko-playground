import Buffer "mo:base/Buffer";
import Result "mo:base/Result";

module {
public type AttributeId = Nat;
public type Period = { #Minute; #Hour; #Day };
public type Frequency = {
  n: Nat;
  period: Period;
};
public type AttributeDescription = {
  // Name of the attribute to be tracked
  name: Text;

  // Optional description of the attribute
  description: ?Text;

  // Getter function should return the value to be tracked
  getter: shared query () -> async Int;

  // Specify a frequency to store periodic snapshots
  polling_frequency: ?Frequency;
};

public type TrackerRequest = {
  // Specify an attributeId to update existing record
  attributeId: ?AttributeId;

  action: {
    // Create or update an attribute
    #Set: AttributeDescription;

    // Start tracking this data attribute if paused
    #Unpause;

    // Stop tracking this data attribute
    #Pause;

    // Remove all stored data for this attribute
    #Delete;
  }
};

public type MetricsError = {
  #Unauthorized;
  #InvalidId;
  #FailedGettingValue;
  #FailedExecution;
  #AttributePaused;
};
public type MetricsResponse = Result.Result<AttributeId, MetricsError>;

public type GetPeriod = { #Minute; #Hour; #Day; #Week };
public type GetRequest = {
  attributeId: AttributeId;
  before: ?Int;
  limit: ?Nat;
  period: ?GetPeriod;
};

public type Status = { #active; #paused };
public type GetAttributeDescription = {
  id: AttributeId;
  name: Text;
  description: ?Text;
  polling_frequency: ?Frequency;
  status: Status;
};
public type TimeSeries = {
  timestamp: Int;
  value: Int;
};
public type AttributeRecord = {
  id: AttributeId;
  principal: Principal;
  description: AttributeDescription;
  series: [TimeSeries];
  status: Status;
};

public type MetricsService = actor {
  track : TrackerRequest -> async MetricsResponse;
}
}
