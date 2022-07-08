// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { aws_iot as iot} from 'aws-cdk-lib';
import { aws_lambda as lambda } from "aws-cdk-lib";
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_s3 as s3 } from 'aws-cdk-lib';

import path = require("path");

export interface PetTrackerPositionProps {
    readonly bucket: s3.IBucket;
    readonly version: string;
}


export class PetTrackerPositionLambda extends Construct {

    constructor(scope: Construct, id: string, props: PetTrackerPositionProps) {
        super(scope, id);

        const trackerLambdaRole = new iam.Role(
            this,
            "PetTrackerPositionLambdaRole",
            {
                assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
            }
        );

        const trackerLambda = new lambda.Function(this, "PetTrackerPositionLambda", {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromBucket(props.bucket, `position-lambda-${props.version}.zip`),
            handler: "index.handler",
            memorySize: 128,
            role: trackerLambdaRole,
            timeout: cdk.Duration.seconds(15),
            tracing: lambda.Tracing.ACTIVE
        });

        trackerLambda.addEnvironment("REGION", cdk.Aws.REGION);

        const trackerLambdaAlias = new lambda.Alias(
            this,
            "PetTrackerPositionLambdaAlias",
            {
                aliasName: "PetTrackerPosition",
                version: trackerLambda.currentVersion
            }
        );

        trackerLambdaRole.addToPolicy(new iam.PolicyStatement({
            resources: [`arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`],
            actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ]
        }));

        trackerLambdaRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                "appsync:GraphQL",
                "ssm:GetParameters",
                "ssm:GetParameter"
            ]
        }));

        const trackerTopicRule = new iot.CfnTopicRule(
            this,
            "PetTrackerTopicRule",
            {
                topicRulePayload: {
                    actions: [
                        {
                            lambda: {
                                functionArn: trackerLambda.functionArn
                            }
                        }
                    ],
                    ruleDisabled: false,
                    sql: "SELECT * FROM 'pettracker'"
                }
            }
        );

        trackerLambda.addPermission("PetTrackerPositionLambdaPermission", {
            principal: new iam.ServicePrincipal("iot.amazonaws.com"),
            sourceAccount: cdk.Aws.ACCOUNT_ID,
            sourceArn: trackerTopicRule.attrArn
        });

    }
}