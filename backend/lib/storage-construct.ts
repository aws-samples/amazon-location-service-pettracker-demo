import {
  CfnOutput,
  Duration,
  Expiration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  Table,
  ITable,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface StorageConstructProps extends StackProps {}

export class StorageConstruct extends Construct {
  table: ITable;

  constructor(scope: Construct, id: string, _props: StorageConstructProps) {
    super(scope, id);

    this.table = new Table(this, "TodoTable", {
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
    });
  }
}
