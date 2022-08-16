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
  message: string;
};

type Event = Extract<IoTEvent<LocationEvent>, { type: "location" }>;

export const handler = async (event: Event) => {
  console.log(event.message);
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

    // logger.info("Successfully updated device position");
  } catch (err) {
    // logger.error(err);
    console.log(err);
    throw err;
  }
};
