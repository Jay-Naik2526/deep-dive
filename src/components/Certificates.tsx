import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BendText } from './BendText'
import { certGroups, certificates, type Certificate } from '../data'
import { lockScroll } from '../world'
import { sound } from '../audio'

function Viewer({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  useEffect(() => {
    lockScroll(true)
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', key)
    return () => { removeEventListener('keydown', key); lockScroll(false) }
  }, [onClose])

  return createPortal(
    <motion.div className="cert-view" role="dialog" aria-label={`${cert.title} certificate`} data-lenis-prevent initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose}>
      <motion.figure initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} onClick={(e) => e.stopPropagation()}>
        <img src={cert.image} alt={`${cert.title}, ${cert.issuer}${cert.date ? `, ${cert.date}` : ''}`} decoding="async" />
        <figcaption>
          <span><b>{cert.title}</b><span className="mono">{cert.issuer}{cert.date && ` · ${cert.date}`}</span></span>
          <span className="cert-actions">
            {cert.verify && <a className="chip proof-chip" href={cert.verify} target="_blank" rel="noopener noreferrer" data-cursor="Open">Verify ↗</a>}
            <button className="chip proof-chip" onClick={onClose} data-cursor="Close">Close ✕</button>
          </span>
        </figcaption>
      </motion.figure>
    </motion.div>,
    document.body,
  )
}

const TILT = [-2.4, 1.8, -1.3, 2.6]
const thumb = (c: Certificate) => c.image?.replace('/certs/', '/certs/thumb/')

function Print({ c, i, onOpen }: { c: Certificate; i: number; onOpen: (c: Certificate) => void }) {
  const tilt = TILT[i % TILT.length]
  return (
    <motion.article
      className="print"
      data-wide={c.courses && c.group === 'AI' ? 'true' : undefined}
      style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-6%' }}
      transition={{ delay: Math.min(i, 3) * 0.07, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      {c.image ? (
        <button className="print-paper" onClick={() => onOpen(c)} aria-label={`View the ${c.title} certificate`} data-cursor="View">
          <img src={thumb(c)} alt="" loading="lazy" decoding="async" />
          <i className="print-pin" aria-hidden="true" />
        </button>
      ) : (
        <div className="print-paper print-text" aria-hidden="true">
          <span className="mono">{c.issuer}</span>
          <b>{c.title}</b>
          <i className="print-pin" />
        </div>
      )}
      <div className="print-meta">
        <div className="print-top">
          <span className="chip">{c.kind}</span>
          {c.date && <span className="mono cert-date">{c.date}</span>}
        </div>
        <h4>{c.title}</h4>
        <span className="mono cert-issuer">{c.issuer}</span>
        {c.courses && (
          <ul className="print-courses" aria-label={`Courses in ${c.title}`}>
            {c.courses.map((k) => (
              <li key={k.title}>
                {k.verify ? <a href={k.verify} target="_blank" rel="noopener noreferrer" data-cursor="Open">{k.title} <span aria-hidden="true">↗</span></a> : k.title}
              </li>
            ))}
          </ul>
        )}
        {c.verify && <a className="chip proof-chip print-verify" href={c.verify} target="_blank" rel="noopener noreferrer" data-cursor="Open">Verify ↗</a>}
      </div>
    </motion.article>
  )
}

export function Certificates() {
  const [open, setOpen] = useState<Certificate | null>(null)
  const show = (c: Certificate) => { sound.tick(760); setOpen(c) }

  return (
    <section className="certs" id="certificates">
      <div className="zone mono">185 m · Credentials</div>
      <h2 className="h2" aria-label="Things I've completed"><span className="serif">Things I’ve</span> <BendText text="completed" preset="h2" /></h2>
      <p className="mono hint">{certificates.length} certificates in {certGroups.length} piles · open one to see the original</p>

      {certGroups.map((g) => {
        const items = certificates.filter((c) => c.group === g.name)
        return (
          <div className="cert-pile" key={g.name}>
            <header>
              <h3><span className="serif">{g.name}</span></h3>
              <span className="mono cert-count">{String(items.length).padStart(2, '0')}</span>
              <p>{g.line}</p>
            </header>
            <div className="prints">
              {items.map((c, i) => <Print key={c.id} c={c} i={i} onOpen={show} />)}
            </div>
          </div>
        )
      })}

      <AnimatePresence>{open && <Viewer key={open.id} cert={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  )
}
