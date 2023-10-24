// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { writeFile } from "node:fs/promises";
import {
  getStackName,
  getStackOutputs,
  getValueFromNamePart,
} from "./shared.mjs";

const saveTemplate = async (template, path) => {
  try {
    await writeFile(
      path,
      `const awsmobile = ${JSON.stringify(template, null, 2)}
export default awsmobile;
  `
    );
  } catch (err) {
    console.error(err);
    console.error("Unable to write file");
    throw err;
  }
};

(async () => {
  const stack = await getStackName();
  const { keys, vals } = await getStackOutputs(stack.StackName);
  const template = {
    Auth: {},
    aws_appsync_authenticationType: "API_KEY",
    geo: {
      AmazonLocationService: {
        maps: {
          items: {
            PetTrackerMap: {
              style: "VectorHereExplore",
            },
          },
          default: "PetTrackerMap",
        },
        geofenceCollections: {
          items: ["PetTrackerGeofenceCollection"],
          default: "PetTrackerGeofenceCollection",
        },
        routeCalculator: "PetTrackerRouteCalculator",
      },
    },
  };

  const region = vals[getValueFromNamePart(`AWSRegion`, keys)];
  template.Auth.region = region;
  template.aws_appsync_region = region;
  template.geo.AmazonLocationService.region = region;
  template.aws_project_region = region;
  template.Auth.identityPoolId =
    vals[getValueFromNamePart(`IdentityPoolId`, keys)];
  template.aws_appsync_graphqlEndpoint =
    vals[getValueFromNamePart(`ApiUrl`, keys)];
  template.aws_appsync_apiKey = vals[getValueFromNamePart(`ApiKey`, keys)];

  saveTemplate(template, "../frontend/src/aws-exports.js");
})();
