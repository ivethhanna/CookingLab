/**
 * Shared Domain Types for CookingLab Serverless AWS
 * Representa las entidades principales del sistema y las claves DynamoDB (Single Table Design).
 */

export type WorkshopLevel = 'basico' | 'intermedio' | 'avanzado';
export type WorkshopModality = 'presencial' | 'virtual';
export type WorkshopStatus = 'scheduled' | 'cancelled' | 'finished';
export type UserRole = 'student' | 'admin';

export const WORKSHOP_CATEGORIES = [
  'Pastelería',
  'Panadería',
  'Cocina Italiana',
  'Asados / Parrilla',
  'Coctelería',
  'Cocina Internacional',
  'Repostería',
  'Cocina Saludable',
  'Técnicas Básicas',
  'Vinos y Maridaje',
] as const;

export type WorkshopCategory = (typeof WORKSHOP_CATEGORIES)[number];

const WORKSHOP_CATEGORY_ALIASES: Record<WorkshopCategory, string[]> = {
  Pastelería: ['Pastelería', 'Pasteleria', 'pastelería', 'pasteleria'],
  Panadería: ['Panadería', 'Panaderia', 'panadería', 'panaderia'],
  'Cocina Italiana': ['Cocina Italiana', 'cocina italiana', 'Italiana', 'italiana'],
  'Asados / Parrilla': ['Asados / Parrilla', 'Asados', 'Parrilla', 'asados', 'parrilla'],
  Coctelería: ['Coctelería', 'Cocteleria', 'coctelería', 'cocteleria'],
  'Cocina Internacional': ['Cocina Internacional', 'cocina internacional', 'Internacional', 'internacional'],
  Repostería: ['Repostería', 'Reposteria', 'repostería', 'reposteria'],
  'Cocina Saludable': ['Cocina Saludable', 'cocina saludable', 'Saludable', 'saludable'],
  'Técnicas Básicas': ['Técnicas Básicas', 'Tecnicas Basicas', 'técnicas básicas', 'tecnicas basicas'],
  'Vinos y Maridaje': ['Vinos y Maridaje', 'vinos y maridaje', 'Maridaje', 'maridaje'],
};

function normalizeCategoryKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeWorkshopCategory(value: string): WorkshopCategory | undefined {
  const normalizedValue = normalizeCategoryKey(value);

  return WORKSHOP_CATEGORIES.find((category) =>
    WORKSHOP_CATEGORY_ALIASES[category].some((alias) => normalizeCategoryKey(alias) === normalizedValue)
  );
}

export function getWorkshopCategoryQueryValues(value: string): string[] {
  const category = normalizeWorkshopCategory(value);

  if (!category) {
    return [value];
  }

  return Array.from(new Set([category, ...WORKSHOP_CATEGORY_ALIASES[category]]));
}

/**
 * Entidad Workshop (Taller de Cocina)
 * DynamoDB Keys:
 * - PK: WORKSHOP#<id>
 * - SK: META
 * - GSI1PK: WORKSHOP#ALL
 * - GSI1SK: <startAt> (Para ordenamiento/listado global por fecha)
 * - GSI2PK: CATEGORY#<category>
 * - GSI2SK: <startAt> (Para filtrado por categoría ordenado por fecha)
 */
export interface Workshop {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  startAt: string; // ISO 8601 string
  endAt: string;   // ISO 8601 string
  status: WorkshopStatus;
  capacity: number;
  registeredCount: number;
  instructor: string;
  level: WorkshopLevel;
  modality: WorkshopModality;
  certificateOffered: boolean;
  ingredientsIncluded: boolean;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export type WorkshopInput = Omit<
  Workshop,
  "id" | "registeredCount" | "createdAt" | "updatedAt"
>;

/**
 * Entidad Registration (Inscripción de Alumno a Taller)
 * DynamoDB Keys:
 * - PK: WORKSHOP#<workshopId>
 * - SK: REG#USER#<userId>
 */
export interface Registration {
  workshopId: string;
  userId: string;
  registeredAt: string; // ISO 8601 string
}

/**
 * Entidad User (Usuario del sistema)
 * DynamoDB Keys:
 * - PK: USER#<id>
 * - SK: META
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

/**
 * Helper interfaces para respuestas API (RFC 7807 Problem Details)
 */
export interface ApiProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

export const DomainEvents = {
  WORKSHOP_CREATED: "WORKSHOP_CREATED",
  STUDENT_REGISTERED: "STUDENT_REGISTERED",
} as const;

export type DomainEventName = (typeof DomainEvents)[keyof typeof DomainEvents];
