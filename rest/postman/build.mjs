// Builds a Postman collection (v2.1) from the public OpenAPI file.
//
// Usage (Node 20 or later):
//   node rest/postman/build.mjs                      # fetches https://app.bolagskvarnen.se/openapi.json
//   node rest/postman/build.mjs path/to/openapi.json # or reads a local file
//
// Writes rest/postman/bolagskvarnen.postman_collection.json next to this script.
// One folder per OpenAPI tag, one request per operation. Path and query values come from the
// examples in the OpenAPI file (fictional sandbox companies). The key is never stored in the file.

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = process.argv[2] ?? "https://app.bolagskvarnen.se/openapi.json";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "bolagskvarnen.postman_collection.json");

async function loadSpec() {
  if (/^https?:\/\//.test(SOURCE)) {
    const res = await fetch(SOURCE);
    if (!res.ok) throw new Error(`GET ${SOURCE} answered ${res.status}`);
    return res.json();
  }
  return JSON.parse(await readFile(SOURCE, "utf8"));
}

// Values that make the sandbox call work. Used when the OpenAPI file has no example.
const FALLBACK = { limit: "10", years: "3", since: "2026-01-01", detail: "concise" };

function buildRequest(method, path, op) {
  const segments = path.split("/").filter(Boolean).map((s) => {
    const m = /^\{(.+)\}$/.exec(s);
    return m ? `{{${m[1]}}}` : s; // path parameters become variables, e.g. {{org_number}}
  });
  const query = [];
  const headers = [{ key: "Accept", value: "application/json" }];
  for (const p of op.parameters ?? []) {
    if (p.in === "query") {
      const value = p.example ?? p.schema?.default ?? FALLBACK[p.name] ?? "";
      // Required parameters are on; optional ones are listed but switched off.
      query.push({ key: p.name, value: String(value), disabled: !p.required, description: p.description });
    } else if (p.in === "header") {
      headers.push({ key: p.name, value: "", disabled: true, description: p.description });
    }
  }
  const description = [op.description, op.summary].find(Boolean);
  return {
    method: method.toUpperCase(),
    header: headers,
    url: {
      raw: `{{base_url}}/${segments.join("/")}${query.some((q) => !q.disabled) ? "?" + query.filter((q) => !q.disabled).map((q) => `${q.key}=${q.value}`).join("&") : ""}`,
      host: ["{{base_url}}"],
      path: segments,
      query,
      variable: [],
    },
    description,
  };
}

const spec = await loadSpec();
const tags = (spec.tags ?? []).map((t) => t.name);
const folders = new Map(tags.map((t) => [t, { name: t, description: spec.tags.find((x) => x.name === t)?.description, item: [] }]));
const pathVars = new Map();

for (const [path, ops] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(ops)) {
    if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
    const tag = op.tags?.[0] ?? "Övrigt";
    if (!folders.has(tag)) folders.set(tag, { name: tag, item: [] });
    for (const p of op.parameters ?? []) {
      if (p.in === "path") pathVars.set(p.name, p.example ?? "");
    }
    const item = { name: `${op.summary ?? op.operationId} (${method.toUpperCase()} ${path})`, request: buildRequest(method, path, op) };
    // The roles call stores the first person_ref so that the engagements request works right after it.
    if (op.operationId === "get_company_roles") {
      item.event = [{
        listen: "test",
        script: {
          type: "text/javascript",
          exec: [
            "const body = pm.response.json();",
            "const hit = ((body.data || {}).roles || []).find((r) => r.person_ref);",
            "if (hit) { pm.collectionVariables.set('person_ref', hit.person_ref); }",
          ],
        },
      }];
    }
    folders.get(tag).item.push(item);
  }
}

const variable = [
  { key: "base_url", value: spec.servers?.[0]?.url ?? "https://app.bolagskvarnen.se/api/v1", type: "string" },
  { key: "api_key", value: "", type: "secret", description: "Your test key (gb_test_...). Leave it empty here and set it in your own environment." },
  ...[...pathVars].map(([key, value]) => ({
    key,
    value: key === "person_ref" ? "" : String(value),
    type: "string",
    ...(key === "person_ref" ? { description: "Filled in by the roles request. Run Get roles first." } : {}),
  })),
];

const collection = {
  info: {
    name: spec.info.title,
    description: "Calls for the Bolagskvarnen REST API, generated from https://app.bolagskvarnen.se/openapi.json by rest/postman/build.mjs. Set api_key to a test key (gb_test_...) to run the examples against the sandbox (fictional companies).",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: { type: "bearer", bearer: [{ key: "token", value: "{{api_key}}", type: "string" }] },
  variable,
  item: [...folders.values()].filter((f) => f.item.length > 0),
};

await writeFile(OUT, JSON.stringify(collection, null, 2) + "\n");
console.log(`Wrote ${OUT} (${collection.item.map((f) => `${f.name}: ${f.item.length}`).join(", ")})`);
