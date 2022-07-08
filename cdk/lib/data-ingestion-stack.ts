// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ThingWithCert } from './thing-with-cert-resource';
import { aws_s3 as s3 } from 'aws-cdk-lib';

import path = require("path");
import { PetTrackerPositionLambda } from './pettracker-position-lambda'
import { PetTrackerALSLambda } from './pettracker-als-lambda'

export class PetTrackerDataIngestionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const version = this.node.tryGetContext('version') || '';

    const assetsBucket = s3.Bucket.fromBucketName(this, 'pettracker-bucket', `amazon-location-service-pettracker-${cdk.Aws.REGION}`);

    new ThingWithCert(this, 'thing-with-cert', {
      thingName: "PetTrackerThing",
      bucket: assetsBucket,
      version: version
    });

    new PetTrackerPositionLambda(this, 'pettracker-position-lambda', {
      bucket: assetsBucket,
      version: version
    });

    new PetTrackerALSLambda(this, 'pettracker-als-lambda', {
      trackerName: "PetTracker",
      bucket: assetsBucket,
      version: version
    });

  }
}
