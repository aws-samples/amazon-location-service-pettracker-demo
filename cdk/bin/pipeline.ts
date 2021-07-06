#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PetTrackerPipelineStack } from '../lib/pipeline-stack';
import { PetTrackerDataIngestionStack } from '../lib/data-ingestion-stack';
import { DefaultStackSynthesizer } from '@aws-cdk/core';

const app = new cdk.App();

new PetTrackerPipelineStack(app, 'PetTrackerPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  synthesizer: new DefaultStackSynthesizer({
    qualifier: 'cdkfix',
  })
});

new PetTrackerDataIngestionStack(app, 'PetTrackerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  synthesizer: new DefaultStackSynthesizer({
    qualifier: 'cdkfix',
  })
});

app.synth();
