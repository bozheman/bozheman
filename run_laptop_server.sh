#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

export PORT="${PORT:-8080}"
export BZP_STATIC_DIR="$DIR"
export BZP_AUTO_PULL="${BZP_AUTO_PULL:-true}"
export BZP_PULL_INTERVAL="${BZP_PULL_INTERVAL:-5m}"

echo "BOZHEMAN ≡ PROTOCOL — Laptop Node Server (port=$PORT, auto-pull=$BZP_AUTO_PULL every $BZP_PULL_INTERVAL)"

if command -v go >/dev/null 2>&1; then
  go build -o "$DIR/bozheman-server" ./cmd/server
fi

exec "$DIR/bozheman-server"
