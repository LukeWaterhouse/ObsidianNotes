#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT/.dev-pids"
LOG_DIR="$ROOT/.dev/logs"
API_PORT=5080
WEB_PORT=5173

port_listening() {
  lsof -ti "tcp:${1}" -sTCP:LISTEN >/dev/null 2>&1
}

if [[ -f "$PID_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$PID_FILE"
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    echo "Dev stack already running (API pid $API_PID). Run ./dev-down.sh first."
    exit 1
  fi
  if [[ -n "${WEB_PID:-}" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    echo "Dev stack already running (web pid $WEB_PID). Run ./dev-down.sh first."
    exit 1
  fi
fi

if port_listening "$API_PORT" || port_listening "$WEB_PORT"; then
  echo "Ports $API_PORT or $WEB_PORT are in use. Run ./dev-down.sh or free them manually."
  exit 1
fi

mkdir -p "$LOG_DIR"

if [[ ! -d "$ROOT/web/node_modules" ]]; then
  echo "Installing web dependencies…"
  (cd "$ROOT/web" && npm install)
fi

echo "Starting API on http://localhost:${API_PORT}…"
(
  cd "$ROOT/api/CodeLearning.Api"
  exec dotnet run --launch-profile http
) >"$LOG_DIR/api.log" 2>&1 &
API_PID=$!

echo "Starting web on http://localhost:${WEB_PORT}…"
(
  cd "$ROOT/web"
  exec npm run dev -- --host 127.0.0.1 --port "$WEB_PORT"
) >"$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!

cat >"$PID_FILE" <<EOF
API_PID=$API_PID
WEB_PID=$WEB_PID
API_PORT=$API_PORT
WEB_PORT=$WEB_PORT
EOF

wait_for_port() {
  local port=$1
  local label=$2
  for _ in $(seq 1 60); do
    if port_listening "$port"; then
      echo "$label ready on port $port"
      return 0
    fi
    sleep 0.5
  done
  echo "Timed out waiting for $label (port $port). See $LOG_DIR"
  return 1
}

wait_for_port "$API_PORT" "API"
wait_for_port "$WEB_PORT" "Web"

echo ""
echo "Dev stack is up."
echo "  UI:  http://localhost:${WEB_PORT}"
echo "  API: http://localhost:${API_PORT}"
echo "Logs: $LOG_DIR"
echo "Stop: $ROOT/dev-down.sh"
