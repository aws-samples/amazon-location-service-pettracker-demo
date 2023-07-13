import { CustomResource, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CfnPolicy,
  CfnPolicyPrincipalAttachment,
  CfnThing,
  CfnThingPrincipalAttachment,
  CfnTopicRule,
} from "aws-cdk-lib/aws-iot";
import { Provider } from "aws-cdk-lib/custom-resources";
import { RetentionDays, LogGroup } from "aws-cdk-lib/aws-logs";
import { Function } from "aws-cdk-lib/aws-lambda";
import {
  Role,
  ServicePrincipal,
  PolicyDocument,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";

interface IotCoreConstructProps extends StackProps {
  certificateHandlerFn: Function;
  appsyncUpdatePositionFn: Function;
}

export class IotCoreConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IotCoreConstructProps) {
    super(scope, id);

    const { certificateHandlerFn } = props;

    const provider = new Provider(this, "IoTCertProvider", {
      onEventHandler: certificateHandlerFn,
      logRetention: RetentionDays.ONE_DAY,
    });

    const certificate = new CustomResource(this, "AWS:IoTCert", {
      serviceToken: provider.serviceToken,
    });

    // Create an IoT Core Policy
    const policy = new CfnPolicy(this, "Policy", {
      policyName: "pettracker-policy",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: "iot:Connect",
            Resource: `arn:aws:iot:${Stack.of(this).region}:${
              Stack.of(this).account
            }:client/pettracker`,
          },
          {
            Effect: "Allow",
            Action: "iot:Publish",
            Resource: `arn:aws:iot:${Stack.of(this).region}:${
              Stack.of(this).account
            }:topic/iot/pettracker`,
          },
        ],
      },
    });

    const policyPrincipalAttachment = new CfnPolicyPrincipalAttachment(
      this,
      "MyCfnPolicyPrincipalAttachment",
      {
        policyName: policy.policyName as string,
        principal: `arn:aws:iot:${Stack.of(this).region}:${
          Stack.of(this).account
        }:cert/${certificate.getAttString("certificateId")}`,
      }
    );
    policyPrincipalAttachment.addDependency(policy);

    // Create an IoT Core Thing
    const thing = new CfnThing(this, "Thing", {
      thingName: "pettracker",
    });

    // Attach the certificate to the IoT Core Thing
    const thingPrincipalAttachment = new CfnThingPrincipalAttachment(
      this,
      "MyCfnThingPrincipalAttachment",
      {
        principal: `arn:aws:iot:${Stack.of(this).region}:${
          Stack.of(this).account
        }:cert/${certificate.getAttString("certificateId")}`,
        thingName: thing.thingName as string,
      }
    );
    thingPrincipalAttachment.addDependency(thing);

    // CloudWatch Role for IoT Core error logging
    const logGroup = new LogGroup(this, "ErrorLogGroup", {
      retention: RetentionDays.ONE_DAY,
    });

    // IAM Role for AWS IoT Core to publish to Location Service
    const role = new Role(this, "IotTrackerRole", {
      assumedBy: new ServicePrincipal("iot.amazonaws.com"),
      description: "IAM Role that allows IoT Core to update a Tracker",
      inlinePolicies: {
        allowTracker: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: [
                `arn:aws:geo:${Stack.of(this).region}:${
                  Stack.of(this).account
                }:tracker/PetTracker`,
              ],
              actions: ["geo:BatchUpdateDevicePosition"],
            }),
          ],
        }),
      },
    });
    logGroup.grantWrite(role);

    // Create an IoT Core Topic Rule that sends IoT Core updates to Location Service
    new CfnTopicRule(this, "TopicRule", {
      ruleName: "petTrackerRule",
      topicRulePayload: {
        sql: `SELECT * FROM 'iot/pettracker'`,
        awsIotSqlVersion: "2016-03-23",
        actions: [
          {
            location: {
              deviceId: "${deviceId}",
              latitude: "${longitude}",
              longitude: "${latitude}",
              roleArn: role.roleArn,
              trackerName: "PetTracker",
            },
          },
        ],
        errorAction: {
          cloudwatchLogs: {
            logGroupName: logGroup.logGroupName,
            roleArn: role.roleArn,
          },
        },
      },
    });
  }
}
