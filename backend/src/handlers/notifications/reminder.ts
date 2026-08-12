import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ScheduledHandler } from 'aws-lambda';
import { Registration, Workshop } from '../../../../shared/types';
import { docClient, makeKeys, TABLE_NAME } from '../../lib/dynamo';

type WorkshopItem = Workshop & {
  PK: string;
  SK: string;
};

type RegistrationItem = Registration & {
  PK: string;
  SK: string;
};

const sns = new SNSClient({});

export const handler: ScheduledHandler = async () => {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  let remindersSent = 0;

  const workshopsResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK BETWEEN :from AND :to',
      ExpressionAttributeValues: {
        ':pk': makeKeys.workshopGsi1().GSI1PK,
        ':from': now.toISOString(),
        ':to': in24Hours.toISOString(),
      },
      ScanIndexForward: true,
    })
  );

  const workshops = (workshopsResult.Items ?? []) as WorkshopItem[];

  for (const workshop of workshops) {
    const registrationsResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': makeKeys.workshop(workshop.id).PK,
          ':skPrefix': 'REG#',
        },
      })
    );

    const registrations = (registrationsResult.Items ?? []) as RegistrationItem[];

    for (const registration of registrations) {
      await sns.send(
        new PublishCommand({
          TopicArn: process.env.TOPIC_ARN,
          Message: `Recordatorio: tu taller ${workshop.name} empieza en menos de 24h`,
          Subject: 'Recordatorio de taller',
          MessageAttributes: {
            userId: {
              DataType: 'String',
              StringValue: registration.userId,
            },
          },
        })
      );
      remindersSent += 1;
    }
  }

  console.log('Workshop reminders sent', { count: remindersSent });
};
