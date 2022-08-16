// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, StackProps, Duration, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Role,
  ServicePrincipal,
  Policy,
  PolicyDocument,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { Function, Runtime, Code, LayerVersion } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  AwsCustomResource,
  PhysicalResourceId,
  AwsCustomResourcePolicy,
} from "aws-cdk-lib/custom-resources";
import { Topic } from "aws-cdk-lib/aws-sns";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

interface FunctionsConstructProps extends StackProps {
  graphqlUrl: string;
}

export class FunctionsConstruct extends Construct {
  certificateHandlerFn: Function;
  iotSimulatorFn: Function;
  trackerUpdateFn: Function;
  appSyncUpdateFn: Function;

  constructor(scope: Construct, id: string, props: FunctionsConstructProps) {
    super(scope, id);

    const { graphqlUrl } = props;

    const awsIotLayer = new LayerVersion(this, "aws-iot-layer", {
      compatibleRuntimes: [Runtime.NODEJS_14_X, Runtime.NODEJS_16_X],
      code: Code.fromAsset("lib/layers/aws-iot"),
      description: "Bundles AWS IOT Device SDK v2",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.certificateHandlerFn = new NodejsFunction(this, "certificateHandler", {
      entry: "lib/fns/certificate-handler/src/index.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      bundling: {
        minify: true,
        target: "es2020",
        sourceMap: true,
      },
      timeout: Duration.seconds(30),
      logRetention: RetentionDays.ONE_DAY,
    });
    this.certificateHandlerFn.role?.attachInlinePolicy(
      new Policy(this, "certificateHandlerPolicy", {
        statements: [
          new PolicyStatement({
            actions: [
              "secretsmanager:CreateSecret",
              "secretsmanager:DeleteSecret",
            ],
            resources: [
              `arn:aws:secretsmanager:${Stack.of(this).region}:${
                Stack.of(this).account
              }:secret:pettracker*`,
            ],
          }),
          new PolicyStatement({
            actions: ["iot:CreateKeysAndCertificate"],
            resources: [`*`],
          }),
          new PolicyStatement({
            actions: ["iot:UpdateCertificate", "iot:DeleteCertificate"],
            resources: [
              `arn:aws:iot:${Stack.of(this).region}:${
                Stack.of(this).account
              }:cert/*`,
            ],
          }),
        ],
      })
    );

    const getIoTEndpoint = new AwsCustomResource(this, "IoTEndpoint", {
      onCreate: {
        service: "Iot",
        action: "describeEndpoint",
        physicalResourceId: PhysicalResourceId.fromResponse("endpointAddress"),
        parameters: {
          endpointType: "iot:Data-ATS",
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      installLatestAwsSdk: false,
      logRetention: RetentionDays.ONE_DAY,
    });

    const IOT_ENDPOINT = getIoTEndpoint.getResponseField("endpointAddress");

    this.iotSimulatorFn = new NodejsFunction(this, "iotSimulatorFn", {
      entry: "lib/fns/iot-simulator/src/index.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      bundling: {
        minify: true,
        target: "es2020",
        sourceMap: true,
        externalModules: ["aws-iot-device-sdk-v2"],
      },
      environment: {
        IOT_ENDPOINT: IOT_ENDPOINT,
        IOT_TOPIC: "iot/pettracker",
        IOT_CERT_SECRET_ID: "pettracker/iot-cert",
        NODE_OPTIONS: "--enable-source-maps",
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: RetentionDays.ONE_DAY,
      layers: [awsIotLayer],
    });
    this.iotSimulatorFn.role?.attachInlinePolicy(
      new Policy(this, "iotSimulatorPolicy", {
        statements: [
          new PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            resources: [
              `arn:aws:secretsmanager:${Stack.of(this).region}:${
                Stack.of(this).account
              }:secret:pettracker*`,
            ],
          }),
        ],
      })
    );

    this.trackerUpdateFn = new NodejsFunction(this, "trackerUpdateFn", {
      entry: "lib/fns/tracker-update/src/index.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      bundling: {
        minify: true,
        target: "es2020",
        sourceMap: true,
      },
      environment: {
        TRACKER_NAME: "pettracker",
        NODE_OPTIONS: "--enable-source-maps",
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: RetentionDays.ONE_DAY,
    });
    this.trackerUpdateFn.role?.attachInlinePolicy(
      new Policy(this, "trackerUpdatePolicy", {
        statements: [
          new PolicyStatement({
            actions: ["geo:BatchUpdateDevicePosition"],
            resources: [
              `arn:aws:geo:${Stack.of(this).region}:${
                Stack.of(this).account
              }:tracker/pettracker`,
            ],
          }),
        ],
      })
    );

    this.appSyncUpdateFn = new NodejsFunction(this, "appSyncUpdateFn", {
      entry: "lib/fns/appsync-update/src/index.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      bundling: {
        minify: true,
        target: "es2020",
        sourceMap: true,
      },
      environment: {
        GRAPHQL_URL: graphqlUrl,
        NODE_OPTIONS: "--enable-source-maps",
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: RetentionDays.ONE_DAY,
    });
  }
}
