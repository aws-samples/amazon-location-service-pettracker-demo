import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
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

/**
 *
 * @param {string} namePart
 */
const getValueFromNamePart = (namePart, values) =>
  values.find((el) => el.toUpperCase().includes(namePart.toUpperCase()));

export { getStackName, getStackOutputs, getValueFromNamePart };
