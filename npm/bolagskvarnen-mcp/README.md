# bolagskvarnen-mcp

MCP server for Swedish company data (Bolagsverket, SCB) from [Bolagskvarnen](https://bolagskvarnen.se): company search, board and signatories, history and financial statements, with source and retrieval time in every response.

This package connects MCP clients that start a local command (stdio) to Bolagskvarnen's hosted server at `https://app.bolagskvarnen.se/mcp`. Clients that support remote servers can use that URL directly instead.

## Use

Get a free test key (`gb_test_...`, a sandbox with fictional companies) at [app.bolagskvarnen.se/registrera](https://app.bolagskvarnen.se/registrera). Real data opens soon.

```json
{
  "mcpServers": {
    "bolagskvarnen": {
      "command": "npx",
      "args": ["-y", "bolagskvarnen-mcp"],
      "env": { "BOLAGSKVARNEN_KEY": "gb_test_..." }
    }
  }
}
```

Claude Code:

```bash
claude mcp add bolagskvarnen -e BOLAGSKVARNEN_KEY=gb_test_... -- npx -y bolagskvarnen-mcp
```

Never commit a key to a repository. Examples for each client and for the REST API: [gradientvibe/bolagskvarnen-examples](https://github.com/gradientvibe/bolagskvarnen-examples). Official MCP Registry: `se.bolagskvarnen/bolagskvarnen`.

The service is for internal use by Swedish companies and organisations. Bolagskvarnen is a brand of Bolagskällan AB (559555-5946). MIT licence.
