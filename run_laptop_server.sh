#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

export PORT="${PORT:-8080}"
export BZP_STATIC_DIR="$DIR"
export BZP_AUTO_PULL="${BZP_AUTO_PULL:-true}"
export BZP_PULL_INTERVAL="${BZP_PULL_INTERVAL:-20s}"

echo "BOZHEMAN ≡ PROTOCOL — Supervisor Node (port=$PORT, auto-pull=$BZP_AUTO_PULL every $BZP_PULL_INTERVAL)"

# Stop any previous instance gracefully before entering the supervisor loop
pkill -f "$DIR/bozheman-server" >/dev/null 2>&1 || pkill -f "bozheman-server" >/dev/null 2>&1 || true
sleep 1

while true; do
  if command -v git >/dev/null 2>&1 && [ -d "$DIR/.git" ]; then
    git fetch origin main >/dev/null 2>&1 && git reset --hard origin/main >/dev/null 2>&1 || true
  fi

  if command -v go >/dev/null 2>&1; then
    go build -o "$DIR/bozheman-server" ./cmd/server || true
  fi

  if [ -x "$DIR/bozheman-server" ]; then
    set +e
    "$DIR/bozheman-server"
    EXIT_CODE=$?
    set -e
    echo "[supervisor] bozheman-server exited with code $EXIT_CODE — restarting in 2s..."
  else
    echo "[supervisor] bozheman-server binary missing, retrying in 5s..."
    sleep 3
  fi
  sleep 2
done
