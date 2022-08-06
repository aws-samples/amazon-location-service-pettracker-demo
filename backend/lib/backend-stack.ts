import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthConstruct } from "./auth-construct";
import { StorageConstruct } from "./storage-construct";
import { AppSyncConstruct } from "./api";

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { unauthRole } = new AuthConstruct(this, "authConstruct", {});

    const { table } = new StorageConstruct(this, "storageConstruct", {});

    const { api } = new AppSyncConstruct(this, "apiConstruct", {
      table,
    });

    /* api.grantMutation(unauthRole, "updatePosition");
    api.grantQuery(unauthRole); */
  }
}
