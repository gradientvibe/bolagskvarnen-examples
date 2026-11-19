# Bolagskvarnen: MCP-server för svensk bolagsdata (Bolagsverket, SCB)

Svenska | [English](README.md)

En hostad MCP-server och ett REST-API för svensk bolagsdata: sök bolag, styrelse och firmateckning, historik och bokslut, med källa och hämtningstid i varje svar. Anslut Claude Code med ett kommando och en gratis testnyckel (sandlåda med påhittade bolag):

```bash
claude mcp add --transport http bolagskvarnen https://app.bolagskvarnen.se/mcp \
  --header "Authorization: Bearer $BOLAGSKVARNEN_KEY"
```

Server: `https://app.bolagskvarnen.se/mcp` (Streamable HTTP, OAuth 2.1 eller API-nyckel). Officiella MCP-registret: `se.bolagskvarnen/bolagskvarnen`. För klienter som bara startar ett lokalt kommando finns npm-paketet [`bolagskvarnen-mcp`](https://www.npmjs.com/package/bolagskvarnen-mcp): `npx -y bolagskvarnen-mcp` med nyckeln i `BOLAGSKVARNEN_KEY`. Guider per klient: [bolagskvarnen.se](https://bolagskvarnen.se/guider/mcp-server-for-bolagsdata/).

Kodexempel för **Bolagskvarnen** ([bolagskvarnen.se](https://bolagskvarnen.se)), en MCP-server och ett REST-API för svensk bolagsdata: sök bolag, hämta bolagsprofil, styrelse och firmateckning, historik, bokslut och en persons övriga uppdrag. Uppgifterna kommer från Bolagsverket och SCB, och varje svar anger källa och hämtningstid i `meta.attribution`.

Det här är leverantörens eget repo. Bolagskvarnen är ett varumärke i Bolagskällan AB (559555-5946).

## Läget, rakt på sak

- **Sandlådan är öppen.** En gratis testnyckel (`gb_test_...`) ger riktiga, fungerande svar om **påhittade bolag**. Inget i det här repot är ett riktigt bolag eller en riktig person.
- **Riktig data öppnar snart.** Tills dess svarar live-nycklar `503 blocked_by_phase`, medan OAuth-inloggning och testnycklar svarar från sandlådan. Exemplen nedan använder en testnyckel.
- Tjänsten är till för internt bruk i svenska företag, organisationer och myndigheter. Uppgifterna får inte säljas vidare eller visas för dina egna kunder. Se [villkoren](https://bolagskvarnen.se/villkor/).

## 1. Skaffa en testnyckel

Registrera dig gratis på [app.bolagskvarnen.se/registrera](https://app.bolagskvarnen.se/registrera) och skapa en nyckel under **Konto, Nycklar** med miljön **Test**. Lägg den i en miljövariabel:

```bash
export BOLAGSKVARNEN_KEY="gb_test_..."
```

Sandlådan har sju påhittade bolag i samma format som live-data. `569900-0013` (Exempelbolaget i Norrland AB) används nedan. `569900-0039` är ett avregistrerat bolag med tidigare styrelseledamöter, och `569900-0096` är ett giltigt nummer som inte finns, så att du kan prova felfallet.

## 2. Anslut MCP-servern

Serverns adress: `https://app.bolagskvarnen.se/mcp` (Streamable HTTP). Sju verktyg som bara läser: `gb_search_companies`, `gb_get_company`, `gb_get_company_roles`, `gb_get_company_history`, `gb_get_financials`, `gb_get_person_engagements`, `gb_get_account`.

Vad som fungerar i dag, per klient (kontrollerat 2026-11-13):

| Klient | Testnyckel (sandlådan, fungerar nu) | OAuth-inloggning |
|---|---|---|
| Claude Code | Ja | Sandlådan tills live-data öppnar |
| Cursor | Ja | Sandlådan tills live-data öppnar |
| VS Code med Copilot | Ja | Sandlådan tills live-data öppnar |
| Codex | Ja | Sandlådan tills live-data öppnar |
| claude.ai och Claude Desktop | Bara med betafunktionen Request headers | Sandlådan tills live-data öppnar |
| ChatGPT | Nej | Sandlådan tills live-data öppnar |

### Claude Code

```bash
claude mcp add --transport http bolagskvarnen https://app.bolagskvarnen.se/mcp \
  --header "Authorization: Bearer $BOLAGSKVARNEN_KEY"
```

Skriv sedan `/mcp` i Claude Code. Skalet byter ut variabeln, så nyckeln sparas i klartext i `~/.claude.json`. Lägg inte till servern med `--scope project`: då hamnar nyckeln i `.mcp.json`, som ofta checkas in.

### Claude Desktop och claude.ai

Customize, Connectors, Add custom connector. Namn `Bolagskvarnen`, adress `https://app.bolagskvarnen.se/mcp`. Inloggningen är OAuth och svarar från sandlådan tills live-data öppnar för ditt konto. Se [guiden för Claude](https://bolagskvarnen.se/guider/bolagsdata-i-claude/) för undantaget med Request headers.

### Cursor

Lägg detta i `~/.cursor/mcp.json` (alla projekt) eller `.cursor/mcp.json` (ett projekt), sätt `BOLAGSKVARNEN_KEY` i den miljö Cursor startar i och starta om Cursor. En färdig fil finns i [`mcp/cursor-mcp.json`](mcp/cursor-mcp.json).

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

### VS Code med Copilot

Kör **MCP: Add Server**, välj HTTP, ange adressen och id:t `bolagskvarnen`, och välj **Global**, **Copilot Global**. Lägg sedan till rubriken i `~/.copilot/mcp-config.json`. En färdig fil finns i [`mcp/vscode-copilot-mcp-config.json`](mcp/vscode-copilot-mcp-config.json).

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

Lägg detta i `~/.codex/config.toml`. Bara variabelns namn står i filen. En färdig fil finns i [`mcp/codex-config.toml`](mcp/codex-config.toml).

```toml
[mcp_servers.bolagskvarnen]
url = "https://app.bolagskvarnen.se/mcp"
bearer_token_env_var = "BOLAGSKVARNEN_KEY"
```

### Prova

Fråga assistenten: *"Vad är 569900-0013 för bolag, och är det aktivt?"* Den anropar `gb_get_company` och svarar ur sandlådan. Be om källa och kostnad så ser du `attribution` och `cost_sek` (alltid 0 i sandlådan).

Samma server card finns på [`/.well-known/mcp.json`](https://app.bolagskvarnen.se/.well-known/mcp.json), och registerposten ligger i [`server.json`](server.json).

## 3. Anropa REST-API:t

Bas-adress `https://app.bolagskvarnen.se/api/v1`. Nyckeln går i `Authorization: Bearer`. Varje svar har `status` (`ok` eller `error`), `data` eller `error`, och `meta`.

### curl

```bash
curl -s "https://app.bolagskvarnen.se/api/v1/companies/569900-0013" \
  -H "Authorization: Bearer $BOLAGSKVARNEN_KEY"
```

Se svaret från sandlådan i [den engelska README:n](README.md#curl). Fler anrop finns i [`rest/curl.sh`](rest/curl.sh): sök på namn, styrelse och firmateckning, historik, bokslut.

### Python

[`rest/python/lookup.py`](rest/python/lookup.py) hämtar ett bolag och dess styrelse:

```bash
pip install -r rest/python/requirements.txt
python rest/python/lookup.py 569900-0013
```

### TypeScript

[`rest/typescript/lookup.ts`](rest/typescript/lookup.ts) gör samma sak med `fetch` (Node 20 eller senare):

```bash
npx tsx rest/typescript/lookup.ts 569900-0013
```

### PHP och Go

De här två söker ett bolag på namn (standard `Exempelbolaget`) och skriver ut styrelse och firmateckning för första träffen. Nyckeln läses ur `BOLAGSKVARNEN_KEY`.

```bash
php rest/php/lookup.php Exempelbolaget               # PHP 8 med curl-tillägget
cd rest/go && go run . Exempelbolaget                # Go 1.21 eller senare
```

Kod: [`rest/php/lookup.php`](rest/php/lookup.php), [`rest/go/main.go`](rest/go/main.go).

### Postman

[`rest/postman/bolagskvarnen.postman_collection.json`](rest/postman/bolagskvarnen.postman_collection.json) har en mapp per tagg i [OpenAPI-filen](https://app.bolagskvarnen.se/openapi.json) och färdiga anrop mot sandlådan. Importera den i Postman och sätt samlingsvariabeln `api_key` till din testnyckel (`base_url` är redan satt). Kör *Hämta roller* före *Hämta engagemang*: det anropet sparar den `person_ref` som engagemangsanropet behöver. Bygg om samlingen med `node rest/postman/build.mjs` (Node 20 eller senare).

## Anrop

| Anrop | Sökväg |
|---|---|
| Sök (gratis upp till 1 000 per dygn) | `GET /api/v1/companies/search?q=...` |
| Bolagsprofil | `GET /api/v1/companies/{org_number}` (`?detail=full` för hela profilen) |
| Styrelse, vd, revisor, firmateckning | `GET /api/v1/companies/{org_number}/roles` |
| Historik | `GET /api/v1/companies/{org_number}/history?since=ÅÅÅÅ-MM-DD` |
| Bokslut, upp till fem år | `GET /api/v1/companies/{org_number}/financials?years=3` |
| En persons engagemang | `GET /api/v1/persons/{person_ref}/engagements` |
| Konto och saldo | `GET /api/v1/account` |

Personer identifieras med `person_ref`, som är bundet till ditt konto. Inga personnummer lämnas ut.

## Länkar

- Guide: [MCP-server för bolagsdata](https://bolagskvarnen.se/guider/mcp-server-for-bolagsdata/) (engelska: [MCP server for Swedish company data](https://bolagskvarnen.se/en/guides/mcp-server-swedish-company-data/))
- Dokumentation: [app.bolagskvarnen.se/docs](https://app.bolagskvarnen.se/docs)
- OpenAPI: [app.bolagskvarnen.se/openapi.json](https://app.bolagskvarnen.se/openapi.json)
- För AI-verktyg: [bolagskvarnen.se/llms.txt](https://bolagskvarnen.se/llms.txt) och [app.bolagskvarnen.se/llms.txt](https://app.bolagskvarnen.se/llms.txt)
- MCP server card: [app.bolagskvarnen.se/.well-known/mcp.json](https://app.bolagskvarnen.se/.well-known/mcp.json)
- Priser och abonnemang: [bolagskvarnen.se/priser/](https://bolagskvarnen.se/priser/)

## Licens

Koden och konfigurationen i det här repot har MIT-licens, se [LICENSE](LICENSE). Tjänsten, API:t och datan omfattas av Bolagskvarnens [villkor](https://bolagskvarnen.se/villkor/).
