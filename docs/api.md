# API - CookingLab

La API real esta implementada en `backend/src/handlers` y expuesta por `ApiStack` como API Gateway REST. Las rutas publicas no usan authorizer; las rutas protegidas usan Cognito JWT y, para administracion, validan el grupo `admin` en el claim `cognito:groups`.

```yaml
openapi: 3.0.3
info:
  title: CookingLab REST API
  version: 1.0.0
  description: API REST para talleres, inscripciones y health checks de CookingLab.
servers:
  - url: https://{apiId}.execute-api.{region}.amazonaws.com/{stage}
    variables:
      apiId:
        default: example
      region:
        default: us-east-1
      stage:
        default: dev
tags:
  - name: Health
  - name: Workshops
  - name: Registrations
paths:
  /healthz:
    get:
      tags: [Health]
      summary: Health check publico
      description: Endpoint sin autenticacion usado por el smoke test del pipeline.
      responses:
        "200":
          description: Servicio disponible
          content:
            application/json:
              schema:
                type: object
                required: [status, timestamp]
                properties:
                  status:
                    type: string
                    example: ok
                  timestamp:
                    type: string
                    format: date-time
  /workshops:
    get:
      tags: [Workshops]
      summary: Listar talleres
      description: Lista talleres por fecha usando GSI1 o filtra por categoria usando GSI2.
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
          description: Entero positivo opcional.
        - name: nextToken
          in: query
          schema:
            type: string
          description: Token base64 derivado de LastEvaluatedKey.
        - name: category
          in: query
          schema:
            type: string
          description: Categoria para filtrar talleres.
      responses:
        "200":
          description: Lista paginada.
          content:
            application/json:
              schema:
                type: object
                required: [items]
                properties:
                  items:
                    type: array
                    items:
                      $ref: "#/components/schemas/Workshop"
                  nextToken:
                    type: string
        "400":
          $ref: "#/components/responses/BadRequest"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalError"
    post:
      tags: [Workshops]
      summary: Crear taller
      description: Requiere JWT Cognito y grupo admin.
      security:
        - CognitoAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/WorkshopInput"
      responses:
        "201":
          description: Taller creado.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Workshop"
        "400":
          $ref: "#/components/responses/ValidationError"
        "403":
          $ref: "#/components/responses/Forbidden"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalError"
  /workshops/{id}:
    get:
      tags: [Workshops]
      summary: Obtener taller
      parameters:
        - $ref: "#/components/parameters/WorkshopId"
      responses:
        "200":
          description: Taller encontrado.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Workshop"
        "400":
          $ref: "#/components/responses/BadRequest"
        "404":
          $ref: "#/components/responses/NotFound"
        "500":
          $ref: "#/components/responses/InternalError"
    put:
      tags: [Workshops]
      summary: Actualizar taller
      description: Requiere JWT Cognito y grupo admin.
      security:
        - CognitoAuth: []
      parameters:
        - $ref: "#/components/parameters/WorkshopId"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/WorkshopUpdateInput"
      responses:
        "200":
          description: Taller actualizado.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Workshop"
        "400":
          $ref: "#/components/responses/ValidationError"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalError"
    delete:
      tags: [Workshops]
      summary: Cancelar taller
      description: Requiere JWT Cognito y grupo admin. No borra el item; cambia `status` a `cancelled`.
      security:
        - CognitoAuth: []
      parameters:
        - $ref: "#/components/parameters/WorkshopId"
      responses:
        "204":
          description: Taller cancelado sin body.
        "400":
          $ref: "#/components/responses/BadRequest"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalError"
  /workshops/{id}/register:
    post:
      tags: [Registrations]
      summary: Inscribirse a un taller
      description: Requiere JWT Cognito. El usuario se obtiene del claim `sub`; no requiere body.
      security:
        - CognitoAuth: []
      parameters:
        - $ref: "#/components/parameters/WorkshopId"
      responses:
        "201":
          description: Inscripcion creada.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Registration"
        "400":
          description: Id faltante, taller no abierto a inscripciones o cupo agotado.
          content:
            application/problem+json:
              schema:
                $ref: "#/components/schemas/Problem"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/AlreadyRegistered"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalError"
components:
  securitySchemes:
    CognitoAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  parameters:
    WorkshopId:
      name: id
      in: path
      required: true
      schema:
        type: string
  responses:
    BadRequest:
      description: Solicitud invalida.
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
    ValidationError:
      description: Error de validacion Zod.
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
    Unauthorized:
      description: JWT ausente o invalido.
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
    Forbidden:
      description: Usuario autenticado sin grupo admin.
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
    NotFound:
      description: Taller no encontrado.
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
    AlreadyRegistered:
      description: El usuario ya esta inscrito.
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
    TooManyRequests:
      description: Limite de throttling excedido en API Gateway.
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
    InternalError:
      description: Error interno.
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
  schemas:
    Workshop:
      type: object
      required:
        - id
        - name
        - description
        - category
        - location
        - startAt
        - endAt
        - status
        - capacity
        - registeredCount
        - instructor
        - level
        - modality
        - certificateOffered
        - ingredientsIncluded
        - price
        - createdAt
        - updatedAt
      properties:
        id: { type: string }
        name: { type: string, minLength: 3 }
        description: { type: string, minLength: 10 }
        category: { type: string }
        location: { type: string }
        startAt: { type: string, format: date-time }
        endAt: { type: string, format: date-time }
        status:
          $ref: "#/components/schemas/WorkshopStatus"
        capacity: { type: integer, minimum: 1 }
        registeredCount: { type: integer, minimum: 0 }
        instructor: { type: string }
        level:
          $ref: "#/components/schemas/WorkshopLevel"
        modality:
          $ref: "#/components/schemas/WorkshopModality"
        certificateOffered: { type: boolean }
        ingredientsIncluded: { type: boolean }
        price: { type: number, minimum: 0 }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    WorkshopInput:
      type: object
      additionalProperties: false
      required:
        - name
        - description
        - category
        - location
        - startAt
        - endAt
        - status
        - capacity
        - instructor
        - level
        - modality
        - certificateOffered
        - ingredientsIncluded
        - price
      properties:
        name: { type: string, minLength: 3 }
        description: { type: string, minLength: 10 }
        category: { type: string }
        location: { type: string }
        startAt: { type: string, format: date-time }
        endAt: { type: string, format: date-time }
        status:
          $ref: "#/components/schemas/WorkshopStatus"
        capacity: { type: integer, minimum: 1 }
        instructor: { type: string }
        level:
          $ref: "#/components/schemas/WorkshopLevel"
        modality:
          $ref: "#/components/schemas/WorkshopModality"
        certificateOffered: { type: boolean }
        ingredientsIncluded: { type: boolean }
        price: { type: number, minimum: 0 }
    WorkshopUpdateInput:
      type: object
      minProperties: 1
      additionalProperties: false
      properties:
        name: { type: string, minLength: 3 }
        description: { type: string, minLength: 10 }
        category: { type: string }
        location: { type: string }
        startAt: { type: string, format: date-time }
        endAt: { type: string, format: date-time }
        status:
          $ref: "#/components/schemas/WorkshopStatus"
        capacity: { type: integer, minimum: 1 }
        instructor: { type: string }
        level:
          $ref: "#/components/schemas/WorkshopLevel"
        modality:
          $ref: "#/components/schemas/WorkshopModality"
        certificateOffered: { type: boolean }
        ingredientsIncluded: { type: boolean }
        price: { type: number, minimum: 0 }
    Registration:
      type: object
      required: [workshopId, userId, registeredAt]
      properties:
        workshopId: { type: string }
        userId: { type: string }
        registeredAt: { type: string, format: date-time }
    WorkshopLevel:
      type: string
      enum: [basico, intermedio, avanzado]
    WorkshopModality:
      type: string
      enum: [presencial, virtual]
    WorkshopStatus:
      type: string
      enum: [scheduled, cancelled, finished]
    Problem:
      type: object
      required: [type, title, status, detail]
      properties:
        type: { type: string }
        title: { type: string }
        status: { type: integer }
        detail: { type: string }
        instance: { type: string }
        invalidParams:
          type: array
          items:
            type: object
            required: [name, reason]
            properties:
              name: { type: string }
              reason: { type: string }
```

