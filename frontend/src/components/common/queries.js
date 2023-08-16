const getDeviceHistory = `query GetDeviceHistory($deviceId: ID!, $span: String = "hour") {
  getDeviceHistory(deviceId: $deviceId, span: $span) {
    deviceId
    accuracy {
      horizontal
    }
    lat
    lng
    metadata {
      batteryLevel
    }
    receivedTime
    sampleTime
    trackerName
  }
}`;

export { getDeviceHistory };
