import { StackProps, Expiration, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  GraphqlApi,
  SchemaFile,
  AuthorizationType,
  MappingTemplate,
} from "aws-cdk-lib/aws-appsync";
import { NagSuppressions } from "cdk-nag";

interface AppSyncConstructProps extends StackProps { }

export class AppSyncConstruct extends Construct {
  api: GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncConstructProps) {
    super(scope, id);

    this.api = new GraphqlApi(this, "Api", {
      name: "PetTracker",
      schema: SchemaFile.fromAsset("./lib/schema.graphql"),
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
    });

    NagSuppressions.addResourceSuppressions(this.api, [
      {
        id: "AwsSolutions-ASC3",
        reason:
          "This API is deployed as part of an AWS workshop and as such it's short-lived. Analyzing the logs is not part of the workshop.",
      },
    ]);

    const noneSource = this.api.addNoneDataSource("NoneSource");

    noneSource.createResolver('update-position-resolver', {
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

    noneSource.createResolver('send-geofence-event-resolver', {
      typeName: "Mutation",
      fieldName: "sendGeofenceEvent",
      requestMappingTemplate: MappingTemplate.fromString(`{
        "version": "2018-05-29",
        "payload": $util.toJson($context.arguments)
    }`),
      responseMappingTemplate: MappingTemplate.fromString(
        `$util.toJson($context.result.input)`
      ),
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
