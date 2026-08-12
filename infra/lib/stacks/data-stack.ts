import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { AppEnvironment, resourceName } from '../config/env';

interface DataStackProps extends cdk.StackProps {
  envConfig: AppEnvironment;
  stage: string;
}

export class DataStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // Tabla principal Single Table Design para CookingLab
    this.table = new dynamodb.Table(this, 'CookingLabTable', {
      tableName: resourceName('cookinglab-workshops', props.stage),
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.stage === 'prod',
      },
    });

    // GSI1: Listados globales ordenados por fecha de inicio (GSI1PK=WORKSHOP#ALL, GSI1SK=startAt)
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: Listados por categoría ordenados por fecha de inicio (GSI2PK=CATEGORY#<cat>, GSI2SK=startAt)
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // TODO (Fase 2): Configurar TTL para tokens temporales o registros si fuera necesario.
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
    });
  }
}
