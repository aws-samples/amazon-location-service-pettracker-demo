// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import type { EventBridgeEvent } from "aws-lambda";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import p from "phin";
import { URL } from "url";

const APPSYNC_ENDPOINT = process.env.GRAPHQL_URL;
if (!APPSYNC_ENDPOINT) {
  throw new Error("GRAPHQL_URL env var is not set");
}

type LocationEvent = {
  EventType: "ENTER" | "EXIT";
  GeofenceId: string;
  DeviceId: string;
  SampleTime: string;
  Position: [number, number];
};

type Event = EventBridgeEvent<"Location Geofence Event", LocationEvent>;

export const handler = async (event: Event) => {
  const {
    EventType: type,
    GeofenceId: geofenceId,
    DeviceId: id,
    SampleTime: date,
  } = event.detail;

  const sendGeofenceEvent = {
    query: `
      mutation SendGeofenceEvent($input: GeofenceEventInput!) {
        sendGeofenceEvent(input: $input) {
          id
          date
          type
          geofenceId
        }
      }
    `,
    operationName: "SendGeofenceEvent",
    variables: {
      input: {
        id,
        date,
        type,
        geofenceId,
      },
    },
  };

  const url = new URL(APPSYNC_ENDPOINT);

  const request = new HttpRequest({
    hostname: url.hostname,
    path: url.pathname,
    body: JSON.stringify(sendGeofenceEvent),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: url.hostname,
    },
  });

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    service: "appsync",
    region: process.env.AWS_REGION as string,
    sha256: Sha256,
  });

  const { headers, body, method } = await signer.sign(request);

  try {
    const result = await p({
      url: APPSYNC_ENDPOINT,
      headers,
      data: body,
      method,
      timeout: 5000,
      parse: "json",
    });

    console.debug(result);
  } catch (err) {
    console.error(err);
    throw new Error("Failed to execute GraphQL mutation");
  }
};
