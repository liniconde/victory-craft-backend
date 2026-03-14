Cómo usarlos:

./scripts/ecs-workers-start.sh
./scripts/ecs-workers-stop.sh
./scripts/ecs-workers-status.sh

Opcional con variables:

AWS_REGION=us-east-1 ECS_CLUSTER=futbol7-poc-workers-cluster ECS_SERVICE=futbol7-poc-workers-service ./scripts/ecs-workers-status.sh
Sobre autoapagado:

No quedó configurado aún el apagado automático por colas vacías.
Lo que tienes ahora es control manual (start/stop) y desired_count=0 por defecto para evitar costo cuando no lo usas.
Si quieres, siguiente paso te monto el auto on/off con CloudWatch + Lambda para que se encienda/apague solo por actividad de SQS.
