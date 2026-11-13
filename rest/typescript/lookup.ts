// Fetch a company and its board from the Bolagskvarnen sandbox.
//
// Usage:
//   export BOLAGSKVARNEN_KEY=gb_test_...
//   npx tsx lookup.ts 569900-0013
//
// Needs a test key (fictional companies). Live data is not open yet. Node 20 or later.

const BASE = process.env.BOLAGSKVARNEN_URL ?? 'https://app.bolagskvarnen.se/api/v1'

interface Meta {
  attribution: { supplier: string }[]
  cost_sek: number
}

interface Company {
  org_number: string
  name: string
  legal_form: { text: string } | null
  status: { text: string }
  seat: { municipality: string | null } | null
}

interface Role {
  role: string
  name: string
  from_date: string | null
}

interface Roles {
  roles: Role[]
  signatory_rights: string[]
}

async function get<T>(path: string): Promise<{ data: T; meta: Meta }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${process.env.BOLAGSKVARNEN_KEY}` },
  })
  const body = await res.json()
  if (body.status !== 'ok') {
    throw new Error(`${body.error.code}: ${body.error.message}`)
  }
  return body
}

async function main(): Promise<void> {
  if (!process.env.BOLAGSKVARNEN_KEY) {
    console.error('Set BOLAGSKVARNEN_KEY to a test key (gb_test_...).')
    process.exitCode = 1
    return
  }
  const orgNumber = process.argv[2] ?? '569900-0013'

  const company = await get<Company>(`/companies/${orgNumber}`)
  const c = company.data
  console.log(`${c.name} (${c.org_number})`)
  console.log(`  form:   ${c.legal_form?.text ?? 'unknown'}`)
  console.log(`  status: ${c.status.text}`)
  console.log(`  seat:   ${c.seat?.municipality ?? 'unknown'}`)
  console.log(`  source: ${company.meta.attribution.map((a) => a.supplier).join(', ')}, cost ${company.meta.cost_sek} SEK`)

  const roles = (await get<Roles>(`/companies/${orgNumber}/roles`)).data
  console.log('Board and other roles:')
  for (const r of roles.roles) {
    console.log(`  ${r.role}: ${r.name} (from ${r.from_date})`)
  }
  for (const text of roles.signatory_rights) {
    console.log(`  Signatory rights: ${text}`)
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
