// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import Simulator from "./utils";

const LNG = 2.1894745855131217;
const LAT = 41.39937882497607;
const STEP_DISTANCE = 10; // Distance in meters for each step taken by the pet (default 10m / 32 feet)
const STEP_FREQUENCY = 10; // Frequency at which updates will be sent (default 10 seconds)
const IOT_CORE_TOPIC = "iot/pettracker";
const IOT_CERT_SECRET_ID = "pettracker/iot-cert";

const sim = new Simulator(
  `pettracker`,
  IOT_CORE_TOPIC,
  IOT_CERT_SECRET_ID,
  [LNG, LAT],
  STEP_DISTANCE
);

export const handler = async (): Promise<void> => {
  while (true) {
    await sim.makeStep();
    await new Promise((resolve) => setTimeout(resolve, STEP_FREQUENCY * 1000)); // Wait `STEP_FREQUENCY` seconds
  }
};

handler();
