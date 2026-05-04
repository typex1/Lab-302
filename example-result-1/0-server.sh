#!/usr/bin/env bash
set -euo pipefail

PORT=8080

# Port-in-use check, preferring lsof, falling back to nc.
if command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $PORT is already in use" >&2
    exit 1
  fi
elif command -v nc >/dev/null 2>&1; then
  if nc -z localhost "$PORT" >/dev/null 2>&1; then
    echo "Port $PORT is already in use" >&2
    exit 1
  fi
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but was not found" >&2
  exit 1
fi

cd "$(dirname "$0")"
exec python3 -m http.server "$PORT"
