// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import Simulator from "./utils";

const LNG = 2.1894745855131217;
const LAT = 41.39937882497607;
const IOT_CORE_TOPIC = "iot/pettracker";
const IOT_CERT_SECRET_ID = "pettracker/iot-cert";

const sim = new Simulator(`pettracker`, IOT_CORE_TOPIC, IOT_CERT_SECRET_ID, [
  LNG,
  LAT,
]);

export const handler = async (): Promise<void> => {
  while (true) {
    await sim.makeStep();
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
  }
};

handler();
