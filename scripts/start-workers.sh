#!/usr/bin/env bash
set -euo pipefail

echo "[workers] starting analysisJobsConsumer and workerAgentResultsConsumer"

cleanup() {
  echo "[workers] shutdown signal received, stopping child processes"
  if [[ -n "${PID_ANALYSIS:-}" ]]; then
    kill -TERM "$PID_ANALYSIS" 2>/dev/null || true
  fi
  if [[ -n "${PID_MCP_RESULTS:-}" ]]; then
    kill -TERM "$PID_MCP_RESULTS" 2>/dev/null || true
  fi
  wait || true
}

trap cleanup SIGINT SIGTERM

node dist/workers/analysisJobsConsumer.js &
PID_ANALYSIS=$!

node dist/workers/workerAgentResultsConsumer.js &
PID_MCP_RESULTS=$!

set +e
EXIT_CODE=0

while true; do
  if ! kill -0 "$PID_ANALYSIS" 2>/dev/null; then
    wait "$PID_ANALYSIS"
    EXIT_CODE=$?
    break
  fi

  if ! kill -0 "$PID_MCP_RESULTS" 2>/dev/null; then
    wait "$PID_MCP_RESULTS"
    EXIT_CODE=$?
    break
  fi

  sleep 1
done

set -e

echo "[workers] one worker exited (code: $EXIT_CODE), stopping remaining process"
cleanup
exit "$EXIT_CODE"
