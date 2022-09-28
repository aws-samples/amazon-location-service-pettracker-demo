import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthConstruct } from "./auth-construct";
import { AppSyncConstruct } from "./appsync-construct";
import { FunctionsConstruct } from "./functions-construct";
import { IotCoreConstruct } from "./iot-construct";

export class PetTracker extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new AuthConstruct(this, "authConstruct", {});

    const { api } = new AppSyncConstruct(this, "apiConstruct", {});

    const {
      certificateHandlerFn,
      appsyncUpdatePositionFn,
      appsyncSendGeofenceEventFn,
      trackerUpdateFn,
    } = new FunctionsConstruct(this, "functionsConstruct", {
      graphqlUrl: api.graphqlUrl,
    });
    api.grantMutation(appsyncUpdatePositionFn, "updatePosition");
    api.grantMutation(appsyncSendGeofenceEventFn, "sendGeofenceEvent");

    new IotCoreConstruct(this, "iotCoreConstruct", {
      certificateHandlerFn,
      appsyncUpdatePositionFn,
      trackerUpdateFn,
    });

    new CfnOutput(this, "AWSRegion", {
      value: Stack.of(this).region,
    });
  }
}
