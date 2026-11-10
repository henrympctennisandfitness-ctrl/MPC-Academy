#!/usr/bin/env bash
# supabase/tests/local/run-local.sh
#
# LOCAL harness: creates THROWAWAY databases on a plain PostgreSQL server, installs
# the Supabase shim, applies migrations 0001→latest in order, and runs the Phase 2B
# RLS role test. Never point this at a Supabase project.
#
# Runs twice, because 0011 must converge from either starting point:
#   default-grants     Supabase's default table grants (the shim's behaviour)
#   no-default-grants  no automatic table grants (the MPC development project)
#
# Usage (from the repo's mpc-academy/ folder):
#   PGHOST=/path/to/socket PGUSER=postgres supabase/tests/local/run-local.sh
#
# Requires: psql, a superuser connection (PG* env vars), PostgreSQL 15+.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"          # .../supabase
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)
DBS=()

cleanup() {
  for db in "${DBS[@]:-}"; do
    [ -n "$db" ] && "${PSQL[@]}" -d postgres -c "drop database if exists $db" >/dev/null 2>&1 || true
  done
}
trap cleanup EXIT

run_mode() {
  local mode="$1" db="mpc_rls_test_$$_${1//-/_}"
  DBS+=("$db")
  echo "=== $mode ==="
  "${PSQL[@]}" -d postgres -c "create database $db"
  "${PSQL[@]}" -d "$db" -f "$HERE/00_supabase_shim.sql"
  if [ "$mode" = "no-default-grants" ]; then
    "${PSQL[@]}" -d "$db" -f "$HERE/01_no_default_grants.sql"
  fi

  local f base
  for f in "$ROOT"/migrations/*.sql; do
    base="$(basename "$f")"
    if [ "${base:0:4}" = "0011" ]; then
      "${PSQL[@]}" -d "$db" -f "$HERE/10_pre_0011_legacy_data.sql" >/dev/null
    fi
    echo "apply $base"
    "${PSQL[@]}" -d "$db" -1 -f "$f" >/dev/null
    if [ "${base:0:4}" = "0011" ]; then
      "${PSQL[@]}" -d "$db" -f "$HERE/12_post_0011_data_moved.sql" >/dev/null
    fi
  done

  "${PSQL[@]}" -d "$db" -f "$ROOT/tests/phase2b_rls_roles.test.sql" >/dev/null
  echo "OK — $mode"
}

run_mode default-grants
run_mode no-default-grants
echo "OK — Phase 2B RLS role tests passed on a local PostgreSQL harness."
