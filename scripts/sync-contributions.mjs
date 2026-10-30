// Refresh src/data/contributions.json from GitHub. Needs the GitHub CLI logged in (`gh auth login`).
// usage: npm run sync:contrib
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const LOGIN = process.env.GH_LOGIN ?? 'Jay-Naik2526'
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }

function query(from, to) {
  const range = from ? `(from: "${from}", to: "${to}")` : ''
  const q = `query { user(login: "${LOGIN}") { createdAt contributionsCollection${range} { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`
  const out = execFileSync('gh', ['api', 'graphql', '-f', `query=${q}`], { encoding: 'utf8' })
  const u = JSON.parse(out).data.user
  const cal = u.contributionsCollection.contributionCalendar
  const days = cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0 }))
  return { created: u.createdAt, total: cal.totalContributions, days }
}

const last = query()
const created = new Date(last.created).getFullYear()
const now = new Date().getFullYear()
const ranges = { last: { total: last.total, days: last.days } }
for (let y = now; y >= created; y--) {
  const r = query(`${y}-01-01T00:00:00Z`, `${y}-12-31T23:59:59Z`)
  ranges[String(y)] = { total: r.total, days: r.days }
}
writeFileSync(new URL('../src/data/contributions.json', import.meta.url), JSON.stringify({ login: LOGIN, syncedAt: new Date().toISOString(), ranges }))
console.log('synced', Object.keys(ranges).map((k) => `${k}:${ranges[k].total}`).join('  '))
