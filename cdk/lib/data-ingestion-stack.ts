import * as cdk from '@aws-cdk/core';
import * as iot from '@aws-cdk/aws-iot';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';

import { CustomCertificateResource } from "./custom-certificate-resource";
import path = require("path");

export class PetTrackerDataIngestionStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
            Action: "iot:*",
            Resource: "*"
          }
        ]
      }
    });

    const trackerLambdaRole = new iam.Role(
      this,
      "PetTrackerPositionLambdaRole",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
      }
    );

    const trackerLambda = new lambda.Function(this, "PetTrackerPositionLambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "position-lambda")),
      handler: "index.handler",
      memorySize: 128,
      role: trackerLambdaRole,
      timeout: cdk.Duration.seconds(15)
    });

    const trackerLambdaAlias = new lambda.Alias(
      this,
      "PetTrackerPositionLambdaAlias",
      {
        aliasName: "PetTrackerPosition",
        version: trackerLambda.currentVersion
      }
    );

    trackerLambdaRole.addToPolicy(new iam.PolicyStatement({
      resources: [`arn:aws:logs:${props?.env?.region}:${props?.env?.account}:*`],
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
    }));

    trackerLambdaRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: [
        "appsync:Create*",
        "appsync:GraphQL",
        "appsync:Get*",
        "appsync:List*",
        "appsync:Update*",
        "appsync:Delete*"
      ]
    }));

    new iot.CfnTopicRule(
      this,
      "PetTrackerTopicRule",
      {
        topicRulePayload: {
          actions: [ 
            {
              lambda: {
                functionArn: trackerLambdaAlias.functionArn
              }
            }
          ],
          ruleDisabled: false,
          sql: "SELECT lat, long FROM 'device/+/pos'"
        },
        ruleName: "PetTrackerNotifyPosition"
      }
      );
  }
}
