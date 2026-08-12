import * as cdk from 'aws-cdk-lib';

export interface AppEnvironment {
  stage: string;
  appName: string;
  account: string;
  region: string;
}

export function resourceName(base: string, stage: string): string {
  return `${base}-${stage}`;
}

export function getEnvironment(app: cdk.App): AppEnvironment {
  const stage = app.node.tryGetContext('stage') || 'dev';
  
  return {
    stage,
    appName: 'cookinglab',
    account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  };
}
