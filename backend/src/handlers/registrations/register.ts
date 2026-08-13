import { APIGatewayProxyHandler } from 'aws-lambda';
import { DomainEvents } from '../../../../shared/types';
import { getUserId } from '../../lib/auth';
import { getWorkshop, incrementRegisteredCount, putRegistration } from '../../lib/dynamo';
import { publishEvent } from '../../lib/events';
import { ok, problem } from '../../lib/http';

function isConditionalCheckFailed(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: string }).name === 'ConditionalCheckFailedException'
  );
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const workshopId = event.pathParameters?.id;
    if (!workshopId) {
      return problem({
        type: 'https://cookinglab.io/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'El id del taller es obligatorio.',
      });
    }

    let userId: string;
    try {
      userId = getUserId(event);
    } catch {
      return problem({
        type: 'https://cookinglab.io/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Se requiere un JWT valido de Cognito.',
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

    if (workshop.status !== 'scheduled') {
      return problem({
        type: 'https://cookinglab.io/errors/workshop-not-open',
        title: 'Workshop not open',
        status: 400,
        detail: 'El taller no esta disponible para nuevas inscripciones.',
      });
    }

    if (workshop.registeredCount >= workshop.capacity) {
      return problem({
        type: 'https://cookinglab.io/errors/capacity-exceeded',
        title: 'Capacity exceeded',
        status: 400,
        detail: 'El taller ya alcanzo su cupo disponible.',
      });
    }

    try {
      const registration = await putRegistration(workshopId, userId);
      await incrementRegisteredCount(workshopId);
      await publishEvent(process.env.EVENT_BUS_NAME ?? '', DomainEvents.STUDENT_REGISTERED, {
        workshopId,
        userId,
        registeredAt: registration.registeredAt,
      });

      return ok(registration, 201);
    } catch (err: unknown) {
      if (isConditionalCheckFailed(err)) {
        return problem({
          type: 'https://cookinglab.io/errors/already-registered',
          title: 'Already registered',
          status: 409,
          detail: 'El usuario autenticado ya esta inscrito en este taller.',
        });
      }

      throw err;
    }
  } catch (err: any) {
    return problem({
      type: 'https://cookinglab.io/errors/internal-server-error',
      title: 'Internal Error',
      status: 500,
      detail: err.message || 'Error al procesar inscripcion.',
    });
  }
};
