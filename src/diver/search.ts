import { allProjects } from '../data.ts'
import { buildCorpus, counts, type Passage } from './corpus.ts'

/**
 * "Ask the diver": answers questions about me using ONLY my own writing.
 *
 * It is retrieval, not generation: it ranks passages with BM25, quotes the best one verbatim with its source,
 * and refuses ("No evidence found in my records") when nothing matches well enough. It cannot invent a fact
 * because it never writes one: every sentence it returns is copied out of the corpus.
 */
export interface Source { label: string; projectId?: string }
export interface Answer {
  kind: 'answer' | 'list' | 'fact' | 'none'
  text: string
  /** extra supporting passages, quoted verbatim */
  more: { text: string; source: Source }[]
  sources: Source[]
}

export const NONE = 'No evidence found in my records. I can only answer from my own project notes, so try asking about a project, a skill, a role, or how to reach me.'

const STOP = new Set('a an the and or of to in on at for with from by is are was were be been being do does did have has had i you your yours my me we it its this that these those what which who whom how when where why can could would should will about tell any some more much many there their they them as if so than then too very just also into over out up down not no yes please ask anything something everything explain describe name give show'.split(' '))
const IRREGULAR: Record<string, string> = { built: 'build', made: 'make', led: 'lead', ran: 'run', wrote: 'write', known: 'know', did: 'do' }
const SYN: Record<string, string[]> = {
  hackathon: ['sih', 'smart', 'india', 'team'], hackathons: ['sih', 'smart', 'india'],
  iot: ['esp32', 'mqtt', 'sensor', 'hardware', 'blynk'], hardware: ['esp32', 'sensor', 'iot'],
  '3d': ['three.js', 'webgl', 'r3f', 'holographic'], webgl: ['three.js', '3d'],
  ai: ['rag', 'retrieval', 'gemini', 'model', 'llm'], ml: ['rag', 'retrieval', 'model', 'tensorflow'], llm: ['rag', 'retrieval', 'model'],
  leader: ['president', 'lead', 'led', 'team'], leadership: ['president', 'lead', 'led', 'team'], leads: ['president', 'lead'],
  college: ['nmims', 'mpstme', 'shirpur', 'student'], university: ['nmims', 'mpstme'], study: ['student', 'nmims', 'btech'],
  accurate: ['auc', 'precision', 'recall', 'ranked', 'accuracy'], accuracy: ['auc', 'precision', 'recall', 'ranked', 'measured'],
  metrics: ['numbers', 'measured', 'tests'], results: ['numbers', 'measured'],
  job: ['internship', 'freelance', 'open', 'hire'], hire: ['internship', 'freelance', 'open', 'available'], available: ['open', 'internship', 'freelance'],
  internship: ['open', 'freelance', 'part-time'], work: ['experience', 'role'], email: ['contact', 'reach'], reach: ['contact', 'email'],
  frontend: ['react', 'next.js', 'tailwind'], backend: ['node.js', 'express', 'fastapi', 'flask'], database: ['mongodb', 'sql', 'firebase'],
  club: ['coding', 'president'], gdg: ['google', 'developer', 'groups', 'campus'], gdgoc: ['gdg', 'google', 'campus'],
  web: ['full-stack', 'react', 'frontend'], app: ['project', 'platform'], apps: ['project', 'platform'],
}

const stem = (w: string) => {
  if (IRREGULAR[w]) return IRREGULAR[w]
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3)
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2)
  if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9.+#\s-]/g, ' ').replace(/\.(?=\s|$)/g, ' ')
export const tokenize = (s: string) => norm(s).split(/\s+/).filter((t) => t && !STOP.has(t)).map(stem)

interface Doc { p: Passage; tf: Map<string, number>; len: number }
let docs: Doc[] | null = null
let df = new Map<string, number>()
let avgLen = 1

function index() {
  if (docs) return docs
  const corpus = buildCorpus()
  docs = corpus.map((p) => {
    const tf = new Map<string, number>()
    const add = (t: string, w: number) => tf.set(t, (tf.get(t) ?? 0) + w)
    tokenize(p.text).forEach((t) => add(t, 1))
    tokenize(p.keys).forEach((t) => add(t, 1.5)) // names and section words matter more than body words
    let len = 0
    tf.forEach((v) => (len += v))
    return { p, tf, len }
  })
  df = new Map()
  docs.forEach((d) => d.tf.forEach((_v, t) => df.set(t, (df.get(t) ?? 0) + 1)))
  avgLen = docs.reduce((a, d) => a + d.len, 0) / docs.length
  return docs
}

const K1 = 1.4, B = 0.7

function score(q: Map<string, number>) {
  const ds = index()
  const N = ds.length
  return ds
    .map((d) => {
      let s = 0
      let hit = 0
      q.forEach((qw, t) => {
        const f = d.tf.get(t)
        if (!f) return
        hit++
        const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5))
        s += qw * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avgLen)))
      })
      return { p: d.p, s, hit }
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
}

