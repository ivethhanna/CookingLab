# Guia de Despliegue - CookingLab

## Requisitos

- Node.js 22 o superior.
- pnpm 11.21.0, tomado desde `package.json` por `pnpm/action-setup`.
- AWS CLI.
- AWS CDK v2 mediante `npx cdk` o `pnpm --filter infra cdk`.

## Primer Acceso a AWS

1. Crear un usuario IAM para despliegue inicial. No usar la cuenta root.
2. Para este proyecto academico, asignar temporalmente `AdministratorAccess`.
3. Crear access keys para ese usuario.
4. Configurar la CLI:

```bash
aws configure
```

Usar el Access Key ID y Secret Access Key del usuario IAM. No usar credenciales root.

## Bootstrap de CDK

Ejecutar una vez por cuenta y region:

```bash
cd infra
npx cdk bootstrap aws://ACCOUNT_ID/REGION
```

`ACCOUNT_ID` es el numero de cuenta AWS de 12 digitos. No es el Access Key ID. Este es un error comun durante el primer despliegue.

## Rol OIDC para GitHub Actions

El pipeline no guarda Access Keys en GitHub. GitHub Actions asume un rol IAM mediante OIDC.

Antes de usar el pipeline, desplegar manualmente una vez el stack de CI/CD:

```bash
cd infra
npx cdk deploy cookinglab-dev-cicd --context stage=dev
```

Para produccion, usar:

```bash
npx cdk deploy cookinglab-prod-cicd --context stage=prod
```

El output `GitHubActionsRoleArn` se debe copiar a GitHub como repository secret:

```text
AWS_DEPLOY_ROLE_ARN=<valor del output GitHubActionsRoleArn>
```

Si el proveedor OIDC de GitHub ya existe en la cuenta, el `CicdStack` actual lo importa con `OpenIdConnectProvider.fromOpenIdConnectProviderArn`.

## Environment de Produccion en GitHub

Crear el environment `production` en:

```text
Settings > Environments > New environment
```

Agregar required reviewers para que `deploy-prod.yml` espere aprobacion antes de desplegar. Segun la documentacion actual de GitHub, los required reviewers de environments estan disponibles en repositorios publicos para planes actuales. En repositorios privados, GitHub Free/Pro/Team permiten environments y secrets, pero los required reviewers como regla de proteccion requieren GitHub Enterprise; si el repositorio privado no muestra esa opcion, usar branch protection o aprobacion manual alternativa.

Fuente: GitHub Docs, "Deployments and environments" y "Reviewing deployments".

## Flujo Normal

1. Crear rama feature desde `dev`.
2. Abrir PR hacia `dev`.
3. `ci.yml` ejecuta lint, tests backend con Vitest, builds y `cdk synth`.
4. Hacer merge a `dev`.
5. `deploy-dev.yml` despliega automaticamente dev.
6. Crear tag `v*` para produccion.
7. `deploy-prod.yml` espera aprobacion del environment `production` y despliega prod.

## Orden Real de Deploy Dev

`deploy-dev.yml` usa este orden:

1. `pnpm install --frozen-lockfile`.
2. `pnpm --filter backend run build`.
3. Configurar credenciales AWS por OIDC.
4. Crear placeholder minimo en `frontend/dist/index.html`.
5. Desplegar infraestructura sin FrontStack:

```bash
npx cdk deploy cookinglab-dev-data cookinglab-dev-auth cookinglab-dev-events cookinglab-dev-api cookinglab-dev-observability cookinglab-dev-cicd --context stage=dev --require-approval never --outputs-file outputs.json
```

6. Leer `outputs.json` y escribir `frontend/.env.production` con `VITE_API_URL`, `VITE_USER_POOL_ID` y `VITE_USER_POOL_CLIENT_ID`.
7. Construir el frontend real con `pnpm --filter frontend run build`.
8. Desplegar solo FrontStack:

```bash
npx cdk deploy cookinglab-dev-front --context stage=dev --require-approval never --outputs-file outputs-front.json
```

9. Extraer `API_URL` desde `outputs.json` y ejecutar smoke test contra `/healthz`.

Este orden es necesario por dos razones:

- CDK sintetiza toda la app durante cualquier `cdk deploy`; como `FrontStack` empaqueta `frontend/dist`, se crea un placeholder para evitar `CannotFindAsset`.
- Vite inyecta variables `VITE_*` en tiempo de build; por eso el build real del frontend ocurre despues de desplegar AuthStack y ApiStack, cuando ya existen los outputs de Cognito y API Gateway.

`deploy-prod.yml` sigue el mismo patron con stacks `cookinglab-prod-*` y `STAGE=prod`.

## Despliegue Canary de Lambdas

`CreateWorkshopFunction` y `RegisterWorkshopFunction` se publican mediante alias `live` y CodeDeploy. API Gateway apunta al alias, por lo que una nueva version se mueve con estrategia canary:

```text
10% de trafico por 5 minutos -> 100% si no hay alarmas
```

Si la alarma de errores dedicada entra en estado ALARM durante el canary, CodeDeploy revierte el alias `live` a la version anterior. Las demas Lambdas siguen el despliegue directo normal de CDK.

## Problemas Comunes Durante el Primer Despliegue

### Confundir Account ID con Access Key ID

`cdk bootstrap aws://ACCOUNT_ID/REGION` requiere el numero de cuenta AWS de 12 digitos. El Access Key ID empieza con prefijos como `AKIA...` y no sirve para bootstrap.

### Artefactos compilados junto a TypeScript

No deben existir `.js` ni `.d.ts` generados junto a los `.ts` fuente en:

- `infra/bin`
- `infra/lib`
- `backend/src`

El repositorio incluye reglas locales:

```text
infra/.gitignore: bin/**/*.js, bin/**/*.d.ts, lib/**/*.js, lib/**/*.d.ts
backend/.gitignore: src/**/*.js, src/**/*.d.ts
```

Esto evita que Node resuelva artefactos viejos y oculte cambios en TypeScript.
