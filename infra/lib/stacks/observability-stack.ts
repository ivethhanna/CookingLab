import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { AppEnvironment, resourceName } from '../config/env';

interface ObservabilityStackProps extends cdk.StackProps {
  envConfig: AppEnvironment;
  api: apigateway.RestApi;
  lambdaFunctions: lambda.IFunction[];
  table: dynamodb.Table;
  alarmTopic: sns.ITopic;
}

export class ObservabilityStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    const stage = props.envConfig.stage;
    const alarmAction = new actions.SnsAction(props.alarmTopic);

    this.dashboard = new cloudwatch.Dashboard(this, 'CookingLabDashboard', {
      dashboardName: resourceName('cookinglab-overview', stage),
    });

    const api5xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: resourceName('cookinglab-api-5xx-errors', stage),
      metric: props.api.metricServerError({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway returned more than 5 server errors in 5 minutes.',
    });
    api5xxAlarm.addAlarmAction(alarmAction);

    for (const [index, fn] of props.lambdaFunctions.entries()) {
      const functionId = fn.node.id;

      const errorAlarm = new cloudwatch.Alarm(this, `LambdaErrorsAlarm${index}`, {
        alarmName: resourceName(`${functionId}-errors`, stage),
        metric: fn.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 3,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `${functionId} returned more than 3 errors in 5 minutes.`,
      });
      errorAlarm.addAlarmAction(alarmAction);

      const durationAlarm = new cloudwatch.Alarm(this, `LambdaDurationAlarm${index}`, {
        alarmName: resourceName(`${functionId}-p99-duration`, stage),
        metric: fn.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'p99',
        }),
        threshold: 5000,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `${functionId} p99 duration exceeded 5 seconds in 5 minutes.`,
      });
      durationAlarm.addAlarmAction(alarmAction);
    }

    const throttleMetrics = Object.fromEntries(
      props.lambdaFunctions.map((fn, index) => [
        `m${index}`,
        fn.metricThrottles({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
      ])
    );

    const throttleExpression = new cloudwatch.MathExpression({
      expression: Object.keys(throttleMetrics).join(' + ') || '0',
      usingMetrics: throttleMetrics,
      label: 'Lambda throttles',
      period: cdk.Duration.minutes(5),
    });

    const lambdaThrottleAlarm = new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: resourceName('cookinglab-lambda-throttles', stage),
      metric: throttleExpression,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'At least one Lambda throttle occurred in 5 minutes.',
    });
    lambdaThrottleAlarm.addAlarmAction(alarmAction);

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API TPS',
        left: [
          props.api.metricCount({
            period: cdk.Duration.minutes(1),
            statistic: 'Sum',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Latency P95',
        left: [
          props.api.metricLatency({
            period: cdk.Duration.minutes(5),
            statistic: 'p95',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Error Rate',
        left: [
          props.api.metricClientError({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
          }),
          props.api.metricServerError({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Consumed Capacity',
        left: [
          props.table.metricConsumedReadCapacityUnits({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
          }),
          props.table.metricConsumedWriteCapacityUnits({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Average Duration',
        left: props.lambdaFunctions.map((fn) =>
          fn.metricDuration({
            period: cdk.Duration.minutes(5),
            statistic: 'Average',
          })
        ),
      })
    );

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
    });
  }
}
