import { APIGatewayProxyHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { ZodError } from 'zod';
import { DomainEvents, Workshop } from '../../../../shared/types';
import { isAdmin } from '../../lib/auth';
import { putWorkshop } from '../../lib/dynamo';
import { publishEvent } from '../../lib/events';
import { ok, problem } from '../../lib/http';
import { workshopInputSchema } from '../../schemas/workshop.schema';

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

    if (!event.body) {
      return problem({
        type: 'https://cookinglab.io/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'El cuerpo de la solicitud no puede estar vacio.',
      });
    }

    const validation = workshopInputSchema.safeParse(JSON.parse(event.body));
    if (!validation.success) {
      return validationProblem(validation.error);
    }

    const now = new Date().toISOString();
    const workshop: Workshop = {
      id: randomUUID(),
      ...validation.data,
      registeredCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await putWorkshop(workshop);
    await publishEvent(process.env.EVENT_BUS_NAME ?? '', DomainEvents.WORKSHOP_CREATED, {
      workshopId: workshop.id,
      name: workshop.name,
      startAt: workshop.startAt,
      category: workshop.category,
    });

    return ok(workshop, 201);
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
      detail: err.message || 'Error interno al crear el taller.',
    });
  }
};
