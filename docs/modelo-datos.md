# Modelo de Datos - CookingLab

Fuente de verdad: `shared/types.ts` y `backend/src/lib/dynamo.ts`.

## Tipos de dominio

```ts
export type WorkshopLevel = 'basico' | 'intermedio' | 'avanzado';
export type WorkshopModality = 'presencial' | 'virtual';
export type WorkshopStatus = 'scheduled' | 'cancelled' | 'finished';
export type UserRole = 'student' | 'admin';
```

## Workshop

```ts
export interface Workshop {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  startAt: string;
  endAt: string;
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
```

`WorkshopInput` es:

```ts
Omit<Workshop, 'id' | 'registeredCount' | 'createdAt' | 'updatedAt'>
```

`registeredCount` se inicializa en `0` al crear un taller y se incrementa con `UpdateItem ADD registeredCount :inc` cuando se crea una inscripcion.

## Registration

```ts
export interface Registration {
  workshopId: string;
  userId: string;
  registeredAt: string;
}
```

La inscripcion usa una condicion `attribute_not_exists(PK)` para evitar duplicados por usuario y taller.

## User

```ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}
```

El codigo actual no persiste usuarios propios en DynamoDB; Cognito es la fuente de autenticacion y grupos.

## ApiProblemDetails

```ts
export interface ApiProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}
```

Las respuestas de error de los handlers usan `application/problem+json`.

## Eventos de dominio

```ts
export const DomainEvents = {
  WORKSHOP_CREATED: 'WORKSHOP_CREATED',
  STUDENT_REGISTERED: 'STUDENT_REGISTERED',
} as const;
```

`WORKSHOP_CREATED` se publica despues de crear un taller. `STUDENT_REGISTERED` se publica despues de una inscripcion exitosa.

## Claves DynamoDB

La tabla usa single-table design:

| Entidad | PK | SK |
| --- | --- | --- |
| Workshop | `WORKSHOP#<id>` | `META` |
| Registration | `WORKSHOP#<workshopId>` | `REG#USER#<userId>` |
| User helper | `USER#<id>` | `META` |

Indices:

| Indice | Partition key | Sort key | Uso |
| --- | --- | --- | --- |
| GSI1 | `GSI1PK = WORKSHOP#ALL` | `GSI1SK = startAt` | Listado global ordenado por fecha y recordatorios. |
| GSI2 | `GSI2PK = CATEGORY#<CATEGORY>` | `GSI2SK = startAt` | Listado por categoria ordenado por fecha. |

Los talleres eliminados no se borran fisicamente; `DELETE /workshops/{id}` actualiza `status` a `cancelled`. El estado `finished` representa talleres ya terminados; el frontend lo muestra como "Terminado" y no permite nuevas inscripciones.
