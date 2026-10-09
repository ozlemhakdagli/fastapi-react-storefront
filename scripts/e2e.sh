#!/usr/bin/env bash
# Browser tests against a throw-away stack. The development database and the development servers
# (ports 8000 and 5173) are never used: this script creates the database ecommerce_e2e on the local
# PostgreSQL server, migrates and seeds it, starts an API on port 8100 and a Vite server on port
# 5273, runs Playwright, and stops everything again, also when a test fails or the script is
# interrupted.
#
# Usage, from any directory: scripts/e2e.sh [playwright test arguments]
#   scripts/e2e.sh                       every browser test
#   scripts/e2e.sh e2e/smoke.e2e.ts      one file (the path is relative to frontend/)
#   E2E_CHANNEL=chrome scripts/e2e.sh    use the Google Chrome installed on this computer
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

API_PORT=8100
WEB_PORT=5273
DB_NAME=ecommerce_e2e
# Python and Node tools run in the conda environment. E2E_RUN replaces that prefix; set it to an
# empty value when the environment is already active.
RUN=${E2E_RUN-conda run -n ecommerce --no-capture-output}

export E2E_BASE_URL="http://localhost:$WEB_PORT"
export E2E_API_URL="http://localhost:$API_PORT"
export E2E_ADMIN_EMAIL=e2e.admin@example.com
export E2E_ADMIN_PASSWORD='E2e-Admin-2026!'
export E2E_CUSTOMER_EMAIL=e2e.customer@example.com
export E2E_CUSTOMER_PASSWORD='E2e-Customer-2026!'

WORK=""
API_PID=""
WEB_PID=""
RUN_PID=""

die() {
  echo "e2e.sh: $*" >&2
  exit 1
}

# Prints "busy" when something accepts connections on the port, over IPv4 or IPv6 loopback.
port_state() {
  $RUN python -c '
import socket, sys

busy = False
for family, host in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
    try:
        with socket.socket(family) as probe:
            busy = busy or probe.connect_ex((host, int(sys.argv[1]))) == 0
    except OSError:
        pass  # this address family is not available on the machine
print("busy" if busy else "free")
' "$1"
}

# Stops the process group of a process started with setsid (its PID is the group ID): TERM
# first, KILL after five seconds for anything that ignores it.
stop_group() {
  [ -n "$1" ] || return 0
  kill -TERM -- "-$1" 2>/dev/null || return 0
  for _ in $(seq 10); do
    kill -0 -- "-$1" 2>/dev/null || return 0
    sleep 0.5
  done
  kill -KILL -- "-$1" 2>/dev/null || true
}

cleanup() {
  local status=$?
  trap - EXIT
  trap '' HUP INT TERM # a second Ctrl+C must not stop the cleanup half way
  set +e
  stop_group "$RUN_PID"
  stop_group "$WEB_PID"
  stop_group "$API_PID"
  "$REPO/scripts/db.sh" psql -q -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE)" >/dev/null
  [ -z "$WORK" ] || rm -rf "$WORK"
  exit "$status"
}

# Polls a URL for up to 30 seconds, the time the servers need to start.
wait_for() {
  for _ in $(seq 60); do
    curl -fs --max-time 5 -o /dev/null "$1" && return 0
    sleep 0.5
  done
  die "$2 does not answer at $1 after 30 seconds"
}

# Refuse to start, before anything is created, when PostgreSQL does not answer or a port is taken.
# The query asks the server itself: db.sh status reads the data folder of its own checkout, which a
# git worktree does not have.
"$REPO/scripts/db.sh" psql -Atc "SELECT 1" >/dev/null ||
  die "PostgreSQL does not answer (start it with scripts/db.sh start)"
for port in "$API_PORT" "$WEB_PORT"; do
  if [ "$(port_state "$port")" != free ]; then
    die "port $port is already in use: stop the process that listens on it"
  fi
done
command -v curl >/dev/null || die "curl is required"
command -v setsid >/dev/null || die "setsid (util-linux) is required"

# The server and role of DATABASE_URL in backend/.env, with the database ecommerce_e2e.
{ read -r OWNER; read -r E2E_DSN; } < <($RUN python -c '
import sys
from dotenv import dotenv_values
from psycopg.conninfo import conninfo_to_dict, make_conninfo

url = dotenv_values(sys.argv[1])["DATABASE_URL"]
print(conninfo_to_dict(url)["user"])
print(make_conninfo(url, dbname=sys.argv[2]))
' "$REPO/backend/.env" "$DB_NAME")

trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

WORK="$(mktemp -d)"
"$REPO/scripts/db.sh" psql -q -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE)" \
  -c "CREATE DATABASE $DB_NAME OWNER \"$OWNER\""

(
  cd "$REPO/backend"
  export DATABASE_URL="$E2E_DSN"
  $RUN python -m app.migrate
  ADMIN_EMAIL="$E2E_ADMIN_EMAIL" ADMIN_PASSWORD="$E2E_ADMIN_PASSWORD" \
    DEMO_CUSTOMER_EMAIL="$E2E_CUSTOMER_EMAIL" DEMO_CUSTOMER_PASSWORD="$E2E_CUSTOMER_PASSWORD" \
    $RUN python seed.py
)

# Each server starts in its own session (setsid): Ctrl+C reaches only this script, and the PID of
# each server is the process group that cleanup stops.
(
  cd "$REPO/backend"
  export DATABASE_URL="$E2E_DSN" UPLOAD_DIR="$WORK" CORS_ORIGINS="$E2E_BASE_URL"
  exec setsid $RUN uvicorn app.main:create_app --factory --port "$API_PORT" --log-level warning
) </dev/null &
API_PID=$!
wait_for "$E2E_API_URL/api/health" "the API"

(
  cd "$REPO/frontend"
  export VITE_API_PROXY="$E2E_API_URL"
  exec setsid $RUN npm run dev -- --port "$WEB_PORT" --strictPort --clearScreen false
) </dev/null &
WEB_PID=$!
wait_for "$E2E_BASE_URL/" "the frontend"

(
  cd "$REPO/frontend"
  exec setsid $RUN npx playwright test "$@"
) </dev/null &
RUN_PID=$!
# With set -e, a failed run ends the script with Playwright's exit code.
wait "$RUN_PID"
