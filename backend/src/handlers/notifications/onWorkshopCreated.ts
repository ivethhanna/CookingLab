import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { EventBridgeHandler } from 'aws-lambda';

type WorkshopCreatedDetail = {
  workshopId: string;
  name: string;
  startAt: string;
  category: string;
};

const sns = new SNSClient({});

export const handler: EventBridgeHandler<'WORKSHOP_CREATED', WorkshopCreatedDetail, void> = async (event) => {
  await sns.send(
    new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Message: `Nuevo taller publicado: ${event.detail.name}, inicia ${event.detail.startAt}`,
      Subject: 'Nuevo taller publicado',
    })
  );
};
