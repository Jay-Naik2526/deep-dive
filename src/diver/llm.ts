import { ask, retrieve, type Answer, type Source } from './search.ts'
import type { Passage } from './corpus.ts'

/** Set VITE_ASK_URL to the deployed worker (see worker/README.md). Unset = the offline engine only. */
export const ASK_URL: string = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_ASK_URL ?? ''
export const NOT_IN_NOTES = 'NOT_IN_NOTES'
const NONE = 'No evidence found in my records. I can only answer from my own project notes, so try asking about a project, a skill, a role, or how to reach me.'

export interface Grounding { label: string; text: string; projectId?: string }

/** The passages the model is allowed to use: facts from the offline engine first, then the best keyword matches. */
export function ground(question: string): Grounding[] {
  const local = ask(question)
  const out: Grounding[] = []
  if (local.kind === 'list' || local.kind === 'fact') out.push({ label: local.sources[0]?.label ?? 'Site facts', text: local.text })
  const seen = new Set(out.map((g) => g.text))
  for (const p of retrieve(question, 6)) if (!seen.has(p.text)) { seen.add(p.text); out.push({ label: p.label, text: p.text, projectId: p.projectId }) }
  return out
}

/** Turn the worker's reply into an Answer. Sources are only ever passages that were actually sent. */
export function toAnswer(reply: { answer?: unknown; sources?: unknown }, grounding: Grounding[]): Answer | null {
  const text = typeof reply.answer === 'string' ? reply.answer.trim() : ''
  if (!text) return null
  if (text === NOT_IN_NOTES) return { kind: 'none', text: NONE, more: [], sources: [] }
  const idx = Array.isArray(reply.sources) ? reply.sources.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= grounding.length) : []
  const seen = new Set<string>()
  const sources: Source[] = []
  for (const i of idx) {
    const g = grounding[i - 1]
    if (seen.has(g.label)) continue
    seen.add(g.label)
    sources.push({ label: g.label, projectId: g.projectId })
  }
  return { kind: 'answer', text, more: [], sources }
}

/** Ask the model; on any failure return null so the caller falls back to the offline engine. */
export async function askAI(question: string, fetchImpl: typeof fetch = fetch): Promise<Answer | null> {
  if (!ASK_URL) return null
  const grounding = ground(question)
  if (!grounding.length) return { kind: 'none', text: NONE, more: [], sources: [] }
  try {
    const ctl = new AbortController()
    const t = setTimeout(() => ctl.abort(), 9000)
    const res = await fetchImpl(ASK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, passages: grounding.map(({ label, text }) => ({ label, text })) }),
      signal: ctl.signal,
    })
    clearTimeout(t)
    if (!res.ok) return null
    return toAnswer(await res.json(), grounding)
  } catch {
    return null
  }
}

export type { Passage }
