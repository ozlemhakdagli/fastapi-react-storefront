#!/bin/sh
# Runs once, when the database volume is created (docker-entrypoint-initdb.d). The application gets
# its own login role without superuser rights, and that role owns the ecommerce database.
set -eu
psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres -v pw="$APP_DB_PASSWORD" <<'SQL'
CREATE ROLE ecommerce LOGIN PASSWORD :'pw';
CREATE DATABASE ecommerce OWNER ecommerce;
SQL
