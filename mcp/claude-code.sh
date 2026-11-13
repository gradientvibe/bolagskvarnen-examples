#!/usr/bin/env bash
# Connect the Bolagskvarnen MCP server to Claude Code with a test key (sandbox, fictional companies).
# Usage: BOLAGSKVARNEN_KEY=gb_test_... ./claude-code.sh
set -euo pipefail

: "${BOLAGSKVARNEN_KEY:?Set BOLAGSKVARNEN_KEY to a test key (gb_test_...)}"

# The shell expands the variable, so the key is stored in plain text in ~/.claude.json.
# Do not add --scope project: that writes the key to .mcp.json, which is often committed.
claude mcp add --transport http bolagskvarnen https://app.bolagskvarnen.se/mcp \
  --header "Authorization: Bearer $BOLAGSKVARNEN_KEY"

echo "Done. Type /mcp in Claude Code to check the connection."
