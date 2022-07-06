import { StandardLogger } from 'aws-cloudformation-custom-resource';
import * as lambda from 'aws-lambda';
import { Iot } from 'aws-sdk';
import { iotAdaptor } from './adapters/iot';
import { thingAdaptor } from './adapters/thing';

const logger = new StandardLogger();

type Success = lambda.CloudFormationCustomResourceSuccessResponse;
type Failure = lambda.CloudFormationCustomResourceFailedResponse;

const thingHandler = thingAdaptor(iotAdaptor(new Iot()));

export const handler = async (
  event: lambda.CloudFormationCustomResourceEvent,
): Promise<Success | Failure> => {
  try {
    const thingName = event.ResourceProperties.ThingName;
    if (event.RequestType === 'Create') {
      const { thingArn, certId, certPem, privKey } = await thingHandler.create(
        thingName,
      );
      return {
        Status: 'SUCCESS',
        PhysicalResourceId: thingArn,
        LogicalResourceId: event.LogicalResourceId,
        RequestId: event.RequestId,
        StackId: event.StackId,
        Data: {
          certPem: certPem,
          privKey: privKey,
          certId: certId,
        },
      };
    } else if (event.RequestType === 'Delete') {
      await thingHandler.delete(thingName);
      return {
        Status: 'SUCCESS',
        PhysicalResourceId: event.PhysicalResourceId,
        LogicalResourceId: event.LogicalResourceId,
        RequestId: event.RequestId,
        StackId: event.StackId,
      };
    } else if (event.RequestType === 'Update') {
      logger.info(`Updating thing: ${thingName}`);
      return {
        Status: 'SUCCESS',
        PhysicalResourceId: event.PhysicalResourceId,
        LogicalResourceId: event.LogicalResourceId,
        RequestId: event.RequestId,
        StackId: event.StackId,
      };
    } else {
      throw new Error('Received invalid request type');
    }
  } catch (err) {
    let reasonStr = "";
    if (typeof err === "string") {
        reasonStr = err;
    } else if (err instanceof Error) {
        reasonStr = err.message;
    }
    return {
      Status: 'FAILED',
      Reason: reasonStr,
      RequestId: event.RequestId,
      StackId: event.StackId,
      LogicalResourceId: event.LogicalResourceId!,
      // @ts-ignore
      PhysicalResourceId: event.PhysicalResourceId || event.LogicalResourceId,
    };
  }
};