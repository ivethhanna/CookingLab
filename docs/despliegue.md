# Guia de Despliegue - AWS CDK v2, pnpm y GitHub Actions

## Requisitos Previos

1. Node.js 22 o superior.
2. pnpm: `npm install -g pnpm`.
3. AWS CLI configurado para el primer bootstrap y el primer deploy manual del stack de CI/CD.
4. AWS CDK CLI disponible via `pnpm --filter infra cdk`.

## Configuracion Inicial de AWS

Instala dependencias:

```bash
pnpm install
```

Ejecuta bootstrap de CDK una vez por cuenta y region:

```bash
cd infra
pnpm cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

## GitHub Actions con OIDC

El proyecto usa GitHub Actions OIDC para desplegar sin guardar access keys en GitHub.

Antes de desplegar el stack de CI/CD, edita `infra/lib/stacks/cicd-stack.ts` y reemplaza:

```text
repo:TU_USUARIO/cookinglab-serverless-aws:*
```

por el usuario u organizacion real de GitHub, por ejemplo:

```text
repo:mi-org/cookinglab-serverless-aws:*
```

Luego despliega el stack de CI/CD:

```bash
cd infra
npx cdk deploy cookinglab-dev-cicd --context stage=dev
```

El output `GitHubActionsRoleArn` es el ARN que debe configurarse en GitHub.

En GitHub, crea el secret:

1. Abre `Settings > Secrets and variables > Actions`.
2. Crea un repository secret llamado `AWS_DEPLOY_ROLE_ARN`.
3. Pega el valor del output `GitHubActionsRoleArn`.

Si el proveedor OIDC de GitHub ya existe en la cuenta AWS, cambia `cicd-stack.ts` para usar la variante comentada con `iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn` en vez de crear un provider nuevo.

## Workflows

### Pull Request

Un pull request hacia `dev` o `main` ejecuta `.github/workflows/ci.yml`:

```text
checkout -> Node 22 + pnpm -> install -> lint -> build backend -> test backend -> build frontend -> build infra -> cdk synth dev
```

No hace deploy.

### Deploy a Dev

Un push a la rama `dev` ejecuta `.github/workflows/deploy-dev.yml`:

```text
checkout -> Node 22 + pnpm -> install -> build backend/frontend -> OIDC assume role -> cdk deploy dev -> smoke test /healthz
```

El deploy escribe `infra/outputs.json`, lee `cookinglab-dev-api.ApiUrl` y ejecuta un smoke test contra:

```text
${API_URL}/healthz
```

### Deploy a Produccion

Un tag que matchee `v*`, por ejemplo `v1.0.0`, ejecuta `.github/workflows/deploy-prod.yml` con `environment: production`.

Configura manualmente en GitHub:

```text
Settings > Environments > production
```

y agrega una protection rule que requiera reviewer antes de ejecutar el job.

## Flujo Completo

1. Crear PR hacia `dev`.
2. GitHub Actions ejecuta checks de CI.
3. Merge a `dev`.
4. Deploy automatico a `dev`.
5. Smoke test automatico contra `/healthz`.
6. Crear tag, por ejemplo `v1.0.0`.
7. Deploy a `prod` queda esperando aprobacion manual del environment `production`.
8. Al aprobar, GitHub Actions despliega `prod` y ejecuta smoke test.

## Orden de Stacks

1. `cookinglab-<stage>-data`: tabla DynamoDB.
2. `cookinglab-<stage>-auth`: Cognito User Pool.
3. `cookinglab-<stage>-events`: EventBus, SNS Topic y SQS DLQ.
4. `cookinglab-<stage>-api`: API Gateway y Lambdas.
5. `cookinglab-<stage>-front`: bucket S3, CloudFront, OAC y WAF.
6. `cookinglab-<stage>-observability`: alarms y dashboard CloudWatch.
7. `cookinglab-<stage>-cicd`: role OIDC para GitHub Actions.
