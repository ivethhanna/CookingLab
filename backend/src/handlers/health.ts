import { APIGatewayProxyHandler } from 'aws-lambda';
import { ok } from '../lib/http';

export const handler: APIGatewayProxyHandler = async () =>
  ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
