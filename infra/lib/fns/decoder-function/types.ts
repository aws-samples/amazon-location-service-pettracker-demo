import { IoTEvent } from "aws-lambda";

type LocationEvent = {
  type: "location";
  deviceId: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  positionProperties: {
    batteryLevel: number;
  };
  accuracy: {
    horizontal: number;
  };
};

type Event = Extract<IoTEvent<LocationEvent>, { type: "location" }>;

export type { Event, LocationEvent };
