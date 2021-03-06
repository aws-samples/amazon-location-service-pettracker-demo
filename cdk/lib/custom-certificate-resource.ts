// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import cfn = require("@aws-cdk/aws-cloudformation");
import lambda = require("@aws-cdk/aws-lambda");
import cdk = require("@aws-cdk/core");
import iam = require("@aws-cdk/aws-iam");

import path = require("path");

export interface CustomCertificateResourceProps {
  account: string;
  stackName: string;
  thingName: string;
}

export class CustomCertificateResource extends cdk.Construct {
  public readonly certificateArn: string;
  public readonly certificateId: string;
  public readonly secretArn: string;
  public readonly iotEndpoint: string;

  constructor(
    scope: cdk.Construct,
    id: string,
    props: CustomCertificateResourceProps
  ) {
    super(scope, id);

    const custom_resource_lambda_role = new iam.Role(
      this,
      "CustomResourceLambdaRole",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
      }
    );

    custom_resource_lambda_role.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["lambda:InvokeFunction"]
      })
    );

    custom_resource_lambda_role.addToPolicy(
      new iam.PolicyStatement({
        resources: ["arn:aws:logs:*:*:*"],
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
      })
    );

    custom_resource_lambda_role.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["iot:*"]
      })
    );

    custom_resource_lambda_role.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: [
          "secretsmanager:CreateSecret",
          "secretsmanager:DeleteSecret",
          "secretsmanager:UpdateSecret"
        ]
      })
    );

    custom_resource_lambda_role.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["greengrass:*"]
      })
    );

    custom_resource_lambda_role.addToPolicy(
      new iam.PolicyStatement({
        resources: [
          `arn:aws:iam::${props.account}:role/${props.stackName}_ServiceRole`
        ],
        actions: [
          "iam:CreateRole",
          "iam:AttachRolePolicy",
          "iam:GetRole",
          "iam:DeleteRole",
          "iam:PassRole"
        ]
      })
    );

    const custom_certificate_resource = new cfn.CustomResource(
      this,
      "CoreCredentials",
      {
        provider: cfn.CustomResourceProvider.lambda(
          new lambda.SingletonFunction(
            this,
            "CustomCertificateResourceFunction",
            {
              uuid: "e8d4f732-4ee1-11e8-9c2d-fa7ae01bbeba",
              code: lambda.Code.fromAsset(
                path.join(__dirname, "custom-certificate-handler")
              ),
              handler: "custom-certificate-lambda.handler",
              timeout: cdk.Duration.seconds(30),
              runtime: lambda.Runtime.PYTHON_3_6,
              role: custom_resource_lambda_role
            }
          )
        ),
        properties: props
      }
    );

    this.certificateArn = custom_certificate_resource
      .getAtt("certificateArn")
      .toString();
    this.certificateId = custom_certificate_resource
      .getAtt("certificateId")
      .toString();
    this.secretArn = custom_certificate_resource.getAtt("secretArn").toString();
    this.iotEndpoint = custom_certificate_resource
      .getAtt("iotEndpoint")
      .toString();
  }
}
