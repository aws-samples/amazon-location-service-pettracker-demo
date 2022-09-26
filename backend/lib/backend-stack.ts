import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthConstruct } from "./auth-construct";
import { StorageConstruct } from "./storage-construct";
import { AppSyncConstruct } from "./api";
import { FunctionsConstruct } from "./functions-construct";
import { IotCoreConstruct } from "./iot-construct";

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { unauthRole } = new AuthConstruct(this, "authConstruct", {});

    const { table } = new StorageConstruct(this, "storageConstruct", {});

    const { api } = new AppSyncConstruct(this, "apiConstruct", {
      table,
    });

    const { certificateHandlerFn, appSyncUpdateFn, trackerUpdateFn } =
      new FunctionsConstruct(this, "functionsConstruct", {
        graphqlUrl: api.graphqlUrl,
      });
    api.grantMutation(appSyncUpdateFn, "updatePosition");

    new IotCoreConstruct(this, "iotCoreConstruct", {
      certificateHandlerFn,
      appSyncUpdateFn,
      trackerUpdateFn,
    });
  }
}
