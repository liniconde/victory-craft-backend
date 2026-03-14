#!/usr/bin/env bash
set -euo pipefail

if ! command -v aws >/dev/null 2>&1; then
  echo "Error: aws CLI is not installed or not in PATH." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required to compute date ranges." >&2
  exit 1
fi

START="$(
  python3 - <<'PY'
from datetime import datetime
print(datetime.utcnow().strftime("%Y-%m-01"))
PY
)"

END="$(
  python3 - <<'PY'
from datetime import datetime, timedelta
print((datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"))
PY
)"

echo "AWS Cost Explorer report"
echo "Period (UTC): $START -> $END (end exclusive)"
echo

echo "Total month-to-date:"
aws ce get-cost-and-usage \
  --time-period Start="$START",End="$END" \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --query 'ResultsByTime[0].Total.UnblendedCost' \
  --output table

echo
echo "Month-to-date by service:"
aws ce get-cost-and-usage \
  --time-period Start="$START",End="$END" \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[0].Groups[].[Keys[0],Metrics.UnblendedCost.Amount,Metrics.UnblendedCost.Unit]' \
  --output table

echo
echo "Done."
