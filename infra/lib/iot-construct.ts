import { CustomResource, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CfnPolicy,
  CfnPolicyPrincipalAttachment,
  CfnThing,
  CfnThingPrincipalAttachment,
} from "aws-cdk-lib/aws-iot";
import { IotSql, TopicRule } from "@aws-cdk/aws-iot-alpha";
import {
  CloudWatchLogsAction,
  LambdaFunctionAction,
} from "@aws-cdk/aws-iot-actions-alpha";
import { Provider } from "aws-cdk-lib/custom-resources";
import { RetentionDays, LogGroup } from "aws-cdk-lib/aws-logs";
import { Function } from "aws-cdk-lib/aws-lambda";

interface IotCoreConstructProps extends StackProps {
  certificateHandlerFn: Function;
  decoderFn: Function;
}

export class IotCoreConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IotCoreConstructProps) {
    super(scope, id);

    const { certificateHandlerFn, decoderFn } = props;

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

    new TopicRule(this, "TopicRule", {
      topicRuleName: "petTrackerRule",
      sql: IotSql.fromStringAsVer20160323(`SELECT * FROM 'iot/pettracker'`),
      actions: [new LambdaFunctionAction(decoderFn)],
      errorAction: new CloudWatchLogsAction(logGroup),
    });
  }
}
