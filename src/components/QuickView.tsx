import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { certificates, featured, logbook, profile, skillGroups } from '../data'
import { lockScroll } from '../world'

const TOP = ['coding-club', 'kupakosh', 'niyamkosh']

/** One plain screen for a reader in a hurry: who, what, proof, how to reach me. No scene, no motion. */
export default function QuickView({ onClose }: { onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const current = logbook.filter((l) => l.now)
  const work = TOP.map((id) => featured.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p)

  useEffect(() => {
    lockScroll(true)
    box.current?.focus()
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', key)
    return () => { removeEventListener('keydown', key); lockScroll(false) }
  }, [onClose])

  return createPortal(
    <div className="quick" role="dialog" aria-modal="true" aria-label="Quick view" ref={box} tabIndex={-1} data-lenis-prevent>
      <div className="quick-in">
        <header>
          <span className="mono">Quick view · for recruiters</span>
          <button onClick={onClose} className="quick-x" aria-label="Close quick view" data-cursor="Close">Close ✕</button>
        </header>

        <section className="quick-id">
          <h1>{profile.name}</h1>
          <p className="quick-sub">B.Tech CSE student at NMIMS MPSTME Shirpur (2024–2028, CGPA 8.5). Full-stack web, IoT and 3D web.</p>
          <p className="quick-open"><i /> Open to internships, part-time work and freelance projects</p>
          <ul className="quick-now">
            {current.map((l) => <li key={l.role}><b>{l.role}</b><span>{l.org}</span></li>)}
          </ul>
        </section>

        <section>
          <h2>Selected work</h2>
          <div className="quick-work">
            {work.map((p) => (
              <article key={p.id}>
                <h3>{p.title}</h3>
                <p>{p.blurb}</p>
                <span className="quick-stack">{p.stack.join(' · ')}</span>
                <div className="quick-links">
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" data-cursor="Open">Live ↗</a>}
                  {p.repo && <a href={p.repo} target="_blank" rel="noopener noreferrer" data-cursor="Open">GitHub ↗</a>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="quick-cols">
          <div>
            <h2>Skills</h2>
            <dl>
              {skillGroups.map((g) => <div key={g.name}><dt>{g.name}</dt><dd>{g.items.join(', ')}</dd></div>)}
            </dl>
          </div>
          <div>
            <h2>Credentials</h2>
            <p>{certificates.length} certificates, including Google AI Essentials (2026) and Python for Everybody from the University of Michigan. All are viewable in the full portfolio.</p>
            <h2>Reach me</h2>
            <p className="quick-reach">
              <a href={`mailto:${profile.email}`} data-cursor="Email">{profile.email}</a>
              <a href={profile.resume} target="_blank" rel="noopener noreferrer" data-cursor="Open">Résumé ↗</a>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" data-cursor="Open">LinkedIn ↗</a>
              <a href={profile.github} target="_blank" rel="noopener noreferrer" data-cursor="Open">GitHub ↗</a>
            </p>
          </div>
        </section>

        <footer>
          <button onClick={onClose} className="quick-go" data-cursor="Dive">Explore the full dive ↓</button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
