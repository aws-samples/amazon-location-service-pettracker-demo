// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { IoTEvent } from "aws-lambda";
import {
  LocationClient,
  BatchUpdateDevicePositionCommand,
} from "@aws-sdk/client-location";

const locationClient = new LocationClient({});

type LocationEvent = {
  type: "location";
  id: string;
  timestamp: string;
  lat: number;
  lng: number;
};

type Event = Extract<IoTEvent<LocationEvent>, { type: "location" }>;

export const handler = async (event: Event) => {
  const { id, lng, lat, timestamp } = event;

  const updates = [
    {
      DeviceId: id,
      SampleTime: new Date(timestamp),
      Position: [lng, lat],
    },
  ];
  try {
    await locationClient.send(
      new BatchUpdateDevicePositionCommand({
        TrackerName: process.env.TRACKER_NAME,
        Updates: updates,
      })
    );

    console.info("Successfully updated device position");
  } catch (err) {
    console.error(err);
    throw err;
  }
};
