// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
  LocationClient,
  GetDevicePositionHistoryCommand,
} from "@aws-sdk/client-location";
import { logger } from "../commons/powertools";
import { getStartAndEndTime } from "./helpers";
import type { AppSyncResolverEvent } from "aws-lambda";
import type { Span } from "./types";

const locationClient = new LocationClient({});

export const handler = async (
  event: AppSyncResolverEvent<{ deviceId: string; span: Span }>
) => {
  logger.debug("event", { event });

  const { deviceId, span } = event.arguments;

  if (!deviceId) {
    throw new Error("deviceId is required");
  }

  const { startTime, endTime } = getStartAndEndTime(span);

  try {
    const res = await locationClient.send(
      new GetDevicePositionHistoryCommand({
        DeviceId: deviceId,
        TrackerName: process.env.TRACKER_NAME,
        StartTimeInclusive: startTime,
        EndTimeExclusive: endTime,
      })
    );

    logger.debug("Result from Tracker API", { res });

    const { DevicePositions } = res;

    if (!DevicePositions || DevicePositions.length === 0) {
      throw new Error(
        "No history found for this device and time range, try increasing the time range"
      );
    }

    return DevicePositions.map((position) => ({
      deviceId: position.DeviceId,
      sampleTime: position.SampleTime,
      accuracy: position.Accuracy
        ? {
            horizontal: position.Accuracy?.Horizontal ?? -1,
          }
        : null,
      lng: position.Position?.[0] ?? -1,
      lat: position.Position?.[1] ?? -1,
      trackerName: process.env.TRACKER_NAME,
      receivedTime: position.ReceivedTime,
      metadata: {
        batteryLevel: position.PositionProperties?.batteryLevel ?? -1,
      },
    }));
  } catch (error) {
    throw error;
  }
};
