// The guestbook shows other people's words on my site, so the parser has to be strict.
import test from 'node:test'
import assert from 'node:assert/strict'
import { toEntries, cleanText } from '../src/guestbook.ts'

const issue = (over = {}) => ({
  id: 1, number: 1, title: 'Guestbook: hi', html_url: 'https://github.com/Jay-Naik2526/deep-dive/issues/1', created_at: '2026-10-30T10:00:00Z',
  labels: [{ name: 'guestbook' }], user: { login: 'octocat', avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4' },
  body: '### Name\n\nMona\n\n### Your line\n\nLove the whale. Super smooth.\n\n### Public\n\n- [x] I understand this will be shown publicly on the site.',
  ...over,
})

test('shows an approved entry with the visitor’s own words and name', () => {
  const [e] = toEntries([issue()])
  assert.equal(e.text, 'Love the whale. Super smooth.')
  assert.equal(e.who, 'Mona')
  assert.equal(e.login, 'octocat')
  assert.ok(e.avatar?.startsWith('https://avatars.githubusercontent.com/'))
})

test('falls back to the GitHub username when no name is given', () => {
  const [e] = toEntries([issue({ body: '### Name\n\n_No response_\n\n### Your line\n\nNice work' })])
  assert.equal(e.who, 'octocat')
})

test('MODERATION: an issue without the guestbook label never appears', () => {
  assert.deepEqual(toEntries([issue({ labels: [{ name: 'guestbook-pending' }] })]), [])
  assert.deepEqual(toEntries([issue({ labels: [] })]), [])
  assert.deepEqual(toEntries([issue({ labels: undefined })]), [])
})

test('pull requests are ignored even if labelled', () => {
  assert.deepEqual(toEntries([issue({ pull_request: { url: 'x' } })]), [])
})

test('SAFETY: html, scripts, images and links are stripped to plain text', () => {
  const t = cleanText('### Your line\n\n<script>alert(1)</script><img src=x onerror=alert(1)> hello [click me](https://evil.example) ![pic](https://evil.example/p.png) https://spam.example/buy **bold**')
  assert.ok(!/[<>]/.test(t), 'no angle brackets survive')
  assert.ok(!/https?:|evil|spam/.test(t), 'no urls survive')
  assert.ok(t.includes('hello'))
  assert.ok(t.includes('click me'))
})

test('long entries are cut to 280 characters', () => {
  const t = cleanText('### Your line\n\n' + 'word '.repeat(200))
  assert.ok(t.length <= 280)
  assert.ok(t.endsWith('…'))
})

test('SAFETY: avatars are only accepted from GitHub’s avatar host', () => {
  const [a] = toEntries([issue({ user: { login: 'x', avatar_url: 'https://evil.example/a.png' } })])
  assert.equal(a.avatar, null)
  const [b] = toEntries([issue({ user: { login: 'x', avatar_url: 'http://avatars.githubusercontent.com/u/1' } })])
  assert.equal(b.avatar, null, 'plain http is rejected')
})

test('empty, malformed and non-array input produce nothing', () => {
  assert.deepEqual(toEntries(null), [])
  assert.deepEqual(toEntries({ message: 'rate limited' }), [])
  assert.deepEqual(toEntries([issue({ body: '### Your line\n\n_No response_' })]), [])
  assert.deepEqual(toEntries([issue({ user: null })]), [])
  assert.deepEqual(toEntries([null, 5, 'x']), [])
})
