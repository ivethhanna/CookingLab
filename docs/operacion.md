# Guia de Operacion y Monitoreo - CookingLab

## Alarmas

| Alarma | Umbral | Causa probable | Accion inicial |
| --- | --- | --- | --- |
| `cookinglab-api-5xx-errors-<stage>` | Mas de 5 errores 5XX en 5 minutos | Excepcion en Lambda, error de integracion API Gateway o dependencia AWS fallando | Revisar logs de API Gateway/Lambda y ultimo despliegue. |
| `<LambdaFunction>-errors-<stage>` | Mas de 3 errores en 5 minutos | Bug en handler, permisos IAM faltantes, item DynamoDB inesperado o evento mal formado | Abrir CloudWatch Logs de la funcion y correlacionar con request/evento. |
| `<LambdaFunction>-p99-duration-<stage>` | p99 mayor a 5 segundos en 5 minutos | Query lenta, retries AWS SDK, cold starts o dependencia degradada | Revisar duracion por funcion, memoria y patrones de acceso DynamoDB. |
| `cookinglab-lambda-throttles-<stage>` | Al menos 1 throttle Lambda en 5 minutos | Concurrencia agotada o trafico inusual | Revisar concurrencia, volumen de requests y si API Gateway esta limitando correctamente. |

Las alarmas notifican al SNS Topic del stack de eventos. El dashboard principal es `cookinglab-overview-<stage>`.

## Runbook: DynamoDB Backup y Restore

En `prod`, DynamoDB tiene point-in-time recovery habilitado. En `dev`, la tabla usa `RemovalPolicy.DESTROY` y PITR esta deshabilitado para reducir costos.

Crear backup on-demand:

```bash
aws dynamodb create-backup \
  --table-name cookinglab-prod-workshops \
  --backup-name cookinglab-prod-workshops-YYYYMMDD
```

Listar backups:

```bash
aws dynamodb list-backups --table-name cookinglab-prod-workshops
```

Restaurar desde backup on-demand hacia una tabla nueva:

```bash
aws dynamodb restore-table-from-backup \
  --target-table-name cookinglab-prod-workshops-restore \
  --backup-arn BACKUP_ARN
```

Restaurar con point-in-time recovery hacia una tabla nueva:

```bash
aws dynamodb restore-table-to-point-in-time \
  --source-table-name cookinglab-prod-workshops \
  --target-table-name cookinglab-prod-workshops-restore \
  --restore-date-time 2026-08-13T12:00:00Z
```

Despues de restaurar, validar datos e indices antes de redirigir trafico o copiar registros.

## Runbook: Usuarios de Prueba Cognito

Crear usuario:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id USER_POOL_ID \
  --username evaluador@example.com \
  --user-attributes Name=email,Value=evaluador@example.com Name=name,Value=Evaluador
```

Asignar contrasena permanente para cuentas temporales:

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id USER_POOL_ID \
  --username evaluador@example.com \
  --password 'Password123' \
  --permanent
```

Agregar usuario al grupo admin:

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id USER_POOL_ID \
  --username evaluador@example.com \
  --group-name admin
```

Rotar o eliminar cuentas compartidas despues de la evaluacion.

## Runbook: DLQ de Eventos

`EventsStack` crea `cookinglab-notifications-dlq-<stage>`.

1. Abrir SQS y seleccionar la DLQ del stage.
2. Hacer polling de mensajes.
3. Revisar el payload fallido y la regla de EventBridge asociada.
4. Revisar logs de la Lambda de notificacion.
5. Reprocesar manualmente solo despues de confirmar que la causa fue corregida.

## Runbook: Throttling API Gateway

El stage aplica 50 rps/100 burst global y `POST /workshops/{id}/register` aplica 10 rps/20 burst.

Si aparecen muchos `429 Too Many Requests`:

1. Confirmar si el trafico es legitimo o automatizado.
2. Revisar CloudWatch Metrics de API Gateway por metodo.
3. Mantener el limite bajo para `/register` si hay abuso.
4. Subir limites solo si el trafico legitimo lo requiere.

## Troubleshooting Operativo

### pnpm version conflict

Usar la version fijada por `packageManager` en `package.json`. En GitHub Actions, `pnpm/action-setup` toma esa version antes de `pnpm install --frozen-lockfile`.

### Backticks en bash

En scripts de GitHub Actions, evitar envolver comandos o rutas con backticks Markdown. Los bloques `run` deben contener comandos shell reales.

### CannotFindAsset para `frontend/dist`

El deploy crea un placeholder minimo en `frontend/dist/index.html` antes del primer `cdk deploy` porque `FrontStack` empaqueta ese directorio durante la sintesis.

### Orden de Cognito y build frontend

El frontend necesita `VITE_API_URL`, `VITE_USER_POOL_ID` y `VITE_USER_POOL_CLIENT_ID` en tiempo de build. Por eso el pipeline despliega primero Auth/API, escribe `frontend/.env.production`, construye frontend y luego despliega `FrontStack`.

### newPasswordRequired en Cognito

Los usuarios creados manualmente pueden quedar en `FORCE_CHANGE_PASSWORD`. Completar el challenge en la UI o usar `admin-set-user-password --permanent` para cuentas temporales.

### CodeDeploy subscription error

La implementacion actual no usa CodeDeploy, alias Lambda ni deployment groups. Si vuelve a aparecer un error de suscripcion/permisos de CodeDeploy, revisar que no se hayan reintroducido recursos `AWS::CodeDeploy::*` o `AWS::Lambda::Alias` en `infra/cdk.out`.

### Artefactos compilados junto a TypeScript

No deben existir `.js` ni `.d.ts` generados junto a los `.ts` fuente en `infra/bin`, `infra/lib` o `backend/src`. Las reglas de `.gitignore` locales evitan que esos artefactos se versionen.
