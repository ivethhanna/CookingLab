import { APIGatewayProxyHandler } from 'aws-lambda';
import { listWorkshops } from '../../lib/dynamo';
import { ok, problem } from '../../lib/http';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const limitParam = event.queryStringParameters?.limit;
    const limit = limitParam ? Number(limitParam) : undefined;

    if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
      return problem({
        type: 'https://cookinglab.io/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'limit debe ser un entero positivo.',
      });
    }

    const result = await listWorkshops(
      limit,
      event.queryStringParameters?.nextToken,
      event.queryStringParameters?.category
    );

    return ok(result);
  } catch (err: any) {
    return problem({
      type: 'https://cookinglab.io/errors/internal-server-error',
      title: 'Internal Error',
      status: 500,
      detail: err.message || 'Error interno al listar talleres.',
    });
  }
};
