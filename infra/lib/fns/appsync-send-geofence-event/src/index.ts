// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import type { EventBridgeEvent } from "aws-lambda";
import { executeGraphQlOperation } from "../../commons/utils";
import { logger } from "../../commons/powertools";

/**
 * Details of the event forwarded by EventBridge from the Geofence
 */
type LocationEvent = {
  EventType: "ENTER" | "EXIT";
  GeofenceId: string;
  DeviceId: string;
  SampleTime: string;
  Position: [number, number];
};

type Event = EventBridgeEvent<"Location Geofence Event", LocationEvent>;

export const handler = async (event: Event) => {
  logger.debug("Received event", { event });

  const sendGeofenceEvent = {
    query: `mutation SendGeofenceEvent($input: GeofenceEventInput) {
      sendGeofenceEvent(input: $input) {
        deviceId
        lng
        lat
        sampleTime
        geofenceId
        type
      }
    }`,
    operationName: "SendGeofenceEvent",
    variables: {
      input: {
        deviceId: event.detail.DeviceId,
        lng: event.detail.Position[0],
        lat: event.detail.Position[1],
        sampleTime: new Date(event.detail.SampleTime).toISOString(),
        geofenceId: event.detail.GeofenceId,
        type: event.detail.EventType,
      },
    },
  };

  await executeGraphQlOperation(sendGeofenceEvent);
};
