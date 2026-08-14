# Costos - CookingLab

Esta estimacion describe el entorno `dev` con trafico bajo, tipico de un proyecto academico. Los valores son aproximados y dependen de region, Free Tier vigente, transferencia real y volumen de logs. No incluye impuestos.

## Estimacion mensual para dev

| Servicio | Modelo de precio | Estimacion USD/mes |
| --- | --- | ---: |
| S3 frontend | Pago por uso: almacenamiento, requests y transferencia hacia CloudFront | 0.00 - 0.50 |
| CloudFront | Pago por uso: transferencia y requests | 0.00 - 1.00 |
| API Gateway REST | Pago por request | 0.00 - 1.00 |
| Lambda | Pago por invocacion y GB-segundo | 0.00 - 0.50 |
| DynamoDB on-demand | Pago por request y almacenamiento | 0.00 - 1.00 |
| Cognito | Pago por usuarios activos mensuales despues del free tier | 0.00 |
| WAF | Costo fijo por Web ACL/reglas + requests; es el principal costo base | 6.00 - 7.00 |
| SNS | Pago por publish/entrega | 0.00 - 0.50 |
| EventBridge | Pago por eventos custom | 0.00 - 0.50 |
| CloudWatch | Pago por logs, metricas/alarmas/dashboard fuera de free tier | 0.00 - 2.00 |

Para trafico bajo, el costo esperado de dev esta dominado por WAF. Sin WAF, el entorno puede quedar cerca de cero si el uso permanece dentro de Free Tier; con WAF activo, esperar aproximadamente 6-7 USD/mes como costo base.

## Como bajar costos

- Apagar o retirar WAF cuando no se esten tomando evidencias activamente.
- Ejecutar `cdk destroy --all --context stage=dev` cuando no se este trabajando en dev.
- Reducir volumen y retencion de logs de CloudWatch si el trafico de pruebas genera muchos logs.
- Mantener DynamoDB en modo on-demand para evitar capacidad aprovisionada ociosa.
- Eliminar distribuciones CloudFront, buckets y tablas dev que ya no se usen.