## Resumen de rutas reales

| Metodo | Ruta | Auth | Handler |
| --- | --- | --- | --- |
| GET | `/healthz` | Publico | `handlers/health.ts` |
| GET | `/workshops` | Publico | `handlers/workshops/list.ts` |
| POST | `/workshops` | Cognito JWT + admin | `handlers/workshops/create.ts` |
| GET | `/workshops/{id}` | Publico | `handlers/workshops/getById.ts` |
| PUT | `/workshops/{id}` | Cognito JWT + admin | `handlers/workshops/update.ts` |
| DELETE | `/workshops/{id}` | Cognito JWT + admin | `handlers/workshops/remove.ts` |
| POST | `/workshops/{id}/register` | Cognito JWT | `handlers/registrations/register.ts` |

## Notas de implementacion

- Los errores de backend usan `application/problem+json` y tipos `https://cookinglab.io/errors/...`.
- `POST /workshops` publica `WORKSHOP_CREATED`.
- `POST /workshops/{id}/register` publica `STUDENT_REGISTERED`, valida cupo con `registeredCount` y retorna `409` si la inscripcion ya existe.
- `DELETE /workshops/{id}` es soft delete: actualiza `status` a `cancelled`.
- `finished` representa talleres terminados; el frontend lo muestra como "Terminado" y bloquea nuevas inscripciones.