function queryWeights(question: string) {
  const q = new Map<string, number>()
  for (const t of tokenize(question)) {
    q.set(t, Math.max(q.get(t) ?? 0, 1))
    for (const e of SYN[t] ?? []) for (const x of tokenize(e)) q.set(x, Math.max(q.get(x) ?? 0, 0.45))
  }
  return q
}

/* ---- list intent: "which projects use React?" answered from the stack lists, not from prose ---- */
const techOf = (stackItem: string) => norm(stackItem).split(/[\s()]+/).filter((t) => t.length > 1 && !/^\d+$/.test(t))
let techVocab: Set<string> | null = null
function vocab() {
  if (!techVocab) {
    techVocab = new Set()
    for (const p of allProjects) for (const s of p.stack) techOf(s).forEach((t) => techVocab!.add(t))
    ;['next.js', 'node.js', 'three.js', 'react', 'python', 'typescript', 'javascript', 'mongodb', 'tailwind', 'firebase', 'express', 'socket.io'].forEach((t) => techVocab!.add(t))
  }
  return techVocab
}
const GENERIC_TECH = new Set(['core', 'live', 'team', 'lead', 'data', 'open', 'source', 'real', 'time', 'only', 'static', 'js'])

function listIntent(question: string): Answer | null {
  const n = norm(question)
  if (/how many (projects|things|apps)|number of projects|count of projects/.test(n)) {
    return { kind: 'fact', text: `There are ${counts.total} projects on this site: ${counts.featured} featured in the dive log and ${counts.reef} more in the reef.`, more: [], sources: [{ label: 'The projects on this site' }] }
  }
  if (/(how many|which|what|list|any).*(production|deployed|live|shipped|real users)|(production|deployed|live|shipped).*(how many|which|projects)/.test(n) && /project|app|site|thing|have|has|built/.test(n)) {
    const live = allProjects.filter((p) => p.url)
    return {
      kind: 'fact',
      text: `I don’t grade my projects as “production-grade”, so I won’t claim a number for that. What my records do show: ${live.length} of ${counts.total} projects have a live, deployed link: ${live.map((p) => p.title).join(', ')}.`,
      more: [],
      sources: live.map((p) => ({ label: p.title, projectId: p.id })),
    }
  }
  if (!/\b(which|what|list|show|any|name)\b.*\b(project|app|site|website|platform|tool|thing)s?\b|\bprojects?\b.*\b(use|using|with|in|built|made|written)\b|\b(built|made|worked|done|used)\b.*\b(with|using|in)\b/.test(n)) return null
  const asked = [...new Set(norm(question).split(/\s+/).filter((t) => vocab().has(t) && !GENERIC_TECH.has(t)))]
  const expand = n.split(/\s+/).flatMap((t) => (['iot', 'hardware'].includes(t) ? ['esp32', 'mqtt'] : []))
  const wanted = [...new Set([...asked, ...expand])]
  if (!wanted.length) return null
  const hits = allProjects.filter((p) => wanted.some((w) => p.stack.some((s) => techOf(s).includes(w))))
  if (!hits.length) return null
  return {
    kind: 'list',
    text: `${hits.length === 1 ? 'One project uses' : `${hits.length} projects use`} ${wanted.join(' / ')}: ${hits.map((p) => p.title).join(', ')}.`,
    more: [],
    sources: hits.map((p) => ({ label: p.title, projectId: p.id })),
  }
}

/** Minimum evidence before it is allowed to answer. Below this it says it has no evidence. */
const MIN_SCORE = 4.0

/** Core personal questions map straight to the passage that answers them. Still verbatim, still cited. */
const INTENTS: { re: RegExp; ids: string[] }[] = [
  { re: /who are you|about (you|yourself)|introduce|where (do|did) you (study|live|stay)|where are you from|your (college|university|education|degree|cgpa|gpa|location|background)|which college/, ids: ['me:about'] },
  { re: /contact|e-?mail|reach (you|out)|get in touch|linkedin|github|r[eé]sum[eé]|\bcv\b/, ids: ['me:contact'] },
  { re: /open to (work|internship)|are you available|hire you|hiring you|freelance|internship/, ids: ['me:availability'] },
  { re: /what (is |are )?(your )?(tech )?(stack|technologies|tools|languages|skills)|tech stack|what do you (use|know)|your skills|which languages/, ids: ['skills:*'] },
  { re: /certific|credential|coursera|what (courses|have you (studied|learned|completed))|courses? (have|did) you|workshops? (have|did) you/, ids: ['cert:all'] },
  { re: /right now|currently|these days|this month|working on|your focus|what are you (doing|up to)/, ids: ['now:*'] },
  { re: /what (can|would|could) you (build|make|offer|do)|what do you (build|make|offer)|what do you do\??$|build for (me|us)|work with (you|me|us)|how can you help|your services|what do you offer/, ids: ['offer:*'] },
]

const STRIP = new Set(['what', 'tell', 'project', 'about', 'overview', 'built', 'build', 'is', 'the', 'this', 'that', 'site', 'platform', 'app', 'thing'])

