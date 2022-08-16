// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { IoTEvent } from "aws-lambda";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import fetch from "node-fetch";
import { URL } from "url";

const APPSYNC_ENDPOINT = process.env.GRAPHQL_URL;
if (!APPSYNC_ENDPOINT) {
  throw new Error("GRAPHQL_URL env var is not set");
}

type LocationEvent = {
  type: "locationPayload";
  payload: {
    id: string;
    timestamp: string;
    lat: number;
    lng: number;
  };
};

type Event = Extract<IoTEvent<LocationEvent>, { type: "locationPayload" }>;

export const handler = async (event: Event) => {
  const { id, lng, lat, timestamp } = event.payload;

  const updatePosition = {
    query: `
      mutation UpdatePosition($input: PositionInput!) {
        updatePosition(input: $input) {
          id
          lng
          lat
          updatedAt
        }
      }
    `,
    operationName: "UpdatePosition",
    variables: {
      input: {
        id,
        lng,
        lat,
        updatedAt: new Date(timestamp).toISOString().split("T")[0],
      },
    },
  };

  const url = new URL(APPSYNC_ENDPOINT);
  console.log(url);
  console.log(APPSYNC_ENDPOINT);

  const request = new HttpRequest({
    hostname: url.hostname,
    path: url.pathname,
    body: JSON.stringify(updatePosition),
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
    const result = await fetch(APPSYNC_ENDPOINT, {
      headers,
      body,
      method,
      timeout: 5000,
    }).then((res) => res.json());

    console.log(result);
  } catch (err) {
    console.error(err);
    throw new Error("Failed to execute GraphQL mutation");
  }
};
