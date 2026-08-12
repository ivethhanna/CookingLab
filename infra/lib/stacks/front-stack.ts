import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as path from 'path';
import { Construct } from 'constructs';
import { AppEnvironment, resourceName } from '../config/env';

interface FrontStackProps extends cdk.StackProps {
  envConfig: AppEnvironment;
  stage: string;
  apiUrl: string;
  allowedOriginFunctions: lambda.IFunction[];
}

export class FrontStack extends cdk.Stack {
  public readonly websiteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontStackProps) {
    super(scope, id, props);

    // Bucket S3 privado para hosting estático del Frontend
    this.websiteBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `${props.envConfig.appName}-frontend-${props.stage}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.stage !== 'prod',
    });

    const apiDomainName = cdk.Fn.select(2, cdk.Fn.split('/', props.apiUrl));

    const webAcl = new wafv2.CfnWebACL(this, 'CloudFrontWebAcl', {
      name: resourceName('cookinglab-waf', props.stage),
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: resourceName('cookinglab-waf', props.stage),
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRules',
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRules',
          },
        },
      ],
    });

    this.distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(apiDomainName, {
            originPath: `/${props.stage}`,
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      webAclId: webAcl.attrArn,
    });

    const allowedOriginUpdater = new lambda.Function(this, 'AllowedOriginUpdater', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(2),
      code: lambda.Code.fromInline(`
const { LambdaClient, GetFunctionConfigurationCommand, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const client = new LambdaClient({});

exports.handler = async (event) => {
  if (event.RequestType === 'Delete') {
    return { PhysicalResourceId: event.PhysicalResourceId ?? 'AllowedOriginUpdater' };
  }

  const functionNames = event.ResourceProperties.FunctionNames ?? [];
  const allowedOrigin = event.ResourceProperties.AllowedOrigin;

  for (const functionName of functionNames) {
    const current = await client.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
    await client.send(new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Environment: {
        Variables: {
          ...(current.Environment?.Variables ?? {}),
          ALLOWED_ORIGIN: allowedOrigin,
        },
      },
    }));
  }

  return { PhysicalResourceId: 'AllowedOriginUpdater' };
};
`),
    });

    allowedOriginUpdater.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['lambda:GetFunctionConfiguration', 'lambda:UpdateFunctionConfiguration'],
        resources: props.allowedOriginFunctions.map((fn) => fn.functionArn),
      })
    );

    const allowedOriginProvider = new cr.Provider(this, 'AllowedOriginProvider', {
      onEventHandler: allowedOriginUpdater,
    });

    new cdk.CustomResource(this, 'AllowedOriginConfiguration', {
      serviceToken: allowedOriginProvider.serviceToken,
      properties: {
        FunctionNames: props.allowedOriginFunctions.map((fn) => fn.functionName),
        AllowedOrigin: `https://${this.distribution.distributionDomainName}`,
      },
    });

    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../../frontend/dist'))],
      destinationBucket: this.websiteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.websiteBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: this.distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: webAcl.attrArn,
    });
  }
}
