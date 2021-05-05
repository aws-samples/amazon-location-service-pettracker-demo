import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iot from '@aws-cdk/aws-iot';
import path = require("path");


export interface PetTrackerALSProps {
    account: string
    region: string
}

export class PetTrackerALSLambda extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: PetTrackerALSProps) {
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
            code: lambda.Code.fromAsset(path.join(__dirname, "tracker-lambda")),
            handler: "lambda_function.lambda_handler",
            memorySize: 128,
            role: trackerLambdaRole,
            timeout: cdk.Duration.seconds(15)
        });

        trackerLambda.addEnvironment("TRACKER_NAME", "myTracker");

        const trackerLambdaAlias = new lambda.Alias(
            this,
            "PetTrackerALSLambdaAlias",
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
                                functionArn: trackerLambdaAlias.functionArn
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
            sourceArn: `arn:aws:iot:${props.region}:${props.account}:rule/${trackerTopicRule.ruleName}`
        });
    }

}