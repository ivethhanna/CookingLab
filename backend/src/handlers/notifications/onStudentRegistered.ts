import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { EventBridgeHandler } from 'aws-lambda';

type StudentRegisteredDetail = {
  workshopId: string;
  userId: string;
  registeredAt: string;
};

const sns = new SNSClient({});

export const handler: EventBridgeHandler<'STUDENT_REGISTERED', StudentRegisteredDetail, void> = async (event) => {
  await sns.send(
    new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Message: `Confirmacion de inscripcion al taller ${event.detail.workshopId}`,
      Subject: 'Confirmacion de inscripcion',
    })
  );
};
