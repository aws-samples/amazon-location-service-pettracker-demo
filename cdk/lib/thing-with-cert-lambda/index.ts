import * as lambda from 'aws-lambda';
import { Iot } from 'aws-sdk';
import { iotAdaptor } from './adapters/iot';
import { thingAdaptor } from './adapters/thing';

var cfn = require('cfn-response');

type Success = lambda.CloudFormationCustomResourceSuccessResponse;
type Failure = lambda.CloudFormationCustomResourceFailedResponse;

const thingHandler = thingAdaptor(iotAdaptor(new Iot()));

export const handler = async (
  event: lambda.CloudFormationCustomResourceEvent,
  context: lambda.Context
): Promise<Success | Failure> => {
  try {
    console.info(`Event: ${event}`);
    const thingName = event.ResourceProperties.ThingName;
    if (event.RequestType === 'Create') {
      console.info(`Creating thing: ${thingName}`);
      return thingHandler.create(thingName).then(res => cfn.send(
        event,
        context,
        cfn.SUCCESS,
        {
          certPem: res.certPem,
          privKey: res.privKey,
          certId: res.certId,
        },
        res.thingArn,
        true
      )).then(() => ({
        Status: 'SUCCESS',
        // @ts-ignore
        PhysicalResourceId: event.PhysicalResourceId || event.LogicalResourceId,
        LogicalResourceId: event.LogicalResourceId,
        RequestId: event.RequestId,
        StackId: event.StackId,
      }));

    } else if (event.RequestType === 'Delete') {
      console.info(`Deleting thing: ${thingName}`);
      return thingHandler.delete(thingName).then(res => cfn.send(
        event,
        context,
        cfn.SUCCESS,
        {},
        event.PhysicalResourceId
      )).then(() => ({
        Status: 'SUCCESS',
        PhysicalResourceId: event.PhysicalResourceId,
        LogicalResourceId: event.LogicalResourceId,
        RequestId: event.RequestId,
        StackId: event.StackId,
      }));
    } else if (event.RequestType === 'Update') {
      console.info(`Updating thing: ${thingName}`);
      return thingHandler.delete(thingName).then(res => cfn.send(
        event,
        context,
        cfn.SUCCESS,
        {},
        event.PhysicalResourceId
      ))
        .then(() => thingHandler.create(thingName))
        .then(res => cfn.send(
          event,
          context,
          cfn.SUCCESS,
          {
            certPem: res.certPem,
            privKey: res.privKey,
            certId: res.certId,
          },
          res.thingArn
        ))
        .then(() => ({
          Status: 'SUCCESS',
          // @ts-ignore
          PhysicalResourceId: event.PhysicalResourceId || event.LogicalResourceId,
          LogicalResourceId: event.LogicalResourceId,
          RequestId: event.RequestId,
          StackId: event.StackId,
        }))
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

    const asyncCfnCall = () => {
      return new Promise((resolve, reject) => {
        cfn.send(
          event,
          context,
          cfn.FAILED,
          {},
          // @ts-ignore
          event.PhysicalResourceId || event.LogicalResourceId
        );
      })
    }

    return asyncCfnCall().then(() => ({
      Status: 'FAILED',
      Reason: reasonStr,
      RequestId: event.RequestId,
      StackId: event.StackId,
      LogicalResourceId: event.LogicalResourceId!,
      // @ts-ignore
      PhysicalResourceId: event.PhysicalResourceId || event.LogicalResourceId,
    }))
  }
};