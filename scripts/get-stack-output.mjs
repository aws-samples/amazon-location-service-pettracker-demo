// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
  getStackName,
  getStackOutputs,
  getValueFromNamePart,
} from "./shared.mjs";

(async () => {
  const paramName = process.argv[2];
  if (!paramName) {
    console.error(`Missing parameter name\n`);
    console.log(`Usage: node get-stack-output.mjs <output-name>\n`);
    process.exit(1);
  }
  const stack = await getStackName();
  const { keys, vals } = await getStackOutputs(stack.StackName);

  const region = vals[getValueFromNamePart(paramName, keys)];
  console.log(region);
})();
