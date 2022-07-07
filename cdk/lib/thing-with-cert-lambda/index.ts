// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as lambda from 'aws-lambda';
import { Iot } from 'aws-sdk';
import { iotAdaptor } from './adapters/iot';
import { thingAdaptor } from './adapters/thing';
import * as cfn from './util/cfn-response';

type Success = lambda.CloudFormationCustomResourceSuccessResponse;
type Failure = lambda.CloudFormationCustomResourceFailedResponse;

const thingHandler = thingAdaptor(iotAdaptor(new Iot()));

export const handler = async (
  event: lambda.CloudFormationCustomResourceEvent,
  context: lambda.Context
): Promise<void> => {
  try {
    console.info(`Event: ${JSON.stringify(event)}`);
    const thingName = event.ResourceProperties.ThingName;
    if (event.RequestType === 'Create') {
      console.info(`Creating thing: ${thingName}`);

      return thingHandler.create(thingName).then((res) => {
        cfn.send(
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
        )
      });


    } else if (event.RequestType === 'Delete') {
      console.info(`Deleting thing: ${thingName}`);

      return thingHandler.delete(thingName).then(() => {
        cfn.send(
          event,
          context,
          cfn.SUCCESS,
          {},
          event.PhysicalResourceId
        );
      });

    } else if (event.RequestType === 'Update') {
      console.info(`Updating thing: ${thingName}`);

      return thingHandler.delete(thingName)
        .then(() => thingHandler.create(thingName)
        ).then((res) =>
          cfn.send(
            event,
            context,
            cfn.SUCCESS,
            {
              certPem: res.certPem,
              privKey: res.privKey,
              certId: res.certId,
            },
            res.thingArn
          )
        );

    } else {
      throw new Error('Received invalid request type');
    }
  } catch (err) {

    return new Promise(() =>
      cfn.send(
        event,
        context,
        cfn.FAILED,
        {},
        // @ts-ignore
        event.PhysicalResourceId || event.LogicalResourceId
      )
    );
  }
};