import { describe, expect, it } from 'vitest';
import { workshopInputSchema } from '../workshop.schema';

const documentedWorkshopInput = {
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

describe('workshopInputSchema contract', () => {
  it('acepta un payload valido compatible con docs/api.md', () => {
    const result = workshopInputSchema.safeParse(documentedWorkshopInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(documentedWorkshopInput);
    }
  });

  it('rechaza payloads con campos faltantes', () => {
    const { name, ...missingName } = documentedWorkshopInput;
    void name;

    const result = workshopInputSchema.safeParse(missingName);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['name'] })])
      );
    }
  });

  it('rechaza payloads con tipos incorrectos documentados', () => {
    const result = workshopInputSchema.safeParse({
      ...documentedWorkshopInput,
      capacity: '12',
      certificateOffered: 'true',
      price: '180000',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['capacity'] }),
          expect.objectContaining({ path: ['certificateOffered'] }),
          expect.objectContaining({ path: ['price'] }),
        ])
      );
    }
  });

  it('rechaza categorias fuera de la lista permitida', () => {
    const result = workshopInputSchema.safeParse({
      ...documentedWorkshopInput,
      category: 'Categoria Libre',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['category'] })])
      );
    }
  });
});
