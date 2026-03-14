#!/usr/bin/env bash
set -euo pipefail

if ! command -v aws >/dev/null 2>&1; then
  echo "Error: aws CLI is not installed or not in PATH." >&2
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
ECS_CLUSTER="${ECS_CLUSTER:-futbol7-poc-workers-cluster}"
ECS_SERVICE="${ECS_SERVICE:-futbol7-poc-workers-service}"

aws ecs describe-services \
  --region "$AWS_REGION" \
  --cluster "$ECS_CLUSTER" \
  --services "$ECS_SERVICE" \
  --query 'services[0].{serviceName:serviceName,status:status,desiredCount:desiredCount,runningCount:runningCount,pendingCount:pendingCount,taskDefinition:taskDefinition}' \
  --output table

