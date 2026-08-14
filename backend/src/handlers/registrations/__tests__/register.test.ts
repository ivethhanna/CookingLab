import { APIGatewayProxyEvent } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserId } from '../../../lib/auth';
import { getWorkshop, incrementRegisteredCount, putRegistration } from '../../../lib/dynamo';
import { publishEvent } from '../../../lib/events';
import { handler } from '../register';

vi.mock('../../../lib/auth', () => ({
  getUserId: vi.fn(),
}));

vi.mock('../../../lib/dynamo', () => ({
  getWorkshop: vi.fn(),
  incrementRegisteredCount: vi.fn(),
  putRegistration: vi.fn(),
}));

vi.mock('../../../lib/events', () => ({
  publishEvent: vi.fn(),
}));

const scheduledWorkshop = {
  id: 'workshop-1',
  name: 'Masterclass de Pasta Fresca',
  description: 'Aprende tecnicas practicas para preparar pasta fresca artesanal.',
  category: 'Cocina Italiana',
  location: 'Sede Poblado',
  startAt: '2026-09-15T14:00:00.000Z',
  endAt: '2026-09-15T17:00:00.000Z',
  status: 'scheduled',
  capacity: 12,
  registeredCount: 3,
  instructor: 'Chef Marco Rossi',
  level: 'intermedio',
  modality: 'presencial',
  certificateOffered: true,
  ingredientsIncluded: true,
  price: 180000,
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
};

function eventWithWorkshopId(id = 'workshop-1'): APIGatewayProxyEvent {
  return {
    pathParameters: { id },
    requestContext: {
      authorizer: {
        claims: {
          sub: 'student-1',
        },
      },
    },
  } as APIGatewayProxyEvent;
}

describe('register workshop handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserId).mockReturnValue('student-1');
    vi.mocked(getWorkshop).mockResolvedValue(scheduledWorkshop as never);
    vi.mocked(putRegistration).mockResolvedValue({
      workshopId: 'workshop-1',
      userId: 'student-1',
      registeredAt: '2026-08-13T10:00:00.000Z',
    });
    vi.mocked(incrementRegisteredCount).mockResolvedValue(undefined);
    vi.mocked(publishEvent).mockResolvedValue(undefined);
  });

  it('inscribe exitosamente y responde 201', async () => {
    const response = await handler(eventWithWorkshopId(), {} as never, vi.fn()) as any;
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(response.headers?.['Content-Type']).toBe('application/json');
    expect(body).toEqual({
      workshopId: 'workshop-1',
      userId: 'student-1',
      registeredAt: '2026-08-13T10:00:00.000Z',
    });
    expect(putRegistration).toHaveBeenCalledWith('workshop-1', 'student-1');
    expect(incrementRegisteredCount).toHaveBeenCalledWith('workshop-1');
    expect(publishEvent).toHaveBeenCalledOnce();
  });

  it('responde 409 si la inscripcion esta duplicada', async () => {
    vi.mocked(putRegistration).mockRejectedValue({ name: 'ConditionalCheckFailedException' });

    const response = await handler(eventWithWorkshopId(), {} as never, vi.fn()) as any;
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(409);
    expect(response.headers?.['Content-Type']).toBe('application/problem+json');
    expect(body.title).toBe('Already registered');
    expect(incrementRegisteredCount).not.toHaveBeenCalled();
  });

  it('responde 400 si no hay cupo disponible', async () => {
    vi.mocked(getWorkshop).mockResolvedValue({
      ...scheduledWorkshop,
      capacity: 3,
      registeredCount: 3,
    } as never);

    const response = await handler(eventWithWorkshopId(), {} as never, vi.fn()) as any;
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(response.headers?.['Content-Type']).toBe('application/problem+json');
    expect(body.title).toBe('Capacity exceeded');
    expect(putRegistration).not.toHaveBeenCalled();
  });
});
