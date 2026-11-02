import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { allProjects, profile, sections } from '../data'
import { goTo, lockScroll } from '../world'

interface Item { id: string; label: string; hint: string; run: () => void }

/** ⌘K / Ctrl+K command palette: jump to anything. */
export function Palette({ open, setOpen, openCase, copy, toggleSound, ask, quick }: { open: boolean; setOpen: (v: boolean) => void; openCase: (id: string) => void; copy: () => void; toggleSound: () => void; ask: () => void; quick: () => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const items = useMemo<Item[]>(() => [
    ...sections.map((s) => ({ id: 's' + s.id, label: s.label, hint: 'Go to section', run: () => goTo('#' + s.id) })),
    ...allProjects.map((p) => ({ id: 'p' + p.id, label: p.title, hint: 'Open case study', run: () => openCase(p.id) })),
    { id: 'l1', label: 'GitHub', hint: 'Link ↗', run: () => window.open(profile.github, '_blank', 'noopener') },
    { id: 'l2', label: 'LinkedIn', hint: 'Link ↗', run: () => window.open(profile.linkedin, '_blank', 'noopener') },
    { id: 'l3', label: 'Holographic 3D portfolio', hint: 'jaynaik.tech ↗', run: () => window.open(profile.hologram, '_blank', 'noopener') },
    { id: 'l4', label: 'Résumé', hint: 'PDF ↗', run: () => window.open(profile.resume, '_blank', 'noopener') },
    { id: 'a9', label: 'Quick view', hint: 'Short version, for recruiters', run: quick },
    { id: 'a0', label: 'Ask the diver', hint: 'Chat about my work', run: ask },
    { id: 'a1', label: 'Copy email', hint: profile.email, run: copy },
    { id: 'a2', label: 'Toggle ambient sound', hint: 'Action', run: toggleSound },
  ], [openCase, copy, toggleSound, ask, quick])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    const score = (t: string) => { let i = 0; for (const ch of t.toLowerCase()) if (ch === s[i]) i++; return i === s.length ? 1 : 0 }
    return items.filter((it) => it.label.toLowerCase().includes(s) || score(it.label))
  }, [q, items])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(!open) }
      else if (e.key === '/' && !open && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); setOpen(true) }
      else if (open && e.key === 'Escape') setOpen(false)
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [open, setOpen])

  useEffect(() => {
    if (open) { setQ(''); setSel(0); lockScroll(true); setTimeout(() => input.current?.focus(), 30) }
    else if (!document.documentElement.classList.contains('locked')) lockScroll(false)
  }, [open])
  useEffect(() => setSel(0), [q])

  const run = (it?: Item) => { if (!it) return; setOpen(false); setTimeout(it.run, 260) }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="palette-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setOpen(false)}>
          <motion.div
            className="palette"
            role="dialog"
            aria-label="Command palette"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Jump to anything…"
              aria-label="Search"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)) }
                if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
                if (e.key === 'Enter') run(results[sel])
              }}
            />
            <ul role="listbox">
              {results.slice(0, 9).map((it, i) => (
                <li key={it.id} role="option" aria-selected={i === sel} data-sel={i === sel} onPointerEnter={() => setSel(i)} onClick={() => run(it)}>
                  <span>{it.label}</span><span className="mono">{it.hint}</span>
                </li>
              ))}
              {!results.length && <li className="none mono">Nothing down here</li>}
            </ul>
            <div className="palette-foot mono"><span>↑↓ navigate</span><span>↵ select</span><span>esc close</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
