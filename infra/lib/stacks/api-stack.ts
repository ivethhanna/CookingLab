import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import { AppEnvironment, resourceName } from '../config/env';

interface ApiStackProps extends cdk.StackProps {
  envConfig: AppEnvironment;
  stage: string;
  table: dynamodb.ITable;
  userPool: cognito.IUserPool;
  eventBusName: string;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;
  public readonly functions: nodejs.NodejsFunction[] = [];

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // API Gateway REST API
    this.api = new apigateway.RestApi(this, 'CookingLabApi', {
      restApiName: resourceName('cookinglab-api', props.stage),
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
      deployOptions: {
        stageName: props.stage,
        tracingEnabled: true,
      },
    });

    // Cognito JWT Authorizer para metodos protegidos.
    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
      authorizerName: `${props.envConfig.appName}-cognito-authorizer`,
      identitySource: 'method.request.header.Authorization',
    });

    const eventBus = events.EventBus.fromEventBusName(this, 'CookingLabEventBus', props.eventBusName);
    const projectRoot = path.join(__dirname, '../../..');
    const createHandler = (id: string, entry: string, environment?: Record<string, string>) => {
      const handler = new nodejs.NodejsFunction(this, id, {
        entry: path.join(projectRoot, 'backend/src/handlers', entry),
        projectRoot,
        runtime: lambda.Runtime.NODEJS_22_X,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          TABLE_NAME: props.table.tableName,
          ...environment,
        },
      });
      this.functions.push(handler);
      return handler;
    };

    const healthFunction = createHandler('HealthFunction', 'health.ts');
    const listWorkshopsFunction = createHandler('ListWorkshopsFunction', 'workshops/list.ts');
    const getWorkshopByIdFunction = createHandler('GetWorkshopByIdFunction', 'workshops/getById.ts');
    const createWorkshopFunction = createHandler('CreateWorkshopFunction', 'workshops/create.ts', {
      EVENT_BUS_NAME: props.eventBusName,
    });
    const updateWorkshopFunction = createHandler('UpdateWorkshopFunction', 'workshops/update.ts');
    const removeWorkshopFunction = createHandler('RemoveWorkshopFunction', 'workshops/remove.ts');
    const registerWorkshopFunction = createHandler('RegisterWorkshopFunction', 'registrations/register.ts', {
      EVENT_BUS_NAME: props.eventBusName,
    });

    props.table.grantReadData(listWorkshopsFunction);
    props.table.grantReadData(getWorkshopByIdFunction);
    props.table.grantReadWriteData(createWorkshopFunction);
    props.table.grantReadWriteData(updateWorkshopFunction);
    props.table.grantReadWriteData(removeWorkshopFunction);
    props.table.grantReadWriteData(registerWorkshopFunction);
    eventBus.grantPutEventsTo(createWorkshopFunction);
    eventBus.grantPutEventsTo(registerWorkshopFunction);

    // Recursos de API Gateway
    const healthResource = this.api.root.addResource('healthz');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(healthFunction));

    const workshopsResource = this.api.root.addResource('workshops');
    
    // GET /workshops (publico)
    workshopsResource.addMethod('GET', new apigateway.LambdaIntegration(listWorkshopsFunction));

    // POST /workshops (requiere auth Admin)
    workshopsResource.addMethod('POST', new apigateway.LambdaIntegration(createWorkshopFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const singleWorkshopResource = workshopsResource.addResource('{id}');
    // GET /workshops/{id}
    singleWorkshopResource.addMethod('GET', new apigateway.LambdaIntegration(getWorkshopByIdFunction));
    // PUT /workshops/{id}
    singleWorkshopResource.addMethod('PUT', new apigateway.LambdaIntegration(updateWorkshopFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    // DELETE /workshops/{id}
    singleWorkshopResource.addMethod('DELETE', new apigateway.LambdaIntegration(removeWorkshopFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Registrations endpoint
    const registrationsResource = singleWorkshopResource.addResource('register');
    // POST /workshops/{id}/register
    registrationsResource.addMethod('POST', new apigateway.LambdaIntegration(registerWorkshopFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
    });

    new cdk.CfnOutput(this, 'RestApiId', {
      value: this.api.restApiId,
    });
  }

  public setAllowedOrigin(origin: string): void {
    for (const fn of this.functions) {
      fn.addEnvironment('ALLOWED_ORIGIN', origin);
    }
  }
}
