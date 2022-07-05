// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { aws_lambda as lambda } from "aws-cdk-lib";
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from "aws-cdk-lib";
import { custom_resources } from "aws-cdk-lib";

import path = require("path");

export interface CustomCertificateResourceProps {
  account: string;
  stackName: string;
  thingName: string;
}

export class CustomCertificateResource extends Construct {
  public readonly certificateArn: string;
  public readonly certificateId: string;
  public readonly secretArn: string;
  public readonly iotEndpoint: string;

  constructor(
    scope: Construct,
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

    const fn = new lambda.SingletonFunction(
      this,
      "CustomCertificateResourceFunction",
      {
        uuid: "e8d4f732-4ee1-11e8-9c2d-fa7ae01bbeba",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "custom-certificate-handler")
        ),
        handler: "custom-certificate-lambda.handler",
        timeout: cdk.Duration.seconds(30),
        runtime: lambda.Runtime.PYTHON_3_7,
        role: custom_resource_lambda_role
      }
    );

    const provider = new custom_resources.Provider(
      this,
      'CustomCertificateResourceProvider',
      {
        onEventHandler: fn
      }
    );

    const custom_certificate_resource = new cdk.CustomResource(
      this,
      "CoreCredentials",
      {
        serviceToken: provider.serviceToken,
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
