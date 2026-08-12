import { APIGatewayProxyHandler } from 'aws-lambda';
import { ZodError } from 'zod';
import { isAdmin } from '../../lib/auth';
import { getWorkshop, updateWorkshop } from '../../lib/dynamo';
import { ok, problem } from '../../lib/http';
import { workshopUpdateSchema } from '../../schemas/workshop.schema';

function validationProblem(error: ZodError) {
  return problem({
    type: 'https://cookinglab.io/errors/validation-error',
    title: 'Validation Error',
    status: 400,
    detail: 'Error de validacion en los campos del taller.',
    invalidParams: error.issues.map((issue) => ({
      name: issue.path.join('.'),
      reason: issue.message,
    })),
  });
}

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

    if (!event.body) {
      return problem({
        type: 'https://cookinglab.io/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'El cuerpo de la solicitud no puede estar vacio.',
      });
    }

    const validation = workshopUpdateSchema.safeParse(JSON.parse(event.body));
    if (!validation.success) {
      return validationProblem(validation.error);
    }

    const updatedWorkshop = await updateWorkshop(workshopId, validation.data);

    return ok(updatedWorkshop);
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return problem({
        type: 'https://cookinglab.io/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'El cuerpo de la solicitud debe ser JSON valido.',
      });
    }

    return problem({
      type: 'https://cookinglab.io/errors/internal-server-error',
      title: 'Internal Error',
      status: 500,
      detail: err.message || 'Error al actualizar taller.',
    });
  }
};
