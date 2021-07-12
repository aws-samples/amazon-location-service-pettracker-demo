import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iot from '@aws-cdk/aws-iot';
import path = require("path");

export interface PetTrackerPositionProps {
    account: string
    region: string
}


export class PetTrackerPositionLambda extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: PetTrackerPositionProps) {
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
            code: lambda.Code.fromAsset(path.join(__dirname, "position-lambda")),
            handler: "index.handler",
            memorySize: 128,
            role: trackerLambdaRole,
            timeout: cdk.Duration.seconds(15),
            tracing: lambda.Tracing.ACTIVE
        });

        trackerLambda.addEnvironment("REGION", props.region);

        const trackerLambdaAlias = new lambda.Alias(
            this,
            "PetTrackerPositionLambdaAlias",
            {
                aliasName: "PetTrackerPosition",
                version: trackerLambda.currentVersion
            }
        );

        trackerLambdaRole.addToPolicy(new iam.PolicyStatement({
            resources: [`arn:aws:logs:${props.region}:${props.account}:*`],
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
            sourceAccount: props.account,
            sourceArn: trackerTopicRule.attrArn
        });

    }
}