import { APIGatewayProxyHandler } from 'aws-lambda';
import { getWorkshop } from '../../lib/dynamo';
import { ok, problem } from '../../lib/http';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const workshopId = event.pathParameters?.id;
    if (!workshopId) {
      return problem({
        type: 'https://cookinglab.io/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'El parametro id del taller es obligatorio.',
      });
    }

    const workshop = await getWorkshop(workshopId);
    if (!workshop) {
      return problem({
        type: 'https://cookinglab.io/errors/workshop-not-found',
        title: 'Workshop not found',
        status: 404,
        detail: 'No existe un taller con el id indicado.',
      });
    }

    return ok(workshop);
  } catch (err: any) {
    return problem({
      type: 'https://cookinglab.io/errors/internal-server-error',
      title: 'Internal Error',
      status: 500,
      detail: err.message || 'Error al obtener taller.',
    });
  }
};
