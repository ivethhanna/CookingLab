import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { AppEnvironment, resourceName } from '../config/env';

interface AuthStackProps extends cdk.StackProps {
  envConfig: AppEnvironment;
  stage: string;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    // Cognito User Pool para la autenticación de alumnos y administradores
    this.userPool = new cognito.UserPool(this, 'CookingLabUserPool', {
      userPoolName: resourceName('cookinglab-users', props.stage),
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: props.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Client para Single Page Application (React)
    this.userPoolClient = new cognito.UserPoolClient(this, 'CookingLabUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `${props.envConfig.appName}-web-client-${props.envConfig.stage}`,
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
    });

    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      groupName: 'admin',
      userPoolId: this.userPool.userPoolId,
    });

    new cognito.CfnUserPoolGroup(this, 'StudentGroup', {
      groupName: 'student',
      userPoolId: this.userPool.userPoolId,
    });

    // Los grupos se reflejan en el JWT como claim "cognito:groups"; las Lambdas deben leerlo para autorizar rutas admin, sin Lambda Authorizer separado.

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    });

    // TODO (Fase 3): Configurar Custom Lambdas triggers para enriquecimiento de JWT claims.
  }
}
