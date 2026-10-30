// "Ask the diver" must answer from my own writing only, and refuse when it has no evidence.
import test from 'node:test'
import assert from 'node:assert/strict'
import { ask, buildCorpus, NONE } from '../src/diver/search.ts'
import { allProjects } from '../src/data.ts'

const corpus = buildCorpus()
const texts = new Set(corpus.map((p) => p.text))

const ANSWERS = [
  ['How accurate is Kupakosh?', 'Kupakosh · the numbers', '0.87'],
  ['What is NiyamKosh?', 'NiyamKosh · overview', 'Standard'],
  ['what limits does kupakosh have', "Kupakosh · what it doesn't claim", 'decision support'],
  ['What did you do at GDG on Campus?', 'GDG on Campus', 'team of 10'],
  ['Are you open to internships?', 'Availability', 'internships'],
  ['How can I contact you?', 'Contact', '@'],
  ['What is your CGPA?', 'About me', '8.5'],
  ['Where do you study?', 'About me', 'NMIMS'],
  ['What are you working on right now?', 'Right now', 'Coding Club'],
  ['Do you know Python?', 'Skills', 'Python'],
]
for (const [q, label, needle] of ANSWERS) {
  test(`answers "${q}" from the right place`, () => {
    const a = ask(q)
    assert.notEqual(a.kind, 'none', 'should have answered')
    assert.ok(a.sources.some((s) => s.label.includes(label)), `expected a source containing "${label}", got ${a.sources.map((s) => s.label).join(' | ')}`)
    assert.ok([a.text, ...a.more.map((m) => m.text)].join(' ').includes(needle), `expected the answer to mention "${needle}"`)
  })
}

test('lists projects by technology straight from the stack data', () => {
  const a = ask('Which projects use MongoDB?')
  assert.equal(a.kind, 'list')
  const expected = allProjects.filter((p) => p.stack.some((s) => s.toLowerCase().includes('mongodb'))).map((p) => p.title)
  assert.ok(expected.length > 2)
  for (const t of expected) assert.ok(a.text.includes(t), `${t} should be listed`)
})

test('finds IoT work through its hardware keywords', () => {
  const a = ask('Have you built anything with IoT?')
  assert.equal(a.kind, 'list')
  assert.ok(a.text.includes('Fire Evacuation'))
})

test('counts the projects from the data, not from memory', () => {
  const a = ask('How many projects have you built?')
  assert.equal(a.kind, 'fact')
  assert.ok(a.text.includes(String(allProjects.length)))
})

const REFUSE = [
  'What is the capital of France?', 'Who won the cricket world cup?', 'What is your favourite colour?', 'How do I bake a cake?',
  'Explain quantum computing', 'What is the weather today?', 'Do you like pizza?', 'Write me a poem', 'asdkj qwe', 'Who is the president of the USA?',
  'What is the meaning of life?', 'Can you help me with my homework?', 'Tell me a joke',
]
for (const q of REFUSE) {
  test(`refuses "${q}" instead of guessing`, () => {
    const a = ask(q)
    assert.equal(a.kind, 'none')
    assert.equal(a.text, NONE)
    assert.equal(a.sources.length, 0)
  })
}

test('GROUNDED: every answer is copied verbatim from my own writing', () => {
  const questions = [...ANSWERS.map((a) => a[0]), ...REFUSE, 'What is StudySync?', 'How does Choksi Classes work?', 'What problem does NiyamKosh solve?', 'What is First PR Festival?', 'What can you build for me?', 'What tech stack do you use?', 'Tell me about the Coding Club', 'did you lead a team', 'what are the numbers for OR/Studio', 'Kupakosh', 'react', 'mongodb']
  for (const q of questions) {
    const a = ask(q)
    if (a.kind === 'answer') {
      assert.ok(texts.has(a.text), `"${q}": answer text is not in the corpus`)
      for (const m of a.more) assert.ok(texts.has(m.text), `"${q}": extra passage is not in the corpus`)
    }
    if (a.kind === 'none') assert.equal(a.text, NONE)
  }
})
