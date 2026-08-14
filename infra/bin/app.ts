#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getEnvironment } from '../lib/config/env';
import { DataStack } from '../lib/stacks/data-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { EventsStack } from '../lib/stacks/events-stack';
import { FrontStack } from '../lib/stacks/front-stack';
import { ObservabilityStack } from '../lib/stacks/observability-stack';
import { CicdStack } from '../lib/stacks/cicd-stack';

const app = new cdk.App();
const envConfig = getEnvironment(app);

const env: cdk.Environment = {
  account: envConfig.account,
  region: envConfig.region,
};

const prefix = `${envConfig.appName}-${envConfig.stage}`;

// 1. Capa de Datos (DynamoDB)
const dataStack = new DataStack(app, `${prefix}-data`, { envConfig, env, stage: envConfig.stage });

// 2. Capa de Autenticación (Cognito)
const authStack = new AuthStack(app, `${prefix}-auth`, { envConfig, env, stage: envConfig.stage });

// 3. Capa de Eventos (EventBridge + SNS + SQS)
const eventsStack = new EventsStack(app, `${prefix}-events`, {
  envConfig,
  env,
  stage: envConfig.stage,
  table: dataStack.table,
});

// 4. Capa de API Gateway y Cómputo (Lambdas)
const apiStack = new ApiStack(app, `${prefix}-api`, {
  envConfig,
  env,
  stage: envConfig.stage,
  table: dataStack.table,
  userPool: authStack.userPool,
  eventBusName: eventsStack.eventBus.eventBusName,
});

// 5. Capa de Frontend y CDN (S3 + CloudFront + WAF)
new FrontStack(app, `${prefix}-front`, {
  envConfig,
  env,
  stage: envConfig.stage,
  apiUrl: apiStack.api.url,
  allowedOriginFunctions: apiStack.functions,
});

// 6. Capa de Observabilidad (CloudWatch + X-Ray)
new ObservabilityStack(app, `${prefix}-observability`, {
  envConfig,
  env,
  api: apiStack.api,
  lambdaFunctions: [...apiStack.functions, ...eventsStack.functions],
  table: dataStack.table,
  alarmTopic: eventsStack.notificationTopic,
});

// 7. Capa de CI/CD (GitHub Actions OIDC)
new CicdStack(app, `${prefix}-cicd`, {
  envConfig,
  env,
  stage: envConfig.stage,
});

app.synth();
