# CookingLab - AWS Serverless Monorepo

Monorepo con la estructura base (**scaffolding**) para el proyecto académico **CookingLab**, una plataforma de gestión de talleres gastronómicos basada en arquitectura Serverless en Amazon Web Services (AWS).

---

## 🚀 Tecnologías Utilizadas

- **IaC (Infraestructura como Código)**: AWS CDK v2 en TypeScript
- **Backend**: Node.js 20, TypeScript, AWS SDK v3, Zod (Validación RFC 7807)
- **Frontend**: React, Vite, TypeScript
- **Gestor de Paquetes**: pnpm Workspaces (Monorepo con 3 paquetes)

---

## 📁 Estructura del Monorepo

```
cookinglab-serverless-aws/
├── infra/                          # AWS CDK (TypeScript)
│   ├── bin/app.ts                  # Entry point de la app CDK
│   ├── lib/stacks/
│   │   ├── data-stack.ts           # DynamoDB (Single Table PK/SK + GSI1 + GSI2)
│   │   ├── auth-stack.ts           # Cognito User Pool & UserPoolClient
│   │   ├── api-stack.ts            # API Gateway REST API + Cognito JWT Authorizer
│   │   ├── events-stack.ts         # EventBridge Bus + Scheduler + SNS + SQS DLQ
│   │   ├── front-stack.ts          # S3 Privado + CloudFront OAC + WAF
│   │   └── observability-stack.ts  # CloudWatch Alarms + Dashboard + X-Ray
│   ├── lib/config/env.ts           # Configuración por Stage (dev/prod)
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
├── backend/                        # Lambda Handlers & Utilidades
│   ├── src/handlers/workshops/     # create.ts, list.ts, getById.ts, update.ts, remove.ts
│   ├── src/handlers/registrations/ # register.ts (Inscripción idempotente)
│   ├── src/handlers/notifications/ # onWorkshopCreated.ts, onStudentRegistered.ts, reminder.ts
│   ├── src/lib/dynamo.ts           # DynamoDBDocumentClient + helpers de claves
│   ├── src/lib/http.ts             # Helpers ok() y problem() (RFC 7807)
│   ├── src/schemas/workshop.schema.ts # Validación con Zod
│   ├── package.json
│   └── tsconfig.json
├── frontend/                       # React + Vite Single Page Application
│   ├── src/pages/                  # WorkshopList.tsx, WorkshopDetail.tsx, AdminPanel.tsx
│   ├── src/components/Navbar.tsx
│   ├── src/api/client.ts           # Fetch wrapper con headers de autenticación
│   ├── src/auth/cognito.ts         # Helpers de autenticación Cognito
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── shared/types.ts                 # Workshop, Registration, User (Fuente de Verdad)
├── docs/                           # Documentación Arquitectónica y Operativa
│   ├── arquitectura.md
│   ├── api.md
│   ├── despliegue.md
│   ├── operacion.md
│   └── costos.md
├── package.json                    # Root package.json con scripts de workspaces
├── pnpm-workspace.yaml
├── .gitignore
└── README.md
```

---

## 🛠️ Comandos Principales

```bash
# 1. Instalar todas las dependencias del monorepo
pnpm install

# 2. Compilar todos los paquetes (infra, backend, frontend)
pnpm build

# 3. Iniciar el entorno de desarrollo local del Frontend
pnpm dev:front

# 4. Sintetizar plantillas CloudFormation con AWS CDK
pnpm cdk:synth

# 5. Desplegar toda la infraestructura en AWS
pnpm cdk:deploy
```

---

## 📚 Documentación

Para consultar los detalles completos de la solución:
- [Arquitectura del Sistema](docs/arquitectura.md)
- [Especificación de API REST](docs/api.md)
- [Guía de Despliegue](docs/despliegue.md)
- [Operación y Monitoreo](docs/operacion.md)
- [Estimación de Costos](docs/costos.md)
