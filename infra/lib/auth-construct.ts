import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IRole, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { IdentityPool } from "@aws-cdk/aws-cognito-identitypool-alpha";
import { NagSuppressions } from "cdk-nag";

interface AuthConstructProps extends StackProps {}

export class AuthConstruct extends Construct {
  unauthRole: IRole;

  constructor(scope: Construct, id: string, _props: AuthConstructProps) {
    super(scope, id);

    const identityPool = new IdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: true,
    });
    const { unauthenticatedRole, identityPoolId } = identityPool;

    NagSuppressions.addResourceSuppressions(identityPool, [
      {
        id: "AwsSolutions-COG7",
        reason:
          "Application uses unauthenticated access (i.e. guest) only, so this setting is needed.",
      },
    ]);

    this.unauthRole = unauthenticatedRole;
    this.unauthRole.attachInlinePolicy(
      new Policy(this, "locationService", {
        statements: [
          new PolicyStatement({
            actions: [
              "geo:GetMapGlyphs",
              "geo:GetMapSprites",
              "geo:GetMapStyleDescriptor",
              "geo:GetMapTile",
            ],
            resources: [
              `arn:aws:geo:${Stack.of(this).region}:${
                Stack.of(this).account
              }:map/PetTrackerMap`,
            ],
          }),
          new PolicyStatement({
            actions: [
              "geo:ListGeofences",
              "geo:BatchPutGeofence",
              "geo:BatchDeleteGeofence",
            ],
            resources: [
              `arn:aws:geo:${Stack.of(this).region}:${
                Stack.of(this).account
              }:geofence-collection/PetTrackerGeofenceCollection`,
            ],
          }),
          new PolicyStatement({
            actions: ["geo:CalculateRoute"],
            resources: [
              `arn:aws:geo:${Stack.of(this).region}:${
                Stack.of(this).account
              }:route-calculator/PetTrackerRouteCalculator`,
            ],
          }),
        ],
      })
    );

    new CfnOutput(this, "IdentityPoolId", {
      value: identityPoolId,
    });
  }
}
