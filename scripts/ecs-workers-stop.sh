#!/usr/bin/env bash
set -euo pipefail

if ! command -v aws >/dev/null 2>&1; then
  echo "Error: aws CLI is not installed or not in PATH." >&2
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
ECS_CLUSTER="${ECS_CLUSTER:-futbol7-poc-workers-cluster}"
ECS_SERVICE="${ECS_SERVICE:-futbol7-poc-workers-service}"

echo "Stopping ECS workers..."
echo "Region:  $AWS_REGION"
echo "Cluster: $ECS_CLUSTER"
echo "Service: $ECS_SERVICE"
echo "Desired: 0"

aws ecs update-service \
  --region "$AWS_REGION" \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --desired-count 0 \
  --query 'service.{serviceName:serviceName,desiredCount:desiredCount,runningCount:runningCount,pendingCount:pendingCount,status:status}' \
  --output table

