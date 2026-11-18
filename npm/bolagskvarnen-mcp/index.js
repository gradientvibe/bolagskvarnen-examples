#!/usr/bin/env node
// bolagskvarnen-mcp: connects an MCP client that speaks stdio to Bolagskvarnen's hosted MCP server
// (Streamable HTTP). It forwards JSON-RPC messages both ways and adds the API key as a Bearer header.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const url = process.env.BOLAGSKVARNEN_MCP_URL || 'https://app.bolagskvarnen.se/mcp'
const key = process.env.BOLAGSKVARNEN_KEY

if (process.argv.includes('--version')) {
  console.log(version)
  process.exit(0)
}

if (!key) {
  console.error(
    'bolagskvarnen-mcp: set BOLAGSKVARNEN_KEY to your API key.\n' +
      'A free test key (gb_test_..., fictional companies) is created at https://app.bolagskvarnen.se/registrera.',
  )
  process.exit(1)
}

const remote = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: {
    headers: {
      Authorization: `Bearer ${key}`,
      'User-Agent': `bolagskvarnen-mcp/${version} (node ${process.version})`,
    },
  },
})
const local = new StdioServerTransport()

let closing = false
async function close(code) {
  if (closing) return
  closing = true
  await Promise.allSettled([remote.close(), local.close()])
  process.exitCode = code
}

local.onmessage = (message) => {
  remote.send(message).catch((error) => {
    // remote.onerror has already logged the error. Answer the request so the client does not wait forever.
    if (message.id !== undefined && message.method) {
      local.send({ jsonrpc: '2.0', id: message.id, error: { code: -32000, message: error.message } }).catch(() => {})
    }
  })
}
remote.onmessage = (message) => {
  local.send(message).catch((error) => console.error(`bolagskvarnen-mcp: ${error.message}`))
}
remote.onerror = (error) => console.error(`bolagskvarnen-mcp: ${error.message}`)
local.onerror = (error) => console.error(`bolagskvarnen-mcp: ${error.message}`)
remote.onclose = () => close(0)
local.onclose = () => close(0)

await remote.start()
await local.start()
