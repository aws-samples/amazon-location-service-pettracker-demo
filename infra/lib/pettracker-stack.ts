import { Stack, type StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthConstruct } from "./auth-construct.js";
import { AppSyncConstruct } from "./appsync-construct.js";
import { FunctionsConstruct } from "./functions-construct.js";
import { IotCoreConstruct } from "./iot-construct.js";
import { NagSuppressions } from "cdk-nag";

export class PetTracker extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new AuthConstruct(this, "authConstruct", {});

    const { api } = new AppSyncConstruct(this, "apiConstruct", {});

    const {
      certificateHandlerFn,
      appsyncUpdatePositionFn,
      appsyncSendGeofenceEventFn,
    } = new FunctionsConstruct(this, "functionsConstruct", {
      graphqlUrl: api.graphqlUrl,
    });
    api.grantMutation(appsyncUpdatePositionFn, "updatePosition");
    api.grantMutation(appsyncSendGeofenceEventFn, "sendGeofenceEvent");

    new IotCoreConstruct(this, "iotCoreConstruct", {
      certificateHandlerFn,
      appsyncUpdatePositionFn,
    });

    new CfnOutput(this, "AWSRegion", {
      value: Stack.of(this).region,
    });

    // Suppress selected CDK-Nag and provide reason
    [
      "/PetTracker/functionsConstruct/certificateHandler/ServiceRole/Resource",
      "/PetTracker/functionsConstruct/appsyncUpdatePositionFn/ServiceRole/Resource",
      "/PetTracker/functionsConstruct/appsyncSendGeofenceEventFn/ServiceRole/Resource",
    ].forEach((resourcePath: string) => {
      NagSuppressions.addResourceSuppressionsByPath(this, resourcePath, [
        {
          id: "AwsSolutions-IAM4",
          reason:
            "Intentionally using an AWS managed policy for AWS Lambda - AWSLambdaBasicExecutionRole",
        },
      ]);
    });

    NagSuppressions.addResourceSuppressionsByPath(
      this,
      "/PetTracker/functionsConstruct/certificateHandlerPolicy/Resource",
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "This CDK Custom resource uses an AWS Lambda function to create an AWS IoT Core certificate & store it in AWS Secrets Manager. The id of the certificate is not known before creation so the policy must have a wildcard. The name of the secret contains a `/` symbol so we are using a wildcard. In any case this function is executed only during deployment.",
        },
        {
          id: "AwsSolutions-IAM5",
          reason:
            "IAM Action iot:CreateKeysAndCertificate does not support resource-level permission. Additionally, even if it did, the id of the certificate is not known before creation time.",
        },
      ]
    );

    [
      "/PetTracker/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource",
      "/PetTracker/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource",
      "/PetTracker/iotCoreConstruct/IoTCertProvider/framework-onEvent/ServiceRole/Resource",
      "/PetTracker/iotCoreConstruct/IoTCertProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource",
      "/PetTracker/iotCoreConstruct/IoTCertProvider/framework-onEvent/Resource",
    ].forEach((resourcePath: string) => {
      let id = "AwsSolutions-L1";
      let reason = "Resource created and managed by CDK.";
      if (resourcePath.endsWith("ServiceRole/Resource")) {
        id = "AwsSolutions-IAM4";
      } else if (resourcePath.endsWith("DefaultPolicy/Resource")) {
        id = "AwsSolutions-IAM5";
        reason +=
          " This type of resource is a singleton fn that interacts with many resources so IAM policies are lax by design to allow this use case.";
      }
      NagSuppressions.addResourceSuppressionsByPath(this, resourcePath, [
        {
          id,
          reason,
        },
      ]);
    });
  }
}
