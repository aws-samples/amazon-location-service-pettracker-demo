import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codecommit from '@aws-cdk/aws-codecommit';

import path = require("path");

export class PetTrackerWebAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = props?.env?.region || 'us-east-1'
    const account = props?.env?.account || ''

    const amplifyInit = new codebuild.PipelineProject(this, 'AmplifyInit', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'cd web',
              'npm install -g @aws-amplify/cli',
              'npm install',
            ],
          },
          build: {
            commands: [
              'cd web',
              'amplify init --amplify $AMPLIFY --frontend $FRONTEND --providers $PROVIDERS --yes',
              'amplify publish --yes'
            ]
          },
        },
        artifacts: {
          'base-directory': 'web',
          files: [
            'amplify/**/*',
          ],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
        environmentVariables: {
          AMPLIFY: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT, 
            value: '{\
              \"projectName\":\"pettracker\",\
              \"envName\":\"dev\",\
              \"defaultEditor\":\"code\"\
              }'
          },
          FRONTEND: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT, 
            value: '{\
              \"frontend\":\"javascript\",\
              \"framework\":\"react\",\
              \"config\":{\
                \"SourceDir\":\"src\",\
                \"DistributionDir\":\"build\",\
                \"BuildCommand\":\"npm run-script build\",\
                \"StartCommand\":\"npm run-script start\"\
                }\
              }'
          },
          PROVIDERS: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT, 
            value: '{\
              \"awscloudformation\":{\
                \"configLevel\":\"project\",\
                \"useProfile\":true,\
                \"profileName\":\"default\"\
                }\
              }'
          }
        }
      },
    });

    const repo = codecommit.Repository.fromRepositoryName(
      this, 
      'ImportedRepo',
      'iot-workshop-for-pet-tracking-and-geofencing');

    const sourceOutput = new codepipeline.Artifact();
    const amplifyOutput = new codepipeline.Artifact('AmplifyOutput');    

    new codepipeline.Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'Amplify_Source',
              branch: 'develop',
              repository: repo,
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Amplify_Deploy',
              project: amplifyInit,
              input: sourceOutput,
              outputs: [amplifyOutput],
            })
          ],
        }
      ],
    });

  }
}