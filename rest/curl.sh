#!/usr/bin/env bash
# REST examples against the Bolagskvarnen sandbox (fictional companies).
# Usage: BOLAGSKVARNEN_KEY=gb_test_... ./curl.sh
set -euo pipefail

: "${BOLAGSKVARNEN_KEY:?Set BOLAGSKVARNEN_KEY to a test key (gb_test_...)}"
BASE="${BOLAGSKVARNEN_URL:-https://app.bolagskvarnen.se/api/v1}"

get() {
  echo "### GET $1"
  curl -s "$BASE$1" -H "Authorization: Bearer $BOLAGSKVARNEN_KEY"
  echo
  echo
}

# Search by name (a name needs at least four characters). Free up to 1,000 a day.
get "/companies/search?q=exempel&limit=10"

# Company profile. ?detail=full adds addresses, tax status, activity, former names and share capital.
get "/companies/569900-0013"

# Board, CEO, auditor and signatory rights.
get "/companies/569900-0013/roles"

# Registered changes since a date.
get "/companies/569900-0013/history?since=2026-01-01"

# Financial statements, up to five years (limited companies only).
get "/companies/569900-0013/financials?years=3"

# A deregistered company, with former roles.
get "/companies/569900-0039/roles?include_former=true"

# A valid number that does not exist: HTTP 404 and error.code "not_found".
get "/companies/569900-0096"
