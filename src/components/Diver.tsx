import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ask, SUGGESTIONS, type Answer } from '../diver/search.ts'
import { caseFx } from '../caseFx'
import { ripple } from '../world'
import { sound } from '../audio'
import { track } from '../analytics'

interface Msg { id: number; role: 'me' | 'diver'; text: string; answer?: Answer }

const HELLO: Msg = {
  id: 0,
  role: 'diver',
  text: 'I’m the diver. I only know what’s written on this site, and I’ll say so when I don’t know. Ask me about a project, a skill, or a role.',
}

/** A chat that can only quote my own writing. See src/diver/search.ts: it retrieves, it never generates. */
export default function Diver({ open, onClose, onOpenCase }: { open: boolean; onClose: () => void; onOpenCase: (id: string) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([HELLO])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 250)
  }, [open])

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (open && e.key === 'Escape') onClose() }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [open, onClose])

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, busy])

  const send = (text: string) => {
    const t = text.trim()
    if (!t || busy) return
    setQ('')
    setBusy(true)
    setMsgs((m) => [...m, { id: nextId.current++, role: 'me', text: t }])
    sound.tick(900)
    track('diver-ask') // only the fact that a question was asked; its text is never sent
    // a short beat so it feels like it is reading its notes
    setTimeout(() => {
      const a = ask(t)
      setMsgs((m) => [...m, { id: nextId.current++, role: 'diver', text: a.text, answer: a }])
      setBusy(false)
      ripple(0.84, 0.82, 0.5)
    }, 420 + Math.random() * 240)
  }

  const openCase = (id: string, e: React.MouseEvent) => {
    caseFx.x = e.clientX || innerWidth / 2
    caseFx.y = e.clientY || innerHeight / 2
    caseFx.from = null
    onClose()
    onOpenCase(id)
  }

  const showSuggestions = msgs.length <= 1 || msgs[msgs.length - 1]?.answer?.kind === 'none'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="diver"
          role="dialog"
          aria-label="Ask the diver"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <header className="dv-head">
            <div>
              <strong>Ask the diver</strong>
              <span className="mono">Answers come only from my own notes</span>
            </div>
            <button onClick={onClose} aria-label="Close" data-cursor="Close">✕</button>
          </header>

          <div className="dv-scroll" ref={box} data-lenis-prevent aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className="dv-msg" data-role={m.role}>
                {m.role === 'me' ? (
                  <p>{m.text}</p>
                ) : (
                  <>
                    <p data-none={m.answer?.kind === 'none'}>{m.text}</p>
                    {m.answer?.more.map((x) => (
                      <blockquote key={x.text}>
                        {x.text}
                        <cite className="mono">{x.source.label}</cite>
                      </blockquote>
                    ))}
                    {m.answer && m.answer.sources.length > 0 && (
                      <div className="dv-src">
                        <span className="mono">From</span>
                        {m.answer.sources.map((s) =>
                          s.projectId ? (
                            <button key={s.label} className="chip proof-chip" onClick={(e) => openCase(s.projectId!, e)} data-cursor="Open">{s.label} ↗</button>
                          ) : (
                            <span key={s.label} className="chip">{s.label}</span>
                          ),
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {busy && <div className="dv-msg" data-role="diver"><p className="dv-dots" aria-label="Reading my notes"><i /><i /><i /></p></div>}
            {showSuggestions && !busy && (
              <div className="dv-sugg">
                {SUGGESTIONS.map((s) => <button key={s} className="chip proof-chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
          </div>

          <form className="dv-form" onSubmit={(e) => { e.preventDefault(); send(q) }}>
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about a project, skill or role…" aria-label="Your question" maxLength={200} />
            <button type="submit" disabled={busy || !q.trim()} aria-label="Send">↑</button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
