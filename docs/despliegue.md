# Guia de Despliegue - CookingLab

## Requisitos

- Node.js 22 o superior.
- pnpm 11.21.0, tomado desde `package.json` por `pnpm/action-setup`.
- AWS CLI configurada con credenciales de despliegue.
- AWS CDK v2 mediante `npx cdk` o `pnpm --filter infra cdk`.

## Stacks CDK

| Stack | Responsabilidad |
| --- | --- |
| `cookinglab-<stage>-data` | DynamoDB single-table con GSI1/GSI2. |
| `cookinglab-<stage>-auth` | Cognito User Pool, client y grupos. |
| `cookinglab-<stage>-events` | EventBridge, Lambdas de notificacion, SNS y DLQ. |
| `cookinglab-<stage>-api` | API Gateway REST, authorizer Cognito y Lambdas HTTP. |
| `cookinglab-<stage>-front` | S3 privado, CloudFront, WAF y deploy del frontend. |
| `cookinglab-<stage>-observability` | Dashboard y alarmas CloudWatch. |
| `cookinglab-<stage>-cicd` | Rol OIDC para GitHub Actions. |

## Comandos CDK

Bootstrap inicial por cuenta y region:

```bash
cd infra
npx cdk bootstrap aws://ACCOUNT_ID/REGION
```

Sintetizar dev:

```bash
cd infra
npx cdk synth --context stage=dev
```

Desplegar CI/CD dev:

```bash
cd infra
npx cdk deploy cookinglab-dev-cicd --context stage=dev
```

Desplegar infraestructura dev sin frontend:

```bash
cd infra
npx cdk deploy cookinglab-dev-data cookinglab-dev-auth cookinglab-dev-events cookinglab-dev-api cookinglab-dev-observability cookinglab-dev-cicd --context stage=dev --require-approval never --outputs-file outputs.json
```

Desplegar frontend dev:

```bash
cd infra
npx cdk deploy cookinglab-dev-front --context stage=dev --require-approval never --outputs-file outputs-front.json
```

Desplegar produccion usa los mismos comandos cambiando `dev` por `prod` y `--context stage=prod`.

Destruir dev:

```bash
cd infra
npx cdk destroy --all --context stage=dev
```

## Pipeline

`ci.yml` corre en pull request hacia `dev` o `main`:

1. `pnpm install --frozen-lockfile`.
2. `pnpm run lint`.
3. `pnpm --filter backend run build`.
4. `pnpm --filter backend run test`.
5. `pnpm --filter frontend run build`.
6. `pnpm --filter infra run build`.
7. `npx cdk synth --context stage=dev`.

`deploy-dev.yml` corre en push a `dev`:

1. Instala dependencias.
2. Compila backend.
3. Asume el rol AWS por OIDC con `AWS_DEPLOY_ROLE_ARN`.
4. Crea placeholder minimo en `frontend/dist/index.html`.
5. Despliega infraestructura dev sin `FrontStack`.
6. Escribe `frontend/.env.production` con outputs de API y Cognito.
7. Construye frontend.
8. Despliega `FrontStack`.
9. Ejecuta smoke test contra `GET /healthz`.

`deploy-prod.yml` corre con tags `v*` y usa el environment `production`; sigue el mismo flujo que dev con stacks `cookinglab-prod-*`.

## GitHub Actions

El pipeline no guarda Access Keys de AWS. GitHub Actions asume un rol IAM mediante OIDC.

Desplegar una vez el stack CI/CD y copiar el output `GitHubActionsRoleArn` como repository secret:

```text
AWS_DEPLOY_ROLE_ARN=<valor del output GitHubActionsRoleArn>
```

Crear el environment `production` en GitHub y configurar required reviewers si el plan del repositorio lo permite; si no, usar branch protection o aprobacion manual alternativa.
