const onUpdatePosition = `subscription OnUpdatePosition {
  onUpdatePosition {
    deviceId
    lat
    lng
    sampleTime
    trackerName
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
