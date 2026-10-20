#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT/.dev-pids"
API_PORT=5080
WEB_PORT=5173

kill_pid() {
  local pid=$1
  if [[ -z "$pid" ]]; then
    return 0
  fi
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      if ! kill -0 "$pid" 2>/dev/null; then
        return 0
      fi
      sleep 0.25
    done
    kill -9 "$pid" 2>/dev/null || true
  fi
}

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.5
    pids=$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

if [[ -f "$PID_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$PID_FILE"
  API_PORT=${API_PORT:-5080}
  WEB_PORT=${WEB_PORT:-5173}
  echo "Stopping API (pid ${API_PID:-unknown})…"
  kill_pid "${API_PID:-}"
  echo "Stopping web (pid ${WEB_PID:-unknown})…"
  kill_pid "${WEB_PID:-}"
  rm -f "$PID_FILE"
else
  echo "No pid file at $PID_FILE; cleaning ports $API_PORT and $WEB_PORT."
fi

kill_port "$API_PORT"
kill_port "$WEB_PORT"

echo "Dev stack stopped."
