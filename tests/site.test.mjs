// Fast, offline checks that catch the mistakes that actually break this site: missing images, duplicate ids, bad data.
// Run with: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { featured, reef, allProjects, depthOf, sections, profile, logbook, skillGroups, writeups, offers, testimonials, nowItems, nowUpdated } from '../src/data.ts'

const root = new URL('../', import.meta.url)
const publicPath = (p) => new URL('public' + p, root)

test('project ids are unique', () => {
  const ids = [...featured.map((p) => p.id), ...reef.map((p) => p.id)]
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`)
})

test('every featured project has copy, a stack, and somewhere to go', () => {
  for (const p of featured) {
    assert.ok(p.title && p.blurb && p.long && p.tag, `${p.id}: missing text`)
    assert.ok(p.stack.length > 0, `${p.id}: empty stack`)
    assert.ok(p.url || p.repo, `${p.id}: needs a url or repo`)
  }
})

test('every reef project has the same content as a featured one', () => {
  for (const p of reef) {
    assert.ok(p.title && p.tag && p.blurb && p.long && p.stack.length, `${p.id}: incomplete`)
    assert.ok(p.url || p.repo, `${p.id}: needs a url or repo`)
  }
})

test('every referenced screenshot exists in /public', () => {
  for (const p of allProjects) if (p.image) assert.ok(existsSync(publicPath(p.image)), `${p.id}: missing ${p.image}`)
})

test('no orphaned screenshots in /public/img', () => {
  const used = new Set(allProjects.map((p) => p.image?.split('/').pop()).filter(Boolean))
  const extra = readdirSync(publicPath('/img')).filter((f) => !used.has(f))
  assert.deepEqual(extra, [], `unused images: ${extra}`)
})

test('all links are well-formed https URLs', () => {
  const urls = [profile.site, profile.github, profile.linkedin, profile.resume, ...allProjects.flatMap((p) => [p.url, p.repo]).filter(Boolean)]
  for (const u of urls) assert.equal(new URL(u).protocol, 'https:', `not https: ${u}`)
})

test('navigation sections exist in the page', () => {
  const src = readdirSync(new URL('src/components/', root)).map((f) => readFileSync(new URL('src/components/' + f, root), 'utf8')).join('\n')
  for (const s of sections) assert.ok(src.includes(`id="${s.id}"`), `no element with id="${s.id}"`)
})

test('contribution snapshot is consistent', () => {
  const j = JSON.parse(readFileSync(new URL('src/data/contributions.json', root), 'utf8'))
  assert.ok(j.login && j.syncedAt && j.ranges.last, 'missing fields')
  for (const [k, r] of Object.entries(j.ranges)) {
    const dates = r.days.map((d) => d.date)
    assert.deepEqual([...dates].sort(), dates, `${k}: days not sorted`)
    assert.equal(new Set(dates).size, dates.length, `${k}: duplicate days`)
    assert.equal(r.days.reduce((a, d) => a + d.count, 0), r.total, `${k}: total does not match the days`)
    assert.ok(r.days.every((d) => d.level >= 0 && d.level <= 4), `${k}: level out of range`)
  }
})

test('about content is filled in', () => {
  assert.ok(logbook.length >= 3)
  assert.ok(logbook[0].now, 'first logbook entry should be the current role')
  assert.ok(skillGroups.every((g) => g.items.length > 0))
})

test('every single project has a complete writeup', () => {
  const ids = new Set(allProjects.map((p) => p.id))
  for (const p of allProjects) assert.ok(writeups[p.id], `missing writeup for ${p.id}`)
  for (const [k, w] of Object.entries(writeups)) {
    assert.ok(ids.has(k), `writeup "${k}" has no matching project`)
    assert.ok(w.problem.length > 60, `${k}: problem is too thin`)
    assert.ok(w.built.length >= 2, `${k}: needs at least 2 "what I built" points`)
    assert.ok(w.numbers.length >= 2 && w.numbers.length <= 4, `${k}: needs 2 to 4 headline numbers`)
    assert.ok(w.numbers.every(([n, l]) => n && l), `${k}: every number needs a label`)
  }
})

test('every "what I\'d build for you" claim points at a real project', () => {
  const ids = new Set(allProjects.map((p) => p.id))
  assert.ok(offers.length >= 3)
  for (const o of offers) {
    assert.ok(o.title && o.line.length > 60, `${o.title}: needs a real description`)
    assert.ok(o.proof.length >= 1, `${o.title}: needs at least one project as proof`)
    for (const id of o.proof) assert.ok(ids.has(id), `${o.title}: proof "${id}" is not a project`)
  }
})

test('testimonials, when present, are complete (the section stays hidden while empty)', () => {
  for (const q of testimonials) assert.ok(q.quote && q.name && q.role, 'a testimonial needs a quote, a name and a role')
})

test('the "now" list is filled in, dated, and its proof points at real projects', () => {
  const ids = new Set(allProjects.map((p) => p.id))
  assert.match(nowUpdated, /^\d{4}-\d{2}$/, 'nowUpdated should look like 2026-10')
  assert.ok(nowItems.length >= 3)
  for (const n of nowItems) {
    assert.ok(n.title && n.line.length > 30, `${n.title}: needs a real line`)
    for (const id of n.proof ?? []) assert.ok(ids.has(id), `${n.title}: proof "${id}" is not a project`)
  }
})

test('certificates are complete and their images exist', async () => {
  const { certificates } = await import('../src/data.ts')
  const { existsSync } = await import('node:fs')
  assert.ok(certificates.length >= 8)
  assert.equal(new Set(certificates.map((c) => c.id)).size, certificates.length)
  for (const c of certificates) {
    assert.ok(c.title && c.issuer && c.line, `${c.id} is incomplete`)
    if (c.image) assert.ok(existsSync(new URL('../public' + c.image, import.meta.url)), `${c.id}: missing ${c.image}`)
    if (c.verify) assert.match(c.verify, /^https:\/\/coursera\.org\/verify\/(specialization\/)?[A-Z0-9]{10,14}$/, `${c.id}: odd verify link`)
    for (const k of c.courses ?? []) if (k.verify) assert.match(k.verify, /^https:\/\/coursera\.org\/verify\/[A-Z0-9]{10,14}$/)
  }
})

test('the dive gets deeper section by section, and each project depth sits inside its section', () => {
  for (let i = 1; i < sections.length; i++) assert.ok(sections[i].m > sections[i - 1].m, `${sections[i].id} is not deeper than ${sections[i - 1].id}`)
  const m = (id) => sections.find((s) => s.id === id).m
  const dive = featured.map((p) => depthOf(p.id)), reefD = reef.map((p) => depthOf(p.id))
  assert.ok(Math.min(...dive) >= m('dives') && Math.max(...dive) <= m('reef'))
  assert.ok(Math.min(...reefD) >= m('reef') && Math.max(...reefD) <= m('sonar'))
})
