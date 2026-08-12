# Estimación de Costos y Free Tier - CookingLab

## Modelo de Costos Serverless (Pay-per-use)

La arquitectura de CookingLab fue diseñada para maximizar el uso de la **Capa Gratuita de AWS (AWS Free Tier)** y minimizar costos operativos durante entornos académicos o de desarrollo.

---

## Desglose por Servicio AWS

| Servicio AWS | Modelo de Cobro | Estimación en Free Tier / Dev |
| :--- | :--- | :--- |
| **AWS Lambda** | $0.20 por 1M de solicitudes + GB-segundos | **$0.00** (Incluye 1M peticiones/mes y 3.2M segundos de cómputo) |
| **Amazon DynamoDB** | Pay-per-request (On-Demand) | **$0.00** (Incluye 25 GB de almacenamiento y 25 WCU/RCU gratis) |
| **Amazon API Gateway** | $3.50 por millón de llamadas | **$0.00** (Incluye 1M llamadas/mes gratis el primer año) |
| **Amazon Cognito** | Basado en MAUs (Monthly Active Users) | **$0.00** (Primeros 50,000 MAUs son 100% gratuitos) |
| **Amazon EventBridge** | $1.00 por millón de eventos | **$0.00** (Todos los eventos custom son gratis en Free Tier) |
| **Amazon S3** | $0.023 por GB almacenado | **$0.00** (Incluye 5 GB de almacenamiento estándar gratis) |
| **Amazon CloudFront** | $0.085 por GB transferido | **$0.00** (Incluye 1 TB de transferencia de salida gratis/mes) |
| **AWS CloudWatch** | Métricas y Dashboards | **$0.00** (3 dashboards y 10 alarmas sin costo) |

---

## Recomendaciones para Optimización de Costos
1. **Entorno Dev**: El parámetro `RemovalPolicy.DESTROY` destruye automáticamente buckets S3 y tablas DynamoDB al ejecutar `cdk destroy` para evitar sorpresas en la facturación.
2. **Capacidad DynamoDB**: Mantener la facturación en modo `PAY_PER_REQUEST` (On-Demand) para pagar exclusivamente por las lecturas/escrituras efectuadas.
