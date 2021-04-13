#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PetTrackerPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new PetTrackerPipelineStack(app, 'PetTrackerPipelineStack', {
    env: {
      account: '201880502539',
      region: 'eu-central-1',
    }
  });
