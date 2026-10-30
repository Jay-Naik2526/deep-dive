// Pings every external link on the site. Network required. Run: npm run check:links
import { featured, shallows, profile } from '../src/data.ts'

const urls = [...new Set([profile.site, profile.github, profile.linkedin, profile.resume, ...[...featured, ...shallows].flatMap((p) => [p.url, p.repo]).filter(Boolean)])]
// linkedin blocks bots with a 999; treat it as fine
const ok = (u, s) => (s >= 200 && s < 400) || (u.includes('linkedin.com') && s === 999)

const results = await Promise.all(urls.map(async (u) => {
  try {
    const c = new AbortController()
    const t = setTimeout(() => c.abort(), 12000)
    let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: c.signal })
    if (r.status === 405 || r.status === 403) r = await fetch(u, { redirect: 'follow', signal: c.signal })
    clearTimeout(t)
    return { u, s: r.status }
  } catch (e) {
    return { u, s: 0, e: e.cause?.code ?? e.name }
  }
}))

let bad = 0
for (const r of results) {
  const good = ok(r.u, r.s)
  if (!good) bad++
  console.log(`${good ? 'ok  ' : 'FAIL'} ${String(r.s || r.e).padEnd(10)} ${r.u}`)
}
console.log(bad ? `\n${bad} link(s) need attention` : '\nall links healthy')
process.exit(bad ? 1 : 0)
