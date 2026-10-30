import test from 'node:test'
import assert from 'node:assert/strict'
import { toAnswer, ground, NOT_IN_NOTES } from '../src/diver/llm.ts'
import { handle, validate, originAllowed } from '../worker/ask.mjs'

const G = [{ label: 'A', text: 'a' }, { label: 'B', text: 'b', projectId: 'x' }]

test('toAnswer maps only valid, sent passages to sources', () => {
  const a = toAnswer({ answer: 'hi', sources: [2, 2, 9, 0, 'x'] }, G)
  assert.deepEqual(a.sources, [{ label: 'B', projectId: 'x' }])
  assert.equal(toAnswer({ answer: NOT_IN_NOTES, sources: [1] }, G).kind, 'none')
  assert.equal(toAnswer({ answer: '' }, G), null)
})

test('grounding for a project question includes that project', () => {
  assert.ok(ground('what problem does niyamkosh solve').some((g) => g.label.startsWith('NiyamKosh')))
})

test('worker validates and clamps input', () => {
  assert.equal(validate({ question: 'x', passages: [] }), null)
  const v = validate({ question: 'q?'.repeat(500), passages: Array(20).fill({ label: 'l', text: 't'.repeat(5000) }) })
  assert.equal(v.passages.length, 8)
  assert.equal(v.passages[0].text.length, 1200)
  assert.ok(v.question.length <= 300)
})

test('worker rejects unknown origins and hides the key', async () => {
  const env = { GROQ_API_KEY: 'secret', ALLOWED_ORIGINS: 'https://ok.example' }
  assert.ok(originAllowed('https://ok.example', env) && originAllowed('http://localhost:5174', env) && !originAllowed('https://evil.example', env))
  const bad = await handle(new Request('https://w', { method: 'POST', headers: { origin: 'https://evil.example' }, body: '{}' }), env, async () => { throw new Error('must not call') })
  assert.equal(bad.status, 403)
})

test('worker calls Groq with the key and returns answer + sources', async () => {
  const env = { GROQ_API_KEY: 'secret', ALLOWED_ORIGINS: 'https://ok.example' }
  let seen
  const fake = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify({ choices: [{ message: { content: '{"answer":"Yes.","sources":[1,5]}' } }] })) }
  const r = await handle(new Request('https://w', { method: 'POST', headers: { origin: 'https://ok.example', 'cf-connecting-ip': 't1' }, body: JSON.stringify({ question: 'hello?', passages: [{ label: 'A', text: 'a' }] }) }), env, fake)
  assert.equal(r.status, 200)
  assert.deepEqual(await r.json(), { answer: 'Yes.', sources: [1] })
  assert.match(seen.init.headers.authorization, /Bearer secret/)
  assert.match(seen.url, /groq\.com/)
})

test('worker rate-limits one client', async () => {
  const env = { GROQ_API_KEY: 'k', ALLOWED_ORIGINS: 'https://ok.example' }
  const fake = async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"answer":"a","sources":[]}' } }] }))
  let last
  for (let i = 0; i < 14; i++) last = await handle(new Request('https://w', { method: 'POST', headers: { origin: 'https://ok.example', 'cf-connecting-ip': 'spam' }, body: JSON.stringify({ question: 'hello?', passages: [{ label: 'A', text: 'a' }] }) }), env, fake, 1000)
  assert.equal(last.status, 429)
})
