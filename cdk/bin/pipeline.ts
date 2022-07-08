#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PetTrackerDataIngestionStack } from '../lib/data-ingestion-stack';

const app = new cdk.App();

new PetTrackerDataIngestionStack(app, 'PetTrackerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  })
});
