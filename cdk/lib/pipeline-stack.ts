import { Stack, StackProps, Construct, SecretValue, Stage, StageProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines';

import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codecommit from '@aws-cdk/aws-codecommit';

import { PetTrackerDataIngestionStack } from "./data-ingestion-stack";

export class PetTrackerApplication extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new PetTrackerDataIngestionStack(this, 'Database');
  }
}

export class PetTrackerPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const repo = codecommit.Repository.fromRepositoryName(
      this, 
      'ImportedRepo',
      'iot-workshop-for-pet-tracking-and-geofencing');

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      crossAccountKeys: false,
      pipelineName: 'PetTrackerPipeline',
      cloudAssemblyArtifact,

      sourceAction: new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit',
        repository: repo,
        branch: 'develop',
        output: sourceArtifact,
      }),

      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,

        subdirectory: 'cdk',
        buildCommand: 'npm install && npm run build',
      }),
    });

    pipeline.addApplicationStage(new PetTrackerApplication(this, 'Stg', {
      env: {
        account: '603611156406',
        region: 'us-east-1'
      }
    }));
  }
}