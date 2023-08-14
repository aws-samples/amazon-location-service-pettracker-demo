// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
  LocationClient,
  BatchUpdateDevicePositionCommand,
} from "@aws-sdk/client-location";
import { logger } from "../commons/powertools";
import type { BatchUpdateDevicePositionCommandInput } from "@aws-sdk/client-location";
import type { Event } from "./types";

const locationClient = new LocationClient({});

export const handler = async (event: Event) => {
  const {
    deviceId,
    longitude,
    latitude,
    timestamp,
    accuracy: { horizontal },
    positionProperties: { batteryLevel },
  } = event;

  logger.debug("event", { event });

  const updates: BatchUpdateDevicePositionCommandInput["Updates"] = [
    {
      DeviceId: deviceId,
      SampleTime: new Date(timestamp),
      Position: [longitude, latitude],
      PositionProperties: {
        batteryLevel: `${batteryLevel}`,
      },
      Accuracy: {
        Horizontal: horizontal,
      },
    },
  ];
  try {
    await locationClient.send(
      new BatchUpdateDevicePositionCommand({
        TrackerName: process.env.TRACKER_NAME,
        Updates: updates,
      })
    );

    logger.info("Successfully updated device position", { details: updates });
  } catch (err) {
    logger.error("Unable to update tracker", err as Error);
    throw err;
  }
};
