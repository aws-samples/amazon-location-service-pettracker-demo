import cfn = require("@aws-cdk/aws-cloudformation");
import lambda = require("@aws-cdk/aws-lambda");
import cdk = require("@aws-cdk/core");
import iam = require("@aws-cdk/aws-iam");

import path = require("path");

export interface CustomTrackerResourceProps {
    account: string;
    region: string;
    trackerName: string;
}

export class CustomTrackerResource extends cdk.Construct {
    public readonly trackerArn: string;
    public readonly trackerName: string;

    constructor(
        scope: cdk.Construct,
        id: string,
        props: CustomTrackerResourceProps
    ) {
        super(scope, id);

        const customResourceLambdaRole = new iam.Role(
            this,
            "PetTrackerResourceLambdaRole",
            {
                assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
            }
        );

        customResourceLambdaRole.addToPolicy(
            new iam.PolicyStatement({
                resources: ["*"],
                actions: ["lambda:InvokeFunction"]
            })
        );

        customResourceLambdaRole.addToPolicy(
            new iam.PolicyStatement({
                resources: [`arn:aws:logs:${props.region}:${props.account}:*`],
                actions: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ]
            })
        );

        customResourceLambdaRole.addToPolicy(new iam.PolicyStatement({
            resources: ['arn:aws:geo:*:*:tracker/*'],
            actions: [
                "geo:CreateTracker",
                "geo:DeleteTracker",
                "geo:DescribeTracker",
                "geo:ListTrackers"
            ],
        }));

        const customCertificateResource = new cfn.CustomResource(
            this,
            "CoreCredentials",
            {
                provider: cfn.CustomResourceProvider.lambda(
                    new lambda.SingletonFunction(
                        this,
                        "CustomTrackerResourceFunction",
                        {
                            uuid: "0cf8709c-ae43-11eb-8529-0242ac130003",
                            code: lambda.Code.fromAsset(
                                path.join(__dirname, "custom-tracker-handler")
                            ),
                            handler: "custom-tracker-lambda.handler",
                            timeout: cdk.Duration.seconds(30),
                            runtime: lambda.Runtime.PYTHON_3_6,
                            role: customResourceLambdaRole
                        }
                    )
                ),
                properties: props
            }
        );

        this.trackerArn = customCertificateResource
            .getAtt("trackerArn")
            .toString();
        this.trackerName = customCertificateResource
            .getAtt("trackerName")
            .toString();

    }

}