#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PetTrackerPipelineStack } from '../lib/pipeline-stack';
import { PetTrackerDataIngestionStack } from '../lib/data-ingestion-stack';

const app = new cdk.App();

new PetTrackerPipelineStack(app, 'PetTrackerPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
});

new PetTrackerDataIngestionStack(app, 'PetTrackerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
});

app.synth();
