# Especificacion OpenAPI - CookingLab

Esta especificacion documenta la API REST de CookingLab para gestionar talleres de cocina, inscripciones y acceso protegido con Cognito. La arquitectura objetivo es API Gateway + Lambda + DynamoDB + Cognito, con errores en formato RFC 7807.

```yaml
openapi: 3.0.3
info:
  title: CookingLab REST API
  version: 1.0.0
  description: API REST para la gestion de talleres de cocina en AWS.
servers:
  - url: https://api.cookinglab.example.com
    description: Produccion
tags:
  - name: Workshops
    description: Gestion y consulta de talleres
  - name: Registrations
    description: Inscripciones de usuarios autenticados
paths:
  /workshops:
    get:
      tags:
        - Workshops
      summary: Listar talleres
      description: Endpoint publico que lista talleres, con paginacion basada en LastEvaluatedKey de DynamoDB y filtro opcional por categoria usando GSI2.
      operationId: listWorkshops
      parameters:
        - $ref: "#/components/parameters/Limit"
        - $ref: "#/components/parameters/NextToken"
        - $ref: "#/components/parameters/Category"
      responses:
        "200":
          description: Lista paginada de talleres
          headers:
            Access-Control-Allow-Origin:
              $ref: "#/components/headers/AccessControlAllowOrigin"
            Access-Control-Allow-Credentials:
              $ref: "#/components/headers/AccessControlAllowCredentials"
            Access-Control-Allow-Headers:
              $ref: "#/components/headers/AccessControlAllowHeaders"
          content:
            application/json:
              schema:
                type: object
                required:
                  - items
                properties:
                  items:
                    type: array
                    items:
                      $ref: "#/components/schemas/Workshop"
                  nextToken:
                    type: string
                    description: Token opaco para continuar la paginacion.
              examples:
                success:
                  summary: Talleres disponibles
                  value:
                    items:
                      - id: workshop_001
                        name: Pasta artesanal italiana
                        description: Tecnicas base para preparar pasta fresca y salsas clasicas.
                        category: Italiana
                        location: Sede Chapinero
                        instructor: Chef Laura Gomez
                        level: intermedio
                        modality: presencial
                        certificateOffered: true
                        ingredientsIncluded: true
                        price: 180000
                        startAt: "2026-09-15T18:00:00Z"
                        endAt: "2026-09-15T21:00:00Z"
                        status: scheduled
                        capacity: 16
                        registeredCount: 7
                        createdAt: "2026-08-01T12:00:00Z"
                        updatedAt: "2026-08-01T12:00:00Z"
                    nextToken: eyJQSyI6IldPUktTSE9QI3dvcmtzaG9wXzAwMSJ9
    post:
      tags:
        - Workshops
      summary: Crear taller
      description: Crea un taller. Requiere JWT de Cognito y rol admin mediante Cognito Groups.
      operationId: createWorkshop
      security:
        - CognitoAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/WorkshopInput"
            examples:
              createWorkshop:
                summary: Nuevo taller
                value:
                  name: Reposteria francesa
                  description: Aprende tecnicas de macaronage, masas y rellenos clasicos.
                  category: Reposteria
                  location: Aula virtual
                  instructor: Chef Pierre Martin
                  level: intermedio
                  modality: virtual
                  certificateOffered: true
                  ingredientsIncluded: false
                  price: 120000
                  startAt: "2026-10-01T15:00:00Z"
                  endAt: "2026-10-01T18:00:00Z"
                  status: scheduled
                  capacity: 20
      responses:
        "201":
          description: Taller creado
          headers:
            Access-Control-Allow-Origin:
              $ref: "#/components/headers/AccessControlAllowOrigin"
            Access-Control-Allow-Credentials:
              $ref: "#/components/headers/AccessControlAllowCredentials"
            Access-Control-Allow-Headers:
              $ref: "#/components/headers/AccessControlAllowHeaders"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Workshop"
              examples:
                created:
                  summary: Taller creado
                  value:
                    id: workshop_002
                    name: Reposteria francesa
                    description: Aprende tecnicas de macaronage, masas y rellenos clasicos.
                    category: Reposteria
                    location: Aula virtual
                    instructor: Chef Pierre Martin
                    level: intermedio
                    modality: virtual
                    certificateOffered: true
                    ingredientsIncluded: false
                    price: 120000
                    startAt: "2026-10-01T15:00:00Z"
                    endAt: "2026-10-01T18:00:00Z"
                    status: scheduled
                    capacity: 20
                    registeredCount: 0
                    createdAt: "2026-08-10T14:00:00Z"
                    updatedAt: "2026-08-10T14:00:00Z"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
  /workshops/{id}:
    get:
      tags:
        - Workshops
      summary: Obtener taller por ID
      description: Endpoint publico que obtiene el detalle de un taller.
      operationId: getWorkshopById
      parameters:
        - $ref: "#/components/parameters/WorkshopId"
      responses:
        "200":
          description: Taller encontrado
          headers:
            Access-Control-Allow-Origin:
              $ref: "#/components/headers/AccessControlAllowOrigin"
            Access-Control-Allow-Credentials:
              $ref: "#/components/headers/AccessControlAllowCredentials"
            Access-Control-Allow-Headers:
              $ref: "#/components/headers/AccessControlAllowHeaders"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Workshop"
              examples:
                success:
                  summary: Taller encontrado
                  value:
                    id: workshop_001
                    name: Pasta artesanal italiana
                    description: Tecnicas base para preparar pasta fresca y salsas clasicas.
                    category: Italiana
                    location: Sede Chapinero
                    instructor: Chef Laura Gomez
                    level: intermedio
                    modality: presencial
                    certificateOffered: true
                    ingredientsIncluded: true
                    price: 180000
                    startAt: "2026-09-15T18:00:00Z"
                    endAt: "2026-09-15T21:00:00Z"
                    status: scheduled
                    capacity: 16
                    registeredCount: 7
                    createdAt: "2026-08-01T12:00:00Z"
                    updatedAt: "2026-08-01T12:00:00Z"
        "404":
          $ref: "#/components/responses/NotFound"
    put:
      tags:
        - Workshops
      summary: Actualizar taller
      description: Actualiza parcialmente un taller existente. Requiere JWT de Cognito y rol admin mediante Cognito Groups.
      operationId: updateWorkshop
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
            examples:
              updateWorkshop:
                summary: Cambio parcial
                value:
                  capacity: 24
                  price: 150000
      responses:
        "200":
          description: Taller actualizado
          headers:
            Access-Control-Allow-Origin:
              $ref: "#/components/headers/AccessControlAllowOrigin"
            Access-Control-Allow-Credentials:
              $ref: "#/components/headers/AccessControlAllowCredentials"
            Access-Control-Allow-Headers:
              $ref: "#/components/headers/AccessControlAllowHeaders"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Workshop"
              examples:
                updated:
                  summary: Taller actualizado
                  value:
                    id: workshop_001
                    name: Pasta artesanal italiana
                    description: Tecnicas base para preparar pasta fresca y salsas clasicas.
                    category: Italiana
                    location: Sede Chapinero
                    instructor: Chef Laura Gomez
                    level: intermedio
                    modality: presencial
                    certificateOffered: true
                    ingredientsIncluded: true
                    price: 150000
                    startAt: "2026-09-15T18:00:00Z"
                    endAt: "2026-09-15T21:00:00Z"
                    status: scheduled
                    capacity: 24
                    registeredCount: 7
                    createdAt: "2026-08-01T12:00:00Z"
                    updatedAt: "2026-08-10T15:30:00Z"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
    delete:
      tags:
        - Workshops
      summary: Cancelar taller
      description: Hace soft-delete del taller cambiando status a "cancelled"; no ejecuta DeleteItem real para conservar el historico de inscripciones, segun docs/modelo-datos.md.
      operationId: deleteWorkshop
      security:
        - CognitoAuth: []
      parameters:
        - $ref: "#/components/parameters/WorkshopId"
      responses:
        "204":
          description: Taller cancelado sin body de respuesta
          headers:
            Access-Control-Allow-Origin:
              $ref: "#/components/headers/AccessControlAllowOrigin"
            Access-Control-Allow-Credentials:
              $ref: "#/components/headers/AccessControlAllowCredentials"
            Access-Control-Allow-Headers:
              $ref: "#/components/headers/AccessControlAllowHeaders"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
  /workshops/{id}/register:
    post:
      tags:
        - Registrations
      summary: Inscribirse a un taller
      description: Inscribe al usuario autenticado en el taller indicado. No recibe body; el userId se obtiene del claim "sub" del JWT. La idempotencia se apoya en ConditionalCheckFailedException de DynamoDB y el cupo se valida con registeredCount.
      operationId: registerWorkshop
      security:
        - CognitoAuth: []
      parameters:
        - $ref: "#/components/parameters/WorkshopId"
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              maxProperties: 0
            examples:
              emptyBody:
                summary: Sin body
                value: {}
      responses:
        "201":
          description: Inscripcion creada
          headers:
            Access-Control-Allow-Origin:
              $ref: "#/components/headers/AccessControlAllowOrigin"
            Access-Control-Allow-Credentials:
              $ref: "#/components/headers/AccessControlAllowCredentials"
            Access-Control-Allow-Headers:
              $ref: "#/components/headers/AccessControlAllowHeaders"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Registration"
              examples:
                created:
                  summary: Inscripcion creada
                  value:
                    workshopId: workshop_001
                    userId: user_123
                    registeredAt: "2026-08-10T16:00:00Z"
        "400":
          description: El taller alcanzo su capacidad maxima
          headers:
            Access-Control-Allow-Origin:
              $ref: "#/components/headers/AccessControlAllowOrigin"
            Access-Control-Allow-Credentials:
              $ref: "#/components/headers/AccessControlAllowCredentials"
            Access-Control-Allow-Headers:
              $ref: "#/components/headers/AccessControlAllowHeaders"
          content:
            application/problem+json:
              schema:
                $ref: "#/components/schemas/Problem"
              examples:
                capacityReached:
                  summary: Cupo agotado
                  value:
                    type: https://cookinglab.example.com/problems/capacity-reached
                    title: Workshop capacity reached
                    status: 400
                    detail: El taller ya alcanzo su cupo disponible.
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/AlreadyRegistered"
components:
  securitySchemes:
    CognitoAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT emitido por Amazon Cognito.
  headers:
    AccessControlAllowOrigin:
      description: Origen permitido por CORS.
      schema:
        type: string
        example: "*"
    AccessControlAllowCredentials:
      description: Indica si se permiten credenciales CORS.
      schema:
        type: string
        example: "true"
    AccessControlAllowHeaders:
      description: Headers permitidos por CORS.
      schema:
        type: string
        example: Content-Type,Authorization
  parameters:
    WorkshopId:
      name: id
      in: path
      required: true
      description: Identificador del taller.
      schema:
        type: string
      example: workshop_001
    Limit:
      name: limit
      in: query
      required: false
      description: Cantidad maxima de talleres a retornar.
      schema:
        type: integer
        minimum: 1
        maximum: 100
      example: 20
    NextToken:
      name: nextToken
      in: query
      required: false
      description: Token opaco de paginacion derivado de LastEvaluatedKey de DynamoDB.
      schema:
        type: string
      example: eyJQSyI6IldPUktTSE9QI3dvcmtzaG9wXzAwMSJ9
    Category:
      name: category
      in: query
      required: false
      description: Categoria usada para filtrar talleres mediante GSI2.
      schema:
        type: string
      example: Italiana
  responses:
    ValidationError:
      description: Error de validacion del request body segun el esquema Zod de backend/src/schemas/workshop.schema.ts.
      headers:
        Access-Control-Allow-Origin:
          $ref: "#/components/headers/AccessControlAllowOrigin"
        Access-Control-Allow-Credentials:
          $ref: "#/components/headers/AccessControlAllowCredentials"
        Access-Control-Allow-Headers:
          $ref: "#/components/headers/AccessControlAllowHeaders"
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
          examples:
            validation:
              summary: Validacion fallida
              value:
                type: https://cookinglab.example.com/problems/validation-error
                title: Validation error
                status: 400
                detail: El cuerpo de la solicitud no cumple el esquema esperado.
    Unauthorized:
      description: No se envio un token valido.
      headers:
        Access-Control-Allow-Origin:
          $ref: "#/components/headers/AccessControlAllowOrigin"
        Access-Control-Allow-Credentials:
          $ref: "#/components/headers/AccessControlAllowCredentials"
        Access-Control-Allow-Headers:
          $ref: "#/components/headers/AccessControlAllowHeaders"
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
          examples:
            unauthorized:
              summary: Token ausente o invalido
              value:
                type: https://cookinglab.example.com/problems/unauthorized
                title: Unauthorized
                status: 401
                detail: Se requiere un JWT valido de Cognito.
    Forbidden:
      description: El usuario autenticado no tiene permisos suficientes.
      headers:
        Access-Control-Allow-Origin:
          $ref: "#/components/headers/AccessControlAllowOrigin"
        Access-Control-Allow-Credentials:
          $ref: "#/components/headers/AccessControlAllowCredentials"
        Access-Control-Allow-Headers:
          $ref: "#/components/headers/AccessControlAllowHeaders"
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
          examples:
            forbidden:
              summary: Usuario no admin
              value:
                type: https://cookinglab.example.com/problems/forbidden
                title: Forbidden
                status: 403
                detail: Se requiere rol admin para ejecutar esta operacion.
    NotFound:
      description: El taller solicitado no existe.
      headers:
        Access-Control-Allow-Origin:
          $ref: "#/components/headers/AccessControlAllowOrigin"
        Access-Control-Allow-Credentials:
          $ref: "#/components/headers/AccessControlAllowCredentials"
        Access-Control-Allow-Headers:
          $ref: "#/components/headers/AccessControlAllowHeaders"
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
          examples:
            notFound:
              summary: Taller no encontrado
              value:
                type: https://cookinglab.example.com/problems/workshop-not-found
                title: Workshop not found
                status: 404
                detail: No existe un taller con el id indicado.
    AlreadyRegistered:
      description: El usuario ya estaba inscrito en el taller.
      headers:
        Access-Control-Allow-Origin:
          $ref: "#/components/headers/AccessControlAllowOrigin"
        Access-Control-Allow-Credentials:
          $ref: "#/components/headers/AccessControlAllowCredentials"
        Access-Control-Allow-Headers:
          $ref: "#/components/headers/AccessControlAllowHeaders"
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/Problem"
          examples:
            alreadyRegistered:
              summary: Inscripcion duplicada
              value:
                type: https://cookinglab.example.com/problems/already-registered
                title: Student already registered
                status: 409
                detail: El usuario autenticado ya esta inscrito en este taller.
  schemas:
    Workshop:
      type: object
      required:
        - id
        - name
        - description
        - category
        - location
        - instructor
        - level
        - modality
        - certificateOffered
        - ingredientsIncluded
        - price
        - startAt
        - endAt
        - status
        - capacity
        - registeredCount
        - createdAt
        - updatedAt
      properties:
        id:
          type: string
          example: workshop_001
        name:
          type: string
          example: Pasta artesanal italiana
        description:
          type: string
          example: Tecnicas base para preparar pasta fresca y salsas clasicas.
        category:
          type: string
          example: Italiana
        location:
          type: string
          example: Sede Chapinero
        instructor:
          type: string
          example: Chef Laura Gomez
        level:
          $ref: "#/components/schemas/WorkshopLevel"
        modality:
          $ref: "#/components/schemas/WorkshopModality"
        certificateOffered:
          type: boolean
          example: true
        ingredientsIncluded:
          type: boolean
          example: true
        price:
          type: number
          format: float
          minimum: 0
          example: 180000
        startAt:
          type: string
          format: date-time
          example: "2026-09-15T18:00:00Z"
        endAt:
          type: string
          format: date-time
          example: "2026-09-15T21:00:00Z"
        status:
          $ref: "#/components/schemas/WorkshopStatus"
        capacity:
          type: integer
          minimum: 1
          example: 16
        registeredCount:
          type: integer
          minimum: 0
          description: Conteo de inscritos actualizado atomicamente con UpdateItem ADD registeredCount :inc.
          example: 7
        createdAt:
          type: string
          format: date-time
          example: "2026-08-01T12:00:00Z"
        updatedAt:
          type: string
          format: date-time
          example: "2026-08-01T12:00:00Z"
    WorkshopInput:
      type: object
      required:
        - name
        - description
        - category
        - location
        - instructor
        - level
        - modality
        - certificateOffered
        - ingredientsIncluded
        - price
        - startAt
        - endAt
        - status
        - capacity
      properties:
        name:
          type: string
          example: Reposteria francesa
        description:
          type: string
          example: Aprende tecnicas de macaronage, masas y rellenos clasicos.
        category:
          type: string
          example: Reposteria
        location:
          type: string
          example: Aula virtual
        instructor:
          type: string
          example: Chef Pierre Martin
        level:
          $ref: "#/components/schemas/WorkshopLevel"
        modality:
          $ref: "#/components/schemas/WorkshopModality"
        certificateOffered:
          type: boolean
          example: true
        ingredientsIncluded:
          type: boolean
          example: false
        price:
          type: number
          format: float
          minimum: 0
          example: 120000
        startAt:
          type: string
          format: date-time
          example: "2026-10-01T15:00:00Z"
        endAt:
          type: string
          format: date-time
          example: "2026-10-01T18:00:00Z"
        status:
          $ref: "#/components/schemas/WorkshopStatus"
        capacity:
          type: integer
          minimum: 1
          example: 20
      additionalProperties: false
    WorkshopUpdateInput:
      type: object
      minProperties: 1
      properties:
        name:
          type: string
        description:
          type: string
        category:
          type: string
        location:
          type: string
        instructor:
          type: string
        level:
          $ref: "#/components/schemas/WorkshopLevel"
        modality:
          $ref: "#/components/schemas/WorkshopModality"
        certificateOffered:
          type: boolean
        ingredientsIncluded:
          type: boolean
        price:
          type: number
          format: float
          minimum: 0
        startAt:
          type: string
          format: date-time
        endAt:
          type: string
          format: date-time
        status:
          $ref: "#/components/schemas/WorkshopStatus"
        capacity:
          type: integer
          minimum: 1
      additionalProperties: false
    Registration:
      type: object
      required:
        - workshopId
        - userId
        - registeredAt
      properties:
        workshopId:
          type: string
          example: workshop_001
        userId:
          type: string
          example: user_123
        registeredAt:
          type: string
          format: date-time
          example: "2026-08-10T16:00:00Z"
    User:
      type: object
      required:
        - id
        - email
        - role
      properties:
        id:
          type: string
          example: user_123
        email:
          type: string
          format: email
          example: ana@example.com
        role:
          $ref: "#/components/schemas/UserRole"
        createdAt:
          type: string
          format: date-time
          example: "2026-08-01T12:00:00Z"
    WorkshopLevel:
      type: string
      enum:
        - basico
        - intermedio
        - avanzado
      example: intermedio
    WorkshopModality:
      type: string
      enum:
        - presencial
        - virtual
      example: presencial
    WorkshopStatus:
      type: string
      enum:
        - scheduled
        - cancelled
      example: scheduled
    UserRole:
      type: string
      enum:
        - student
        - admin
      example: student
    Problem:
      type: object
      required:
        - type
        - title
        - status
      properties:
        type:
          type: string
          format: uri
          example: https://cookinglab.example.com/problems/validation-error
        title:
          type: string
          example: Validation error
        status:
          type: integer
          format: int32
          example: 400
        detail:
          type: string
          example: El cuerpo de la solicitud no cumple el esquema esperado.
```

| Metodo | Ruta | Auth | Descripcion corta |
| --- | --- | --- | --- |
| GET | `/workshops` | Publico | Lista talleres con paginacion y filtro opcional por categoria. |
| GET | `/workshops/{id}` | Publico | Obtiene el detalle de un taller. |
| POST | `/workshops` | Cognito JWT + admin | Crea un taller. |
| PUT | `/workshops/{id}` | Cognito JWT + admin | Actualiza parcialmente un taller. |
| DELETE | `/workshops/{id}` | Cognito JWT + admin | Cancela un taller mediante soft-delete. |
| POST | `/workshops/{id}/register` | Cognito JWT | Inscribe al usuario autenticado en un taller. |
