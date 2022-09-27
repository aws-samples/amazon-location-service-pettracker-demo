import { StackProps, Expiration, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  GraphqlApi,
  Schema,
  AuthorizationType,
  MappingTemplate,
  FieldLogLevel,
} from "@aws-cdk/aws-appsync-alpha";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import {
  Role,
  ServicePrincipal,
  PolicyDocument,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { join } from "path";

interface AppSyncConstructProps extends StackProps {
  table: ITable;
}

export class AppSyncConstruct extends Construct {
  api: GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncConstructProps) {
    super(scope, id);

    const { table } = props;

    this.api = new GraphqlApi(this, "Api", {
      name: "PetTracker",
      schema: Schema.fromAsset(join(__dirname, "schema.graphql")),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: Expiration.after(Duration.days(365)),
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: AuthorizationType.IAM,
          },
        ],
      },
      logConfig: {
        excludeVerboseContent: false,
        fieldLogLevel: FieldLogLevel.ALL,
        role: new Role(this, "LogRole", {
          assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
          inlinePolicies: {
            stuff: new PolicyDocument({
              statements: [
                new PolicyStatement({
                  actions: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                  ],
                  resources: ["*"],
                }),
              ],
            }),
          },
        }),
      },
    });

    const dynamoDBSource = this.api.addDynamoDbDataSource(
      "PetTrackerSource",
      table
    );
    const noneSource = this.api.addNoneDataSource("NoneSource");

    noneSource.createResolver({
      typeName: "Mutation",
      fieldName: "updatePosition",
      requestMappingTemplate: MappingTemplate.fromString(`{
        "version": "2018-05-29",
        "payload": $util.toJson($context.arguments)
    }`),
      responseMappingTemplate: MappingTemplate.fromString(
        `$util.toJson($context.result.input)`
      ),
    });

    dynamoDBSource.createResolver({
      typeName: "Query",
      fieldName: "getPosition",
      requestMappingTemplate: MappingTemplate.dynamoDbGetItem("id", "id"),
      responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
    });

    dynamoDBSource.createResolver({
      typeName: "Query",
      fieldName: "listPositions",
      requestMappingTemplate: MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
    });

    new CfnOutput(this, "ApiUrl", {
      value: this.api.graphqlUrl,
    });

    new CfnOutput(this, "ApiId", {
      value: this.api.apiId,
    });

    new CfnOutput(this, "ApiKey", {
      value: this.api.apiKey as string,
    });
  }
}
