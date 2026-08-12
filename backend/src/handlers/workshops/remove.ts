import { APIGatewayProxyHandler } from 'aws-lambda';
import { isAdmin } from '../../lib/auth';
import { getWorkshop, softDeleteWorkshop } from '../../lib/dynamo';
import { CORS_HEADERS, problem } from '../../lib/http';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!isAdmin(event)) {
      return problem({
        type: 'https://cookinglab.io/errors/forbidden',
        title: 'Forbidden',
        status: 403,
        detail: 'Se requiere rol admin para ejecutar esta operacion.',
      });
    }

    const workshopId = event.pathParameters?.id;
    if (!workshopId) {
      return problem({
        type: 'https://cookinglab.io/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'El id del taller es requerido.',
      });
    }

    const existingWorkshop = await getWorkshop(workshopId);
    if (!existingWorkshop) {
      return problem({
        type: 'https://cookinglab.io/errors/workshop-not-found',
        title: 'Workshop not found',
        status: 404,
        detail: 'No existe un taller con el id indicado.',
      });
    }

    await softDeleteWorkshop(workshopId);

    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  } catch (err: any) {
    return problem({
      type: 'https://cookinglab.io/errors/internal-server-error',
      title: 'Internal Error',
      status: 500,
      detail: err.message || 'Error al eliminar taller.',
    });
  }
};
