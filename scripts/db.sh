#!/usr/bin/env bash
# Local PostgreSQL for development, run as a separate process from the conda env `pg18`.
#
# Usage: scripts/db.sh init | start | stop | status | psql [psql args] | drop-test-dbs
#
# Connection settings come from DATABASE_URL in backend/.env
# (postgresql://user:password@host:port/dbname). Data lives in <repo>/.pgdata.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGDATA="$REPO/.pgdata"
ENV_FILE="$REPO/backend/.env"
PG_BIN="$(conda info --base)/envs/pg18/bin"

die() {
  echo "db.sh: $*" >&2
  exit 1
}

[ -x "$PG_BIN/pg_ctl" ] || die "pg_ctl not found in $PG_BIN (create the pg18 conda env first)"
[ -f "$ENV_FILE" ] || die "$ENV_FILE not found (copy backend/.env.example to backend/.env)"

url="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n 1 | cut -d= -f2-)"
[ -n "$url" ] || die "DATABASE_URL is not set in $ENV_FILE"

# postgresql://user:password@host:port/dbname
re='^postgres(ql)?://([^:@/]+):([^@]*)@([^:/]+):([0-9]+)/([^?]+)'
[[ "$url" =~ $re ]] || die "DATABASE_URL must look like postgresql://user:password@host:port/dbname"
DB_USER="${BASH_REMATCH[2]}"
DB_PASSWORD="${BASH_REMATCH[3]}"
DB_PORT="${BASH_REMATCH[5]}"
DB_NAME="${BASH_REMATCH[6]}"

ident='^[a-z_][a-z0-9_]*$'
[[ "$DB_USER" =~ $ident ]] || die "database user must match $ident"
[[ "$DB_NAME" =~ $ident ]] || die "database name must match $ident"

# The unix socket needs a short path (the limit is 107 bytes, and a project folder deep in a home
# directory exceeds it), so it lives in /tmp. Local connections use "trust", so the socket is
# restricted to the owner (0700); TCP listens on localhost only and needs a password.
SOCKET_DIR="/tmp"
SERVER_OPTS="-p $DB_PORT -k $SOCKET_DIR -c unix_socket_permissions=0700 -c listen_addresses=localhost"

superuser_psql() {
  "$PG_BIN/psql" -h "$SOCKET_DIR" -p "$DB_PORT" -U postgres -v ON_ERROR_STOP=1 "$@"
}

cmd_init() {
  if [ -f "$PGDATA/PG_VERSION" ]; then
    echo "Data directory already initialised: $PGDATA"
    return 0
  fi
  "$PG_BIN/initdb" -D "$PGDATA" -E UTF8 -U postgres --auth-local=trust --auth-host=scram-sha-256
  cmd_start
  superuser_psql -d postgres -v pw="$DB_PASSWORD" <<SQL
CREATE ROLE $DB_USER LOGIN CREATEDB PASSWORD :'pw';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
SQL
  echo "Created role $DB_USER and database $DB_NAME."
}

cmd_start() {
  [ -f "$PGDATA/PG_VERSION" ] || die "no data directory yet, run: scripts/db.sh init"
  if "$PG_BIN/pg_ctl" status -D "$PGDATA" > /dev/null 2>&1; then
    echo "PostgreSQL is already running."
    return 0
  fi
  "$PG_BIN/pg_ctl" start -D "$PGDATA" -l "$PGDATA/server.log" -w -o "$SERVER_OPTS"
}

cmd_stop() {
  "$PG_BIN/pg_ctl" stop -D "$PGDATA" -m fast -w
}

cmd_status() {
  if "$PG_BIN/pg_ctl" status -D "$PGDATA" > /dev/null 2>&1; then
    echo "PostgreSQL is running on localhost:$DB_PORT (database $DB_NAME)."
    return 0
  fi
  echo "PostgreSQL is stopped."
  return 3
}

cmd_psql() {
  # Superuser over the local socket, connected to the application database.
  superuser_psql -d "$DB_NAME" "$@"
}

cmd_drop_test_dbs() {
  local names name
  names="$(superuser_psql -d postgres -At -c \
    "SELECT datname FROM pg_database WHERE datname ~ '^${DB_NAME}_test_'")"
  for name in $names; do
    superuser_psql -d postgres -c "DROP DATABASE \"$name\" WITH (FORCE)"
  done
}

case "${1:-}" in
  init) cmd_init ;;
  start) cmd_start ;;
  stop) cmd_stop ;;
  status) cmd_status ;;
  psql) shift; cmd_psql "$@" ;;
  drop-test-dbs) cmd_drop_test_dbs ;;
  *) die "usage: scripts/db.sh init | start | stop | status | psql [args] | drop-test-dbs" ;;
esac
