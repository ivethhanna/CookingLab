import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Registration, Workshop, WorkshopInput } from '../../../shared/types';

const client = new DynamoDBClient({});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: true,
  },
});

export const TABLE_NAME = process.env.TABLE_NAME || 'cookinglab-table-dev';

/**
 * Helpers para la construcción de claves DynamoDB (Single Table Design)
 */
export const makeKeys = {
  workshop: (id: string) => ({
    PK: `WORKSHOP#${id}`,
    SK: 'META',
  }),
  workshopGsi1: () => ({
    GSI1PK: 'WORKSHOP#ALL',
  }),
  workshopGsi2: (category: string) => ({
    GSI2PK: `CATEGORY#${category.toUpperCase()}`,
  }),
  registration: (workshopId: string, userId: string) => ({
    PK: `WORKSHOP#${workshopId}`,
    SK: `REG#USER#${userId}`,
  }),
  user: (id: string) => ({
    PK: `USER#${id}`,
    SK: 'META',
  }),
};

type DynamoWorkshopItem = Workshop & {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
};

function encodeNextToken(key?: Record<string, unknown>): string | undefined {
  return key ? Buffer.from(JSON.stringify(key), 'utf8').toString('base64') : undefined;
}

function decodeNextToken(token?: string): Record<string, unknown> | undefined {
  return token ? JSON.parse(Buffer.from(token, 'base64').toString('utf8')) : undefined;
}

function toWorkshop(item?: Record<string, unknown>): Workshop | undefined {
  if (!item) {
    return undefined;
  }

  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...workshop } = item;
  void PK;
  void SK;
  void GSI1PK;
  void GSI1SK;
  void GSI2PK;
  void GSI2SK;
  return workshop as unknown as Workshop;
}

export async function getWorkshop(id: string): Promise<Workshop | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: makeKeys.workshop(id),
    })
  );

  return toWorkshop(result.Item);
}

export async function listWorkshops(
  limit?: number,
  nextToken?: string,
  category?: string
): Promise<{ items: Workshop[]; nextToken?: string }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: category ? 'GSI2' : 'GSI1',
      KeyConditionExpression: category ? 'GSI2PK = :pk' : 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': category ? makeKeys.workshopGsi2(category).GSI2PK : makeKeys.workshopGsi1().GSI1PK,
      },
      Limit: limit,
      ExclusiveStartKey: decodeNextToken(nextToken),
      ScanIndexForward: true,
    })
  );

  return {
    items: (result.Items ?? []).map((item) => toWorkshop(item)).filter((item): item is Workshop => Boolean(item)),
    nextToken: encodeNextToken(result.LastEvaluatedKey),
  };
}

export async function putWorkshop(workshop: Workshop): Promise<void> {
  const item: DynamoWorkshopItem = {
    ...workshop,
    ...makeKeys.workshop(workshop.id),
    ...makeKeys.workshopGsi1(),
    GSI1SK: workshop.startAt,
    ...makeKeys.workshopGsi2(workshop.category),
    GSI2SK: workshop.startAt,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

export async function updateWorkshop(id: string, patch: Partial<WorkshopInput>): Promise<Workshop | undefined> {
  const now = new Date().toISOString();
  const updateValues: Record<string, unknown> = {
    ...patch,
    updatedAt: now,
  };

  if (patch.category) {
    updateValues.GSI2PK = makeKeys.workshopGsi2(patch.category).GSI2PK;
  }

  if (patch.startAt) {
    updateValues.GSI1SK = patch.startAt;
    updateValues.GSI2SK = patch.startAt;
  }

  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};
  const setExpressions = Object.keys(updateValues).map((key) => {
    const nameKey = `#${key}`;
    const valueKey = `:${key}`;
    expressionAttributeNames[nameKey] = key;
    expressionAttributeValues[valueKey] = updateValues[key];
    return `${nameKey} = ${valueKey}`;
  });

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: makeKeys.workshop(id),
      UpdateExpression: `SET ${setExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return toWorkshop(result.Attributes);
}

export async function softDeleteWorkshop(id: string): Promise<Workshop | undefined> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: makeKeys.workshop(id),
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':status': 'cancelled',
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return toWorkshop(result.Attributes);
}

export async function putRegistration(workshopId: string, userId: string): Promise<Registration> {
  const registration: Registration = {
    workshopId,
    userId,
    registeredAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...registration,
        ...makeKeys.registration(workshopId, userId),
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  );

  return registration;
}

export async function incrementRegisteredCount(workshopId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: makeKeys.workshop(workshopId),
      UpdateExpression: 'ADD registeredCount :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
      },
    })
  );
}
