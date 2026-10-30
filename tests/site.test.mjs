// Fast, offline checks that catch the mistakes that actually break this site: missing images, duplicate ids, bad data.
// Run with: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { featured, shallows, sections, profile, logbook, skillGroups, writeups } from '../src/data.ts'

const root = new URL('../', import.meta.url)
const publicPath = (p) => new URL('public' + p, root)

test('project ids are unique', () => {
  const ids = [...featured.map((p) => p.id), ...shallows.map((p) => p.id)]
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`)
})

test('every featured project has copy, a stack, and somewhere to go', () => {
  for (const p of featured) {
    assert.ok(p.title && p.blurb && p.long && p.tag, `${p.id}: missing text`)
    assert.ok(p.stack.length > 0, `${p.id}: empty stack`)
    assert.ok(p.url || p.repo, `${p.id}: needs a url or repo`)
  }
})

test('every reef project has a link and a description', () => {
  for (const p of shallows) assert.ok(p.title && p.desc && p.url && p.stack.length, `${p.id}: incomplete`)
})

test('every referenced screenshot exists in /public', () => {
  for (const p of [...featured, ...shallows]) if (p.image) assert.ok(existsSync(publicPath(p.image)), `${p.id}: missing ${p.image}`)
})

test('no orphaned screenshots in /public/img', () => {
  const used = new Set([...featured, ...shallows].map((p) => p.image?.split('/').pop()).filter(Boolean))
  const extra = readdirSync(publicPath('/img')).filter((f) => !used.has(f))
  assert.deepEqual(extra, [], `unused images: ${extra}`)
})

test('all links are well-formed https URLs', () => {
  const urls = [profile.site, profile.github, profile.linkedin, profile.resume, ...[...featured, ...shallows].flatMap((p) => [p.url, p.repo]).filter(Boolean)]
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

test('flagship writeups are complete and point at real projects', () => {
  const ids = new Set(featured.map((p) => p.id))
  for (const k of ['coding-club', 'kupakosh', 'niyamkosh']) assert.ok(writeups[k], `missing writeup for ${k}`)
  for (const [k, w] of Object.entries(writeups)) {
    assert.ok(ids.has(k), `writeup "${k}" has no matching featured project`)
    assert.ok(w.problem.length > 80, `${k}: problem is too thin`)
    assert.ok(w.built.length >= 3, `${k}: needs at least 3 "what I built" points`)
    assert.equal(w.numbers.length, 4, `${k}: expects exactly 4 headline numbers`)
  }
})
