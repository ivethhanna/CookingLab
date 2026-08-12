# Guía de Operación y Monitoreo - CookingLab

## Observabilidad y Métricas

La infraestructura cuenta con métricas consolidadas e inspección distribuida mediante **AWS CloudWatch** y **AWS X-Ray**.

---

## 1. CloudWatch Dashboard & Alarmas
- **Dashboard Name**: `cookinglab-metrics-<stage>`
- **Alertas Principales**:
  - `cookinglab-api-5xx-errors-<stage>`: Se activa si ocurren más de 5 errores HTTP 5xx en un período de 5 minutos en API Gateway.
  - **DynamoDB Throttling**: Monitoreo de solicitudes rechazadas en GSI1 y GSI2.

---

## 2. Inspección de Eventos Fallidos (DLQ en SQS)
Si una notificación o handler asíncrono en EventBridge falla tras varios re-intentos, el mensaje se redirige a la cola **FIFO Dead Letter Queue (DLQ)**:
- **Queue Name**: `cookinglab-dlq-<stage>.fifo`
- **Procedimiento de Inspección**:
  1. Ir a la consola SQS en AWS.
  2. Seleccionar la cola `cookinglab-dlq-dev.fifo`.
  3. Ejecutar "Poll for messages" para auditar los eventos fallidos.

---

## 3. Trazabilidad con AWS X-Ray
Todas las funciones Lambda y API Gateway tienen habilitado el rastreo (tracing). Permite visualizar el mapa de servicio completo de una petición HTTP desde API Gateway hasta DynamoDB.
