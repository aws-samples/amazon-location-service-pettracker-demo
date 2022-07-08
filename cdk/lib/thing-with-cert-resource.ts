import { Duration, Aws } from 'aws-cdk-lib';
import { CfnCustomResource } from 'aws-cdk-lib/aws-cloudformation';
import { CompositePrincipal, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_iot as iot } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ThingWithCertProps {
  readonly thingName: string;
  readonly bucket: s3.IBucket;
  readonly version: string;
}

export class ThingWithCert extends Construct {
  constructor(scope: Construct, id: string, props: ThingWithCertProps) {
    super(scope, id);


    const trackerThing = new iot.CfnThing(this, "IoTDevice", {
      thingName: "PetTrackerThing"
    });


    const lambdaExecutionRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new CompositePrincipal(new ServicePrincipal('lambda.amazonaws.com')),
    });

    lambdaExecutionRole.addToPolicy(
      new PolicyStatement({
        resources: ['arn:aws:logs:*:*:*'],
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new PolicyStatement({
        resources: ['*'],
        actions: ['iot:*'],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new PolicyStatement({
        resources: ["*"],
        actions: [
          "secretsmanager:CreateSecret",
          "secretsmanager:DeleteSecret",
          "secretsmanager:UpdateSecret"
        ]
      })
    );

    const lambdaFunction = new lambda.SingletonFunction(
      this,
      "CustomCertificateResourceFunction",
      {
        uuid: "e8d4f732-4ee1-11e8-9c2d-fa7ae01bbeba",
        code: lambda.Code.fromBucket(props.bucket, `iot-certificate-lambda-${props.version}.zip`),
        handler: 'iot-certificate.handler',
        memorySize: 256,
        timeout: Duration.seconds(30),
        runtime: lambda.Runtime.PYTHON_3_9,
        role: lambdaExecutionRole
      }
    );

    const lambdaCustomResource = new CfnCustomResource(this, 'lambdaCustomResource', {
      serviceToken: lambdaFunction.functionArn,
    });

    lambdaCustomResource.addPropertyOverride('ThingName', props.thingName);

    new iot.CfnThingPrincipalAttachment(
      this,
      "PetTrackerThingCredentialAttachment",
      {
        principal: lambdaCustomResource.getAtt('certificateArn').toString(),
        thingName: trackerThing.ref
      }
    );

    const trackerPolicy = new iot.CfnPolicy(this, "PetTrackerPolicy", {
      policyName: `${trackerThing.thingName}_Policy`,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "iot:Connect"
            ],
            Resource: [`arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:client/pettracker-*`]
          },
          {
            Effect: "Allow",
            Action: [
              "iot:Publish"
            ],
            Resource: [`arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:topic/pettracker`]
          }
        ]
      }
    });

    new iot.CfnPolicyPrincipalAttachment(this, "PetTrackerThingPolicyAttachment", {
      policyName: trackerPolicy.policyName!,
      principal: lambdaCustomResource.getAtt('certificateArn').toString()
    });

  }
}