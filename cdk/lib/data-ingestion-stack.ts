// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from '@aws-cdk/core';
import * as iot from '@aws-cdk/aws-iot';

import { CustomCertificateResource } from './custom-certificate-resource';
import path = require("path");
import { PetTrackerPositionLambda } from './pettracker-position-lambda'
import { PetTrackerALSLambda } from './pettracker-als-lambda'
import { CustomTrackerResource } from './custom-tracker-resource'

export class PetTrackerDataIngestionStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = props?.env?.region || 'us-east-1'
    const account = props?.env?.account || ''

    /**
     * Create Device.
     * The PetTrackerThing will receives messages from the tracker device or emulator.
     */
    const trackerThing = new iot.CfnThing(this, "IoTDevice", {
      thingName: "PetTrackerThing"
    });

    const trackerCredentials = new CustomCertificateResource(
      this,
      "PetTrackerCredentials",
      {
        account: this.account,
        stackName: this.stackName,
        thingName: trackerThing.ref
      }
    );

    new iot.CfnThingPrincipalAttachment(
      this,
      "PetTrackerThingCredentialAttachment",
      {
        principal: trackerCredentials.certificateArn,
        thingName: trackerThing.ref
      }
    );

    const trackerPolicy = new iot.CfnPolicy(this, "PetTrackerPolicy", {
      policyName: `${trackerThing.thingName}_Policy`,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "iot:Connect"
            ],
            Resource: [`arn:aws:iot:${region}:${account}:client/pettracker-*`]
          },
          {
            Effect: "Allow",
            Action: [
              "iot:Publish"
            ],
            Resource: [`arn:aws:iot:${region}:${account}:topic/pettracker`]
          }
        ]
      }
    });

    new iot.CfnPolicyPrincipalAttachment(this, "PetTrackerThingPolicyAttachment", {
      policyName: trackerPolicy.policyName!,
      principal: trackerCredentials.certificateArn
    });

    new PetTrackerPositionLambda(this, 'pettracker-position-lambda', {
      region: region,
      account: account
    });

    new PetTrackerALSLambda(this, 'pettracker-als-lambda', {
      region: region,
      account: account,
      trackerName: "PetTracker"
    });

  }
}
