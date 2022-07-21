// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { aws_iot as iot} from 'aws-cdk-lib';
import { aws_lambda as lambda } from "aws-cdk-lib";
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_s3 as s3 } from 'aws-cdk-lib';

import path = require("path");


export interface PetTrackerALSProps {
    readonly trackerName: string;
    readonly bucket: s3.IBucket;
    readonly version: string;
}

export class PetTrackerALSLambda extends Construct {

    constructor(scope: Construct, id: string, props: PetTrackerALSProps) {
        super(scope, id);

        const trackerLambdaRole = new iam.Role(
            this,
            "PetTrackerALSLambdaRole",
            {
                assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
            }
        );

        const trackerLambda = new lambda.Function(this, "PetTrackerPositionLambda", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromBucket(props.bucket, `tracker-lambda-${props.version}.zip`),
            handler: "lambda_function.lambda_handler",
            memorySize: 128,
            role: trackerLambdaRole,
            timeout: cdk.Duration.seconds(15)
        });

        

        const trackerLambdaAlias = new lambda.Alias(
            this,
            "PetTrackerALSLambdaAlias",
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
            resources: ['arn:aws:geo:*:*:tracker/*'],
            actions: [
                "geo:BatchUpdateDevicePosition"
            ],
        }));

        const trackerTopicRule = new iot.CfnTopicRule(
            this,
            "PetTrackerALSTopicRule",
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