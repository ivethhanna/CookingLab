/**
 * Shared Domain Types for CookingLab Serverless AWS
 * Representa las entidades principales del sistema y las claves DynamoDB (Single Table Design).
 */

export type WorkshopLevel = 'basico' | 'intermedio' | 'avanzado';
export type WorkshopModality = 'presencial' | 'virtual';
export type WorkshopStatus = 'scheduled' | 'cancelled' | 'finished';
export type UserRole = 'student' | 'admin';

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
