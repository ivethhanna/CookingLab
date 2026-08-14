import { APIGatewayProxyEvent } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAdmin } from '../../../lib/auth';
import { putWorkshop } from '../../../lib/dynamo';
import { publishEvent } from '../../../lib/events';
import { handler } from '../create';

vi.mock('../../../lib/auth', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('../../../lib/dynamo', () => ({
  putWorkshop: vi.fn(),
}));

vi.mock('../../../lib/events', () => ({
  publishEvent: vi.fn(),
}));

const validWorkshopInput = {
  name: 'Masterclass de Pasta Fresca',
  description: 'Aprende tecnicas practicas para preparar pasta fresca artesanal.',
  category: 'Cocina Italiana',
  location: 'Sede Poblado',
  startAt: '2026-09-15T14:00:00.000Z',
  endAt: '2026-09-15T17:00:00.000Z',
  status: 'scheduled',
  capacity: 12,
  instructor: 'Chef Marco Rossi',
  level: 'intermedio',
  modality: 'presencial',
  certificateOffered: true,
  ingredientsIncluded: true,
  price: 180000,
};

function eventWithBody(body: unknown): APIGatewayProxyEvent {
  return {
    body: JSON.stringify(body),
    requestContext: {
      authorizer: {
        claims: {
          sub: 'admin-user',
          'cognito:groups': 'admin',
        },
      },
    },
  } as APIGatewayProxyEvent;
}

describe('create workshop handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(putWorkshop).mockResolvedValue(undefined);
    vi.mocked(publishEvent).mockResolvedValue(undefined);
  });

  it('crea un taller valido y responde 201', async () => {
    const response = await handler(eventWithBody(validWorkshopInput), {} as never, vi.fn()) as any;
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(response.headers?.['Content-Type']).toBe('application/json');
    expect(body).toMatchObject({
      name: validWorkshopInput.name,
      category: validWorkshopInput.category,
      registeredCount: 0,
    });
    expect(body.id).toEqual(expect.any(String));
    expect(putWorkshop).toHaveBeenCalledWith(expect.objectContaining({
      id: body.id,
      name: validWorkshopInput.name,
    }));
    expect(publishEvent).toHaveBeenCalledOnce();
  });

  it('rechaza un body invalido con 400 y problem+json', async () => {
    const { name, ...invalidInput } = validWorkshopInput;
    void name;

    const response = await handler(eventWithBody(invalidInput), {} as never, vi.fn()) as any;
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(response.headers?.['Content-Type']).toBe('application/problem+json');
    expect(body.title).toBe('Validation Error');
    expect(body.invalidParams).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'name' })])
    );
    expect(putWorkshop).not.toHaveBeenCalled();
  });

  it('rechaza si isAdmin es false con 403', async () => {
    vi.mocked(isAdmin).mockReturnValue(false);

    const response = await handler(eventWithBody(validWorkshopInput), {} as never, vi.fn()) as any;
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(403);
    expect(body.title).toBe('Forbidden');
    expect(putWorkshop).not.toHaveBeenCalled();
  });
});
