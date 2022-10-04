// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

interface FunctionsConstructProps extends StackProps {
  graphqlUrl: string;
}

export class FunctionsConstruct extends Construct {
  certificateHandlerFn: Function;
  trackerUpdateFn: Function;
  appsyncUpdatePositionFn: Function;
  appsyncSendGeofenceEventFn: Function;

  constructor(scope: Construct, id: string, props: FunctionsConstructProps) {
    super(scope, id);

    const { graphqlUrl } = props;

    const sharedConfig = {
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
      bundling: {
        minify: true,
        target: "es2020",
        sourceMap: true,
      },
      logRetention: RetentionDays.ONE_DAY,
      timeout: Duration.seconds(30),
    };

    this.certificateHandlerFn = new NodejsFunction(this, "certificateHandler", {
      entry: "lib/fns/certificate-handler/src/index.ts",
      ...sharedConfig,
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
              }:secret:*`,
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

    this.trackerUpdateFn = new NodejsFunction(this, "trackerUpdateFn", {
      entry: "lib/fns/tracker-update/src/index.ts",
      environment: {
        TRACKER_NAME: "PetTracker",
        NODE_OPTIONS: "--enable-source-maps",
      },
      memorySize: 256,
      ...sharedConfig,
    });
    this.trackerUpdateFn.role?.attachInlinePolicy(
      new Policy(this, "trackerUpdatePolicy", {
        statements: [
          new PolicyStatement({
            actions: ["geo:BatchUpdateDevicePosition"],
            resources: [
              `arn:aws:geo:${Stack.of(this).region}:${
                Stack.of(this).account
              }:tracker/PetTracker`,
            ],
          }),
        ],
      })
    );

    this.appsyncUpdatePositionFn = new NodejsFunction(
      this,
      "appsyncUpdatePositionFn",
      {
        entry: "lib/fns/appsync-update-position/src/index.ts",
        environment: {
          GRAPHQL_URL: graphqlUrl,
          NODE_OPTIONS: "--enable-source-maps",
        },
        memorySize: 256,
        ...sharedConfig,
      }
    );

    this.appsyncSendGeofenceEventFn = new NodejsFunction(
      this,
      "appsyncSendGeofenceEventFn",
      {
        entry: "lib/fns/appsync-send-geofence-event/src/index.ts",
        environment: {
          GRAPHQL_URL: graphqlUrl,
          NODE_OPTIONS: "--enable-source-maps",
        },
        memorySize: 256,
        ...sharedConfig,
      }
    );
  }
}
