import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DomainEventName } from '../../../shared/types';

const eventBridge = new EventBridgeClient({});

export async function publishEvent(
  eventBusName: string,
  detailType: DomainEventName,
  detail: Record<string, unknown>
): Promise<void> {
  try {
    await eventBridge.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: eventBusName,
            Source: 'cookinglab.api',
            DetailType: detailType,
            Detail: JSON.stringify(detail),
          },
        ],
      })
    );
  } catch (err) {
    console.error('Failed to publish domain event', {
      detailType,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
