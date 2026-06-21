#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:${PATH}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$ROOT_DIR/.dev-server.log"
PID_FILE="$ROOT_DIR/.dev-server.pid"

cd "$ROOT_DIR"

pkill -f "next dev -p 3000" >/dev/null 2>&1 || true

echo "[web] starting Next.js on :3000"
nohup node ./node_modules/.bin/next dev -p 3000 > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

echo "[web] pid: $NEW_PID"
echo "[web] log:  $LOG_FILE"

echo "[web] waiting for server"
for _ in {1..25}; do
  if lsof -iTCP:3000 -sTCP:LISTEN -nP >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

echo "[web] status:"
tail -n 20 "$LOG_FILE"
