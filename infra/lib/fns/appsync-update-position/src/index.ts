// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import type { EventBridgeEvent } from "aws-lambda";
import { executeGraphQlOperation } from "../../commons/utils";
import { logger } from "../../commons/powertools";

/**
 * Details of the event forwarded by EventBridge from the Tracker device
 */
type LocationEvent = {
  EventType: "UPDATE";
  TrackerName: string;
  DeviceId: string;
  SampleTime: string;
  ReceivedTime: string;
  Position: [number, number];
  Accuracy?: {
    Horizontal: number;
  };
  PositionProperties?: {
    [key: string]: string;
  };
};

type Event = EventBridgeEvent<"Location Device Position Event", LocationEvent>;

export const handler = async (event: Event) => {
  logger.debug("Received event", { event });

  const updatePosition = {
    query: `mutation UpdatePosition($input: PositionEventInput) {
      updatePosition(input: $input) {
        deviceId
        lng
        lat
        sampleTime
        receivedTime
        trackerName
        type
        accuracy {
          horizontal
        }
        metadata {
          batteryLevel
        }
      }
    }`,
    operationName: "UpdatePosition",
    variables: {
      input: {
        deviceId: event.detail.DeviceId,
        lng: event.detail.Position[0],
        lat: event.detail.Position[1],
        sampleTime: new Date(event.detail.SampleTime).toISOString(),
        receivedTime: new Date(event.detail.ReceivedTime).toISOString(),
        trackerName: event.detail.TrackerName,
        type: event.detail.EventType,
        ...(event.detail.Accuracy && {
          accuracy: {
            horizontal: event.detail.Accuracy.Horizontal,
          },
        }),
        ...(event.detail.PositionProperties && {
          metadata: {
            batteryLevel: event.detail.PositionProperties.batteryLevel,
          },
        }),
      },
    },
  };

  await executeGraphQlOperation(updatePosition);
};
