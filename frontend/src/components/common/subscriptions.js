const onUpdatePosition = `subscription OnUpdatePosition {
  onUpdatePosition {
    deviceId
    lat
    lng
    sampleTime
    trackerName
    accuracy {
      horizontal
    }
    metadata {
      batteryLevel
    }
  }
}`;

const onGeofenceEvent = `subscription OnGeofenceEvent {
  onGeofenceEvent {
    deviceId
    geofenceId
    lng
    lat
    sampleTime
    type
  }
}`;

export { onUpdatePosition, onGeofenceEvent };
