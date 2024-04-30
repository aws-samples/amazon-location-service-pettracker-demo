// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { writeFile } from "node:fs/promises";
import {
  CloudFormationClient,
  ListStacksCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

const cfnClient = new CloudFormationClient({});

const getStackName = async () => {
  try {
    const res = await cfnClient.send(
      new ListStacksCommand({
        StackStatusFilter: [
          "CREATE_COMPLETE",
          "UPDATE_COMPLETE",
          "ROLLBACK_COMPLETE",
        ],
      })
    );
    const stack = res.StackSummaries.find((stack) =>
      stack.StackName.toUpperCase().includes("pettracker".toUpperCase())
    );
    if (!stack) {
      throw new Error("Unable to find stack among loaded ones");
    }
    return stack;
  } catch (err) {
    console.error(err);
    console.error("Unable to load CloudFormation stacks.");
    throw err;
  }
};

/**
 *
 * @param {string} stackName
 */
const getStackOutputs = async (stackName) => {
  try {
    const res = await cfnClient.send(
      new DescribeStacksCommand({
        StackName: stackName,
      })
    );
    if (res.Stacks.length === 0) {
      throw new Error("Stack not found");
    }
    const keys = [];
    const outputs = {};
    res.Stacks?.[0].Outputs.forEach(({ OutputKey, OutputValue }) => {
      outputs[OutputKey] = OutputValue;
      keys.push(OutputKey);
    });
    return {
      keys,
      vals: outputs,
    };
  } catch (err) {
    console.error(err);
    console.error("Unable to load CloudFormation Stack outputs.");
    throw err;
  }
};

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

/**
 *
 * @param {string} namePart
 */
const getValueFromNamePart = (namePart, values) =>
  values.find((el) => el.includes(namePart));

(async () => {
  const stack = await getStackName();
  const { keys, vals } = await getStackOutputs(stack.StackName);
  const region = vals[getValueFromNamePart(`AWSRegion`, keys)];
  const template = {
    aws_project_region: region,
    aws_cognito_identity_pool_id:
      vals[getValueFromNamePart(`IdentityPoolId`, keys)],
    geo: {
      amazon_location_service: {
        region,
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
    aws_appsync_graphqlEndpoint: vals[getValueFromNamePart(`ApiUrl`, keys)],
    aws_appsync_region: region,
    aws_appsync_authenticationType: "API_KEY",
    aws_appsync_apiKey: vals[getValueFromNamePart(`ApiKey`, keys)],
  };

  saveTemplate(template, "../frontend/src/aws-exports.js");
})();
