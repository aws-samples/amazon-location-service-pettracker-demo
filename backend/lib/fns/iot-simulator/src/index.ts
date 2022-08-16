// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Simulator from "./utils";
import { BBox, Position } from "@turf/helpers";

type Event = {
  id: string;
  position: Position;
  bbox: BBox;
};

const IOT_ENDPOINT = process.env.IOT_ENDPOINT;
const IOT_TOPIC = process.env.IOT_TOPIC;
const IOT_CERT_SECRET_ID = process.env.IOT_CERT_SECRET_ID;
if (!IOT_ENDPOINT || !IOT_TOPIC || !IOT_CERT_SECRET_ID) {
  throw new Error(
    "IOT_ENDPOINT or IOT_TOPIC or IOT_CERT_SECRET_ID env vars are not set"
  );
}
const sim = new Simulator(
  "pettracker",
  IOT_ENDPOINT,
  IOT_TOPIC,
  IOT_CERT_SECRET_ID
);

export const handler = async (event: Event): Promise<Event> => {
  console.log(event);
  const { id, position, bbox } = event;
  const nextPosition = await sim.makeStep(id, position, bbox);

  return {
    id,
    position: nextPosition,
    bbox,
  };
};
