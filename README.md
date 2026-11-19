# Bolagskvarnen: remote MCP server for Swedish company data (Bolagsverket, SCB)

[Svenska](README.sv.md) | English

Hosted MCP server and REST API for Swedish company data: company search, board and signatories, history and financial statements, with source and retrieval time in every response. Connect Claude Code with one command and a free test key (sandbox with fictional companies):

```bash
claude mcp add --transport http bolagskvarnen https://app.bolagskvarnen.se/mcp \
  --header "Authorization: Bearer $BOLAGSKVARNEN_KEY"
```

Server: `https://app.bolagskvarnen.se/mcp` (Streamable HTTP, OAuth 2.1 or API key). Official MCP Registry: `se.bolagskvarnen/bolagskvarnen`. For clients that only start a local command, use the npm package [`bolagskvarnen-mcp`](https://www.npmjs.com/package/bolagskvarnen-mcp): `npx -y bolagskvarnen-mcp` with the key in `BOLAGSKVARNEN_KEY`. Docs and client guides: [bolagskvarnen.se](https://bolagskvarnen.se/en/guides/mcp-server-swedish-company-data/).

Code examples for **Bolagskvarnen** ([bolagskvarnen.se](https://bolagskvarnen.se)), an MCP server and REST API for Swedish company data: search companies, get the company profile, board and signatories, change history, financial statements and a person's other engagements. The data comes from Bolagsverket (the Swedish Companies Registration Office) and SCB (Statistics Sweden), and every response states its source and retrieval time in `meta.attribution`.

This is the vendor's own repository. Bolagskvarnen is a brand of Bolagskällan AB (559555-5946).

## Status, in plain words

- **The sandbox is open.** A free test key (`gb_test_...`) gives real, working responses about **fictional companies**. Nothing in this repository is a real company or a real person.
- **Real data opens soon.** Until then, live keys and OAuth sign-in answer `503 blocked_by_phase`. That is why the examples below use a test key.
- The service is for internal use by Swedish companies, organisations and agencies. The data may not be resold or shown to your own customers. See the [terms](https://bolagskvarnen.se/villkor/).

## 1. Get a test key

Register for free at [app.bolagskvarnen.se/registrera](https://app.bolagskvarnen.se/registrera), then create a key under **Account, Keys** with the environment **Test**. Keep it in an environment variable:

```bash
export BOLAGSKVARNEN_KEY="gb_test_..."
```

The sandbox has seven fictional companies in the same format as live data. `569900-0013` (Exempelbolaget i Norrland AB) is the one used below. `569900-0039` is a deregistered company with former board members, and `569900-0096` is a valid number that does not exist, so you can test the not-found case.

## 2. Connect the MCP server

Server address: `https://app.bolagskvarnen.se/mcp` (Streamable HTTP). Six read-only tools: `gb_search_companies`, `gb_get_company`, `gb_get_company_roles`, `gb_get_company_history`, `gb_get_financials`, `gb_get_person_engagements`.

What works today, by client (checked 2026-11-13):

| Client | Test key (sandbox, works now) | OAuth sign-in |
|---|---|---|
| Claude Code | Yes | Answers when live data opens |
| Cursor | Yes | Answers when live data opens |
| VS Code with Copilot | Yes | Answers when live data opens |
| Codex | Yes | Answers when live data opens |
| claude.ai and Claude Desktop | Only with the beta feature Request headers | Answers when live data opens |
| ChatGPT | No | Answers when live data opens |

### Claude Code

```bash
claude mcp add --transport http bolagskvarnen https://app.bolagskvarnen.se/mcp \
  --header "Authorization: Bearer $BOLAGSKVARNEN_KEY"
```

Then type `/mcp` in Claude Code. The shell expands the variable, so the key is stored in plain text in `~/.claude.json`. Do not add it with `--scope project`, because that writes the key to `.mcp.json`, which is often committed.

### Claude Desktop and claude.ai

Customize, Connectors, Add custom connector. Name `Bolagskvarnen`, address `https://app.bolagskvarnen.se/mcp`. Sign-in is OAuth, so answers arrive when live data opens. See the [guide for Claude](https://bolagskvarnen.se/en/guides/mcp-server-swedish-company-data/) for the Request headers exception.

### Cursor

Put this in `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project), set `BOLAGSKVARNEN_KEY` in the environment Cursor starts in, and restart Cursor. A ready file is in [`mcp/cursor-mcp.json`](mcp/cursor-mcp.json).

```json
{
  "mcpServers": {
    "bolagskvarnen": {
      "url": "https://app.bolagskvarnen.se/mcp",
      "headers": {
        "Authorization": "Bearer ${env:BOLAGSKVARNEN_KEY}"
      }
    }
  }
}
```

### VS Code with Copilot

Run **MCP: Add Server**, choose HTTP, enter the address and the id `bolagskvarnen`, and pick **Global**, **Copilot Global**. Then add the header to `~/.copilot/mcp-config.json`. A ready file is in [`mcp/vscode-copilot-mcp-config.json`](mcp/vscode-copilot-mcp-config.json).

```json
{
  "mcpServers": {
    "bolagskvarnen": {
      "type": "http",
      "url": "https://app.bolagskvarnen.se/mcp",
      "headers": {
        "Authorization": "Bearer ${BOLAGSKVARNEN_KEY}"
      }
    }
  }
}
```

### Codex

Add this to `~/.codex/config.toml`. Only the variable name is stored in the file. A ready file is in [`mcp/codex-config.toml`](mcp/codex-config.toml).

```toml
[mcp_servers.bolagskvarnen]
url = "https://app.bolagskvarnen.se/mcp"
bearer_token_env_var = "BOLAGSKVARNEN_KEY"
```

### Try it

Ask your assistant: *"What kind of company is 569900-0013, and is it active?"* It calls `gb_get_company` and answers from the sandbox. Ask for the source and cost to see `attribution` and `cost_sek` (always 0 in the sandbox).

The same server card is published at [`/.well-known/mcp.json`](https://app.bolagskvarnen.se/.well-known/mcp.json), and the registry entry is in [`server.json`](server.json).

## 3. Call the REST API

Base URL `https://app.bolagskvarnen.se/api/v1`. The key goes in `Authorization: Bearer`. Every response has `status` (`ok` or `error`), `data` or `error`, and `meta`.

### curl

```bash
curl -s "https://app.bolagskvarnen.se/api/v1/companies/569900-0013" \
  -H "Authorization: Bearer $BOLAGSKVARNEN_KEY"
```

A response from the sandbox:

```json
{
  "status": "ok",
  "data": {
    "org_number": "569900-0013",
    "name": "Exempelbolaget i Norrland AB",
    "legal_form": { "code": "AB", "text": "Aktiebolag" },
    "is_sole_trader": false,
    "status": { "active": true, "code": 100, "text": "Aktiv", "detailed": "Aktiv", "date": null },
    "registered_date": "2015-03-10",
    "seat": { "municipality": "Umeå", "region": "Västerbottens län" },
    "industry": { "sni_code": "62010", "text": "Dataprogrammering" }
  },
  "meta": {
    "source": ["sandbox"],
    "attribution": [
      { "source": "getbolag-sandbox", "supplier": "Bolagskvarnen", "notice": "Påhittad testdata. Inga riktiga bolag eller personer." }
    ],
    "cost_sek": 0,
    "environment": "test"
  }
}
```

(Shortened. The full response also has `request_id`, `retrieved_at`, `data_updated_at`, `database`, `publisher` and `coverage`.)

More calls are in [`rest/curl.sh`](rest/curl.sh): search by name, board and signatories, history, financial statements.

### Python

[`rest/python/lookup.py`](rest/python/lookup.py) fetches a company and its board:

```bash
pip install -r rest/python/requirements.txt
python rest/python/lookup.py 569900-0013
```

### TypeScript

[`rest/typescript/lookup.ts`](rest/typescript/lookup.ts) does the same with `fetch` (Node 20 or later):

```bash
npx tsx rest/typescript/lookup.ts 569900-0013
```

## Endpoints

| Call | Path |
|---|---|
| Search (free up to 1,000 a day) | `GET /api/v1/companies/search?q=...` |
| Company profile | `GET /api/v1/companies/{org_number}` (`?detail=full` for the full profile) |
| Board, CEO, auditor, signatories | `GET /api/v1/companies/{org_number}/roles` |
| Change history | `GET /api/v1/companies/{org_number}/history?since=YYYY-MM-DD` |
| Financial statements, up to five years | `GET /api/v1/companies/{org_number}/financials?years=3` |
| A person's engagements | `GET /api/v1/persons/{person_ref}/engagements` |
| Account and balance | `GET /api/v1/account` |

People are identified by `person_ref`, which is bound to your account. No personal identity numbers are returned.

## Links

- Guide: [MCP server for Swedish company data](https://bolagskvarnen.se/en/guides/mcp-server-swedish-company-data/) (Swedish: [MCP-server för bolagsdata](https://bolagskvarnen.se/guider/mcp-server-for-bolagsdata/))
- Documentation: [app.bolagskvarnen.se/docs](https://app.bolagskvarnen.se/docs)
- OpenAPI: [app.bolagskvarnen.se/openapi.json](https://app.bolagskvarnen.se/openapi.json)
- For AI tools: [bolagskvarnen.se/llms.txt](https://bolagskvarnen.se/llms.txt) and [app.bolagskvarnen.se/llms.txt](https://app.bolagskvarnen.se/llms.txt)
- MCP server card: [app.bolagskvarnen.se/.well-known/mcp.json](https://app.bolagskvarnen.se/.well-known/mcp.json)
- Prices and plans: [bolagskvarnen.se/priser/](https://bolagskvarnen.se/priser/)

## License

The code and configuration in this repository are MIT licensed, see [LICENSE](LICENSE). The service itself, the API and the data are covered by Bolagskvarnen's [terms](https://bolagskvarnen.se/villkor/).
