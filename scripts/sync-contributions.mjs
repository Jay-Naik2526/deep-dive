// Refresh src/data/contributions.json from GitHub so the page always ships with a recent snapshot.
// (In the browser the page also pulls live data; this is the fallback and the first paint.)
//
//   node scripts/sync-contributions.mjs          needs `gh auth login`, or GH_TOKEN / GITHUB_TOKEN in the environment
//   node scripts/sync-contributions.mjs --soft   never fails: if it can't reach GitHub it keeps the existing file (used by `npm run build`)
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const LOGIN = process.env.GH_LOGIN ?? 'Jay-Naik2526'
const SOFT = process.argv.includes('--soft')
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }

async function graphql(query) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  if (token) {
    const r = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'portfolio-sync' },
      body: JSON.stringify({ query }),
    })
    const j = await r.json()
    if (!r.ok || j.errors) throw new Error(JSON.stringify(j.errors ?? r.status))
    return j
  }
  return JSON.parse(execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
}

async function query(from, to) {
  const range = from ? `(from: "${from}", to: "${to}")` : ''
  const q = `query { user(login: "${LOGIN}") { createdAt contributionsCollection${range} { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`
  const u = (await graphql(q)).data.user
  const cal = u.contributionsCollection.contributionCalendar
  const days = cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0 }))
  return { created: u.createdAt, total: cal.totalContributions, days }
}

try {
  const last = await query()
  const created = new Date(last.created).getFullYear()
  const now = new Date().getFullYear()
  const ranges = { last: { total: last.total, days: last.days } }
  for (let y = now; y >= created; y--) {
    const r = await query(`${y}-01-01T00:00:00Z`, `${y}-12-31T23:59:59Z`)
    ranges[String(y)] = { total: r.total, days: r.days }
  }
  writeFileSync(new URL('../src/data/contributions.json', import.meta.url), JSON.stringify({ login: LOGIN, syncedAt: new Date().toISOString(), ranges }))
  console.log('synced', Object.keys(ranges).map((k) => `${k}:${ranges[k].total}`).join('  '))
} catch (e) {
  if (!SOFT) throw e
  console.warn('contributions: could not refresh (no gh login or GH_TOKEN?). Keeping the existing snapshot.')
}