function passagesFor(ids: string[]): Passage[] {
  const all = index().map((d) => d.p)
  return ids.flatMap((id) => (id.endsWith('*') ? all.filter((p) => p.id.startsWith(id.slice(0, -1))) : all.filter((p) => p.id === id)))
}

function fromPassages(ps: Passage[]): Answer {
  const src = (p: Passage): Source => ({ label: p.label, projectId: p.projectId })
  const [top, ...rest] = ps
  return { kind: 'answer', text: top.text, more: rest.map((p) => ({ text: p.text, source: src(p) })), sources: ps.map(src) }
}

/** Questions about one of my projects: pick the section of its writeup that the question is really asking for. */
const SECTIONS: { re: RegExp; ids: (id: string) => string[] }[] = [
  { re: /\b(stack|tech|technolog\w*|framework|librar\w*|language|built (with|using)|made (with|using)|(use|uses|used|using) )/, ids: (id) => [`${id}:stack`] },
  { re: /problem|motivat|inspir|why (did|was|is)|why .*(build|built|made)|solve|need(ed)?\b/, ids: (id) => [`${id}:problem`, `${id}:why`] },
  { re: /accura|number|metric|result|\bstats?\b|statistics|how (well|good|fast)|perform|measure|evaluat|test(s|ed)?\b|how many/, ids: (id) => [`${id}:numbers`] },
  { re: /limit|claim|weak|caveat|honest|not do|doesn.?t|can.?t|cannot|downside|flaw/, ids: (id) => [`${id}:honest`] },
  { re: /how (does|did|do) .*(work|built|build)|features?|what does it do|what (did|do) you (build|make)|built\b|architecture/, ids: (id) => [0, 1, 2, 3, 4].map((i) => `${id}:built${i}`) },
]

function projectIntent(question: string): Answer | null {
  const qt = tokenize(question)
  const low = question.toLowerCase()
  for (const p of allProjects) {
    const title = new Set(tokenize(`${p.title} ${p.alt ?? ''}`))
    const key = tokenize(p.title)
    if (!key.length || !key.every((t) => qt.includes(t))) continue
    for (const sec of SECTIONS) {
      if (!sec.re.test(low)) continue
      const ps = passagesFor(sec.ids(p.id))
      if (ps.length) return fromPassages(ps.slice(0, 3))
    }
    const rest = qt.filter((t) => !title.has(t) && !STRIP.has(t))
    if (rest.length === 0) {
      const ps = passagesFor([`${p.id}:about`])
      if (ps.length) return fromPassages(ps)
    }
  }
  return null
}

/** Words in the question that appear nowhere in my records (even via a synonym) mean it is about something else. */
function unknownRatio(question: string) {
  index()
  const content = [...new Set(tokenize(question))]
  if (!content.length) return 1
  const known = (t: string) => df.has(t) || (SYN[t] ?? []).some((e) => tokenize(e).some((x) => df.has(x)))
  return content.filter((t) => !known(t)).length / content.length
}

export function ask(question: string): Answer {
  const q = question.trim()
  if (q.length < 2) return { kind: 'none', text: NONE, more: [], sources: [] }
  const low = q.toLowerCase()

  const listed = listIntent(q)
  if (listed) return listed

  const overview = projectIntent(q)
  if (overview) return overview

  for (const it of INTENTS) {
    if (it.re.test(low)) {
      const ps = passagesFor(it.ids)
      if (ps.length) return fromPassages(ps)
    }
  }

  if (unknownRatio(q) >= 0.5) return { kind: 'none', text: NONE, more: [], sources: [] }

  const ranked = score(queryWeights(q))
  const top = ranked[0]
  if (!top || top.s < MIN_SCORE) return { kind: 'none', text: NONE, more: [], sources: [] }

  const src = (p: Passage): Source => ({ label: p.label, projectId: p.projectId })
  const more = ranked
    .slice(1)
    .filter((r) => r.s >= top.s * 0.72 && r.p.id !== top.p.id && r.p.text !== top.p.text)
    .slice(0, 2)
    .map((r) => ({ text: r.p.text, source: src(r.p) }))
  const sources = [src(top.p), ...more.map((m) => m.source)]
  return { kind: 'answer', text: top.p.text, more, sources }
}

/** The best keyword matches, used to ground the AI answer. */
export function retrieve(question: string, n: number): Passage[] {
  return score(queryWeights(question)).slice(0, n).map((r) => r.p)
}

/** Questions that are known to work, shown as suggestions. */
export const SUGGESTIONS = [
  'How accurate is Kupakosh?',
  'Which projects use React?',
  'What certificates do you have?',
  'What is Ambiora 2027?',
  'What did you do at GDG on Campus?',
  'Are you open to internships?',
]

/** For tests and tuning: the top matches and their raw scores. */
export function debugScores(question: string) {
  return score(queryWeights(question)).slice(0, 3).map((r) => ({ label: r.p.label, score: +r.s.toFixed(2) }))
}

export { buildCorpus, MIN_SCORE }
