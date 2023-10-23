import { CfnOutput, Duration, type StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import {
  Distribution,
  ViewerProtocolPolicy,
  ResponseHeadersPolicy,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  SecurityPolicyProtocol,
  HttpVersion,
  SSLMethod,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { NagSuppressions } from "cdk-nag";

interface WebConstructProps extends StackProps {}

export class WebConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebConstructProps) {
    super(scope, id);

    const staticAsseBucket = new Bucket(this, "web-static-assets", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    const cdn = new Distribution(this, "static-asset-cdn", {
      defaultBehavior: {
        origin: new S3Origin(staticAsseBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: new ResponseHeadersPolicy(
          this,
          "response-headers-policy",
          {
            securityHeadersBehavior: {
              contentTypeOptions: {
                override: true,
              },
              frameOptions: {
                frameOption: HeadersFrameOption.DENY,
                override: true,
              },
              referrerPolicy: {
                referrerPolicy:
                  HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                override: true,
              },
              strictTransportSecurity: {
                accessControlMaxAge: Duration.seconds(31536000), // 1 year
                includeSubdomains: true,
                preload: true,
                override: true,
              },
              xssProtection: {
                protection: true,
                modeBlock: true,
                override: true,
              },
            },
          }
        ),
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.seconds(0),
        },
      ],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      sslSupportMethod: SSLMethod.SNI,
      httpVersion: HttpVersion.HTTP2_AND_3,
    });

    // Outputs identifiers are in camelCase so that we can later normalize them to snake_case
    new CfnOutput(this, "webStaticAssetsBucketName", {
      value: staticAsseBucket.bucketName,
    });

    new CfnOutput(this, "cloudfrontDistributionId", {
      value: cdn.distributionId,
    });

    new CfnOutput(this, "cloudfrontDomainName", {
      value: `https://${cdn.distributionDomainName}`,
    });

    NagSuppressions.addResourceSuppressions(staticAsseBucket, [
      {
        id: "AwsSolutions-S1",
        reason:
          "Customers deploying the solution are responsible for providing a logging bucket to send the logs to, otherwise we will need a bucket to store the logs in, which would also need a bucket to send the logs to, and so on.",
      },
    ]);
    NagSuppressions.addResourceSuppressions(cdn, [
      {
        id: "AwsSolutions-CFR3",
        reason:
          "Customers deploying the solution are responsible for providing a logging bucket to send the logs to, otherwise we will need a bucket to store the logs in, which would also need a bucket to send the logs to, and so on.",
      },
      {
        id: "AwsSolutions-CFR1",
        reason:
          "Geo restriction is not required for this solution as the workshop is intended for customers across regions. If you are deploying this solution in a production environment, please consider enabling geo restriction.",
      },
      {
        id: "AwsSolutions-CFR2",
        reason:
          "AWS WAF is not required for this solution as the workshop is intended for customers across regions. If you are deploying this solution in a production environment, please consider adding a WAF to protect the distribution.",
      },
      {
        id: "AwsSolutions-CFR4",
        reason:
          "The solution does not require a custom SSL certificate and we are setting TLSv1.2 and SNI. If you are deploying this solution in a production environment, please consider adding a custom SSL certificate.",
      },
    ]);
  }
}
