import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as path from 'path';
import { Construct } from 'constructs';
import { AppEnvironment, resourceName } from '../config/env';

interface EventsStackProps extends cdk.StackProps {
  envConfig: AppEnvironment;
  stage: string;
  table: dynamodb.ITable;
}

export class EventsStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;
  public readonly notificationTopic: sns.Topic;
  public readonly deadLetterQueue: sqs.Queue;
  public readonly functions: nodejs.NodejsFunction[] = [];

  constructor(scope: Construct, id: string, props: EventsStackProps) {
    super(scope, id, props);

    // Dead Letter Queue (DLQ) en SQS para procesar eventos fallidos
    this.deadLetterQueue = new sqs.Queue(this, 'CookingLabNotificationsDlq', {
      queueName: resourceName('cookinglab-notifications-dlq', props.stage),
      retentionPeriod: cdk.Duration.days(14),
    });

    // Custom EventBridge Event Bus para desacoplamiento dirigido por eventos
    this.eventBus = new events.EventBus(this, 'CookingLabEventBus', {
      eventBusName: resourceName('cookinglab-events', props.stage),
    });

    // Tópico SNS para notificaciones por email/SMS
    this.notificationTopic = new sns.Topic(this, 'CookingLabNotificationTopic', {
      topicName: resourceName('cookinglab-notifications', props.stage),
      displayName: 'CookingLab Workshop Notifications',
    });

    const projectRoot = path.join(__dirname, '../../..');
    const createNotificationHandler = (id: string, entry: string, environment: Record<string, string>) => {
      const handler = new nodejs.NodejsFunction(this, id, {
        entry: path.join(projectRoot, 'backend/src/handlers/notifications', entry),
        projectRoot,
        runtime: lambda.Runtime.NODEJS_22_X,
        tracing: lambda.Tracing.ACTIVE,
        environment,
      });
      this.functions.push(handler);
      return handler;
    };

    const onWorkshopCreatedFunction = createNotificationHandler('OnWorkshopCreatedFunction', 'onWorkshopCreated.ts', {
      TOPIC_ARN: this.notificationTopic.topicArn,
    });
    const onStudentRegisteredFunction = createNotificationHandler(
      'OnStudentRegisteredFunction',
      'onStudentRegistered.ts',
      {
        TOPIC_ARN: this.notificationTopic.topicArn,
      }
    );
    const reminderFunction = createNotificationHandler('WorkshopReminderFunction', 'reminder.ts', {
      TABLE_NAME: props.table.tableName,
      TOPIC_ARN: this.notificationTopic.topicArn,
    });

    this.notificationTopic.grantPublish(onWorkshopCreatedFunction);
    this.notificationTopic.grantPublish(onStudentRegisteredFunction);
    this.notificationTopic.grantPublish(reminderFunction);
    props.table.grantReadData(reminderFunction);

    new events.Rule(this, 'WorkshopCreatedRule', {
      eventBus: this.eventBus,
      eventPattern: {
        detailType: ['WORKSHOP_CREATED'],
      },
      targets: [
        new targets.LambdaFunction(onWorkshopCreatedFunction, {
          deadLetterQueue: this.deadLetterQueue,
          retryAttempts: 2,
        }),
      ],
    });

    new events.Rule(this, 'StudentRegisteredRule', {
      eventBus: this.eventBus,
      eventPattern: {
        detailType: ['STUDENT_REGISTERED'],
      },
      targets: [
        new targets.LambdaFunction(onStudentRegisteredFunction, {
          deadLetterQueue: this.deadLetterQueue,
          retryAttempts: 2,
        }),
      ],
    });

    new events.Rule(this, 'WorkshopReminderScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      targets: [new targets.LambdaFunction(reminderFunction)],
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
    });

    new cdk.CfnOutput(this, 'TopicArn', {
      value: this.notificationTopic.topicArn,
    });
  }
}
