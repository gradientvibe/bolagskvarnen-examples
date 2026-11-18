// Runs the bridge against a local fake MCP server and checks that tools/list and tools/call pass
// through, and that the key arrives as a Bearer header. Run with: node test/proxy.test.mjs
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const seen = []
const http = createServer(async (req, res) => {
  seen.push({ auth: req.headers.authorization, ua: req.headers['user-agent'] })
  if (req.headers.authorization !== 'Bearer gb_test_fake') {
    res.writeHead(401).end()
    return
  }
  const server = new McpServer({ name: 'fake', version: '0.0.0' })
  server.tool('gb_ping', 'Answers pong', async () => ({ content: [{ type: 'text', text: 'pong' }] }))
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  res.on('close', () => transport.close())
  await server.connect(transport)
  let body = ''
  for await (const chunk of req) body += chunk
  await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined)
})
await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve))
const url = `http://127.0.0.1:${http.address().port}/mcp`
const bin = fileURLToPath(new URL('../index.js', import.meta.url))

async function run(key) {
  const client = new Client({ name: 'test', version: '0.0.0' })
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [bin],
    env: { ...process.env, BOLAGSKVARNEN_KEY: key, BOLAGSKVARNEN_MCP_URL: url },
    stderr: 'pipe',
  })
  await client.connect(transport)
  return client
}

const client = await run('gb_test_fake')
const { tools } = await client.listTools()
assert.deepEqual(tools.map((t) => t.name), ['gb_ping'])
const result = await client.callTool({ name: 'gb_ping', arguments: {} })
assert.equal(result.content[0].text, 'pong')
await client.close()
assert.ok(seen.every((s) => s.auth === 'Bearer gb_test_fake'))
assert.match(seen[0].ua, /^bolagskvarnen-mcp\/\d/)

await assert.rejects(run('gb_test_wrong'), 'a wrong key should fail the connection')

http.close()
console.log(`ok: ${tools.length} tool, ${seen.length} requests, wrong key rejected`)
