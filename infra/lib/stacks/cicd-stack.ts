import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { AppEnvironment, resourceName } from '../config/env';

interface CicdStackProps extends cdk.StackProps {
  envConfig: AppEnvironment;
  stage: string;
}

export class CicdStack extends cdk.Stack {
  public readonly githubActionsRole: iam.Role;

  constructor(scope: Construct, id: string, props: CicdStackProps) {
    super(scope, id, props);

    const githubProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'GitHubActionsOidcProvider',
      `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`
    );

    this.githubActionsRole = new iam.Role(this, 'GitHubActionsRole', {
      roleName: resourceName('cookinglab-github-actions', props.stage),
      assumedBy: new iam.FederatedPrincipal(
        githubProvider.openIdConnectProviderArn,
        {
          StringLike: {
            'token.actions.githubusercontent.com:sub': 'repo:ivethhanna@83737339/CookingLab@1332396188:*',
          },
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    // Academic shortcut: use AdministratorAccess for this project. In a real production environment,
    // restrict this role to the specific services needed by deployment, such as CloudFormation, S3,
    // Lambda, DynamoDB, Cognito, API Gateway, and IAM PassRole.
    this.githubActionsRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));

    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: this.githubActionsRole.roleArn,
    });
  }
}
