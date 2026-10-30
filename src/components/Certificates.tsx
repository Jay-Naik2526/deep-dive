import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BendText } from './BendText'
import { certificates, type Certificate } from '../data'
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

export function Certificates() {
  const [open, setOpen] = useState<Certificate | null>(null)

  return (
    <section className="certs" id="certificates">
      <div className="zone mono">185 m · Credentials</div>
      <h2 className="h2" aria-label="Things I've completed"><span className="serif">Things I’ve</span> <BendText text="completed" preset="h2" /></h2>
      <p className="mono hint">Courses and workshops, each one real · open a certificate to see it</p>

      <div className="cert-grid">
        {certificates.map((c, i) => (
          <motion.article
            key={c.id}
            className="cert-card"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-6%' }}
            transition={{ delay: (i % 2) * 0.07, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="cert-top">
              <span className="chip">{c.kind}</span>
              {c.date && <span className="mono cert-date">{c.date}</span>}
            </div>
            <h3>{c.title}</h3>
            <span className="mono cert-issuer">{c.issuer}</span>
            <p>{c.line}</p>
            {c.courses && (
              <details>
                <summary className="mono">{c.courses.length} courses</summary>
                <ul>
                  {c.courses.map((k) => (
                    <li key={k.title}>
                      {k.title}
                      {k.verify && <a href={k.verify} target="_blank" rel="noopener noreferrer" aria-label={`Verify ${k.title}`}>↗</a>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <div className="cert-actions">
              {c.image && <button className="chip proof-chip" onClick={() => { sound.tick(760); setOpen(c) }} data-cursor="View">View certificate</button>}
              {c.verify && <a className="chip proof-chip" href={c.verify} target="_blank" rel="noopener noreferrer" data-cursor="Open">Verify ↗</a>}
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>{open && <Viewer key={open.id} cert={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  )
}
