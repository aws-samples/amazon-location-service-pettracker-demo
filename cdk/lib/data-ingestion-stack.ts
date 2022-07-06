// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ThingWithCert } from './thing-with-cert-resource';

import path = require("path");
import { PetTrackerPositionLambda } from './pettracker-position-lambda'
import { PetTrackerALSLambda } from './pettracker-als-lambda'

export class PetTrackerDataIngestionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = props?.env?.region || 'us-east-1'
    const account = props?.env?.account || ''

    new ThingWithCert(this, 'ThingWithCert', {
      thingName:"PetTrackerThing",
      saveToParamStore: true,
      paramPrefix: '/devices',
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
