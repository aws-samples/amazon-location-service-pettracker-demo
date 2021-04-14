#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PetTrackerPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new PetTrackerPipelineStack(app, 'PetTrackerStack', {
    env: {
      account: '603611156406',
      region: 'us-east-1',
    }
  });

  app.synth();
