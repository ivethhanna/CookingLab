# Guia de Operacion y Monitoreo - CookingLab

## Observabilidad

La observabilidad real se define en `ObservabilityStack`:

- Dashboard: `cookinglab-overview-<stage>`.
- Alarma API 5XX: `cookinglab-api-5xx-errors-<stage>`, umbral mayor a 5 errores 5XX en 5 minutos.
- Alarmas por Lambda: errores mayores a 3 en 5 minutos y duracion p99 mayor a 5 segundos.
- Alarma agregada de throttles Lambda.
- Graficas de API TPS, latencia P95, errores 4XX/5XX, capacidad consumida de DynamoDB y duracion promedio Lambda.
- Alarmas dedicadas de CodeDeploy para rollback automatico de las Lambdas criticas `CreateWorkshopFunction` y `RegisterWorkshopFunction`.

Las alarmas notifican al SNS Topic de notificaciones del stack de eventos.

## Deploy Blue/Green de Lambdas Criticas

`ApiStack` publica un alias `live` para las Lambdas de escritura mas sensibles:

- `CreateWorkshopFunction`
- `RegisterWorkshopFunction`

API Gateway invoca esos alias, no la version `$LATEST`. CodeDeploy despliega nuevas versiones con `CANARY_10PERCENT_5MINUTES`: 10% del trafico va a la version nueva durante 5 minutos y, si las alarmas no entran en estado ALARM, luego avanza al 100%.

Si una alarma de errores de CodeDeploy se dispara durante el canary, CodeDeploy revierte automaticamente el alias `live` a la version anterior.

## Throttling de API Gateway

El stage de API Gateway aplica limites conservadores para bajo trafico academico:

- Global: 50 requests por segundo y burst de 100.
- `POST /workshops/{id}/register`: 10 requests por segundo y burst de 20.

Cuando se exceden esos limites, API Gateway responde `429 Too Many Requests` antes de invocar Lambda. Si aparece un volumen sostenido de 429 en logs o metricas, revisar si es trafico legitimo antes de subir limites.

## DLQ de Eventos

`EventsStack` crea una SQS DLQ:

```text
cookinglab-notifications-dlq-<stage>
```

Para revisar fallos:

1. Abrir la consola SQS.
2. Seleccionar `cookinglab-notifications-dlq-dev` o el stage correspondiente.
3. Ejecutar polling de mensajes.
4. Revisar el evento fallido y los logs de la Lambda de notificacion asociada.

## Cognito y Usuarios

El User Pool tiene grupos `admin` y `student`. Las rutas admin validan el grupo `admin` leyendo el claim `cognito:groups`.

Para crear usuarios de prueba desde CLI:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id USER_POOL_ID \
  --username evaluador@example.com \
  --user-attributes Name=email,Value=evaluador@example.com Name=name,Value=Evaluador
```

Los usuarios creados manualmente suelen quedar en `FORCE_CHANGE_PASSWORD`. El frontend soporta ese flujo con el formulario de nueva contrasena. Si se van a compartir credenciales con un tercero, por ejemplo un evaluador, se puede establecer una contrasena permanente:

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id USER_POOL_ID \
  --username evaluador@example.com \
  --password 'Password123' \
  --permanent
```

Rotar o eliminar esa cuenta antes de la entrega final si ya no se necesita.

## Backup y Restore

En `prod`, la tabla DynamoDB habilita point-in-time recovery. En `dev`, la tabla usa `RemovalPolicy.DESTROY` y no habilita PITR para reducir costos.

Para restauraciones en prod, usar Point-in-time recovery desde la consola DynamoDB y validar la tabla restaurada antes de redirigir trafico o copiar datos.

## Deploy y Smoke Test

El deploy normal ocurre por GitHub Actions. Dev se activa por push a `dev`; prod por tags `v*` y environment `production`.

El smoke test usa el output `ApiUrl` del ApiStack y valida:

```text
GET /healthz
```

La respuesta esperada es HTTP 200 con un JSON que incluye `status: "ok"` y `timestamp`.

## Troubleshooting

- `CannotFindAsset` para `frontend/dist`: verificar que el workflow cree el placeholder antes del primer `cdk deploy`.
- Frontend con Cognito "not configured": verificar que `frontend/.env.production` se genere antes de `pnpm --filter frontend run build`.
- `Cannot find name 'process'` en infra: revisar `infra/tsconfig.json`, que debe incluir `types: ["node"]`.
- Login de usuario manual exige nueva contrasena: completar el challenge en la UI o usar `admin-set-user-password --permanent` para cuentas temporales de prueba.
