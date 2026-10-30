import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionStyle } from 'motion/react'
import { BendText } from './BendText'
import { Marquee } from './Marquee'
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

const TILT = [-1.6, 1.4, -0.8, 1.8, -1.2, 0.9, -1.8, 1.1]
/** Columns each print takes on the 12-column wall, and how far it hangs below the row's top. */
const WALL: { span: number; drop: number }[] = [
  { span: 7, drop: 0 }, { span: 5, drop: 64 },
  { span: 4, drop: 0 }, { span: 4, drop: 48 }, { span: 4, drop: 12 },
  { span: 4, drop: 24 }, { span: 4, drop: 0 }, { span: 4, drop: 40 },
]

function Print({ c, i, onOpen }: { c: Certificate; i: number; onOpen: (c: Certificate) => void }) {
  const ref = useRef<HTMLElement>(null)
  const calm = useReducedMotion()
  const tilt = TILT[i % TILT.length]
  // each print rises from below as it scrolls into view and settles, slightly crooked, on the wall
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.6'] })
  const y = useTransform(scrollYProgress, [0, 1], [150, 0])
  const rotate = useTransform(scrollYProgress, [0, 1], [tilt * 4, tilt])
  const opacity = useTransform(scrollYProgress, [0, 0.45], [0, 1])
  const w = WALL[i % WALL.length]
  const big = c.courses && w.span >= 5

  return (
    <motion.figure
      ref={ref}
      className="hung"
      data-big={big ? 'true' : undefined}
      style={{ '--span': w.span, '--drop': `${w.drop}px`, ...(calm ? { rotate: tilt } : { y, rotate, opacity }) } as unknown as MotionStyle}
    >
      <button className="frame" onClick={() => onOpen(c)} aria-label={`Enlarge the ${c.title} certificate`} data-cursor="View">
        <i className="nail" aria-hidden="true" />
        <img src={c.image} alt={`${c.title}, ${c.issuer}${c.date ? `, ${c.date}` : ''}`} loading="lazy" decoding="async" />
        <i className="frame-glare" aria-hidden="true" />
      </button>
      <figcaption className="plaque">
        <div className="plaque-top"><span>{c.kind}</span>{c.date && <span className="mono">{c.date}</span>}</div>
        <h4>{c.title}</h4>
        <span className="mono plaque-issuer">{c.issuer}</span>
        {big && c.courses && (
          <ul className="plaque-courses">
            {c.courses.map((k) => (
              <li key={k.title}>{k.verify ? <a href={k.verify} target="_blank" rel="noopener noreferrer" data-cursor="Open">{k.title} <span aria-hidden="true">↗</span></a> : k.title}</li>
            ))}
          </ul>
        )}
        {c.verify && <a className="plaque-verify" href={c.verify} target="_blank" rel="noopener noreferrer" data-cursor="Open">Verify ↗</a>}
      </figcaption>
    </motion.figure>
  )
}

/** The wall order: newest and biggest first, then the rest. */
const WALL_ORDER = ['google-ai-essentials', 'python-for-everybody', 'ibm-data-science', 'google-python', 'learnbay-data-science', 'google-cloud-identity', 'linkedin-programming', 'microsoft-learn-git']

export function Certificates() {
  const [open, setOpen] = useState<Certificate | null>(null)
  const show = (c: Certificate) => { sound.tick(760); setOpen(c) }
  const wall = [...certificates].sort((a, b) => WALL_ORDER.indexOf(a.id) - WALL_ORDER.indexOf(b.id))
  const issuers = [...new Set(certificates.map((c) => c.issuer.split(' · ')[0].replace(' Student Ambassadors', '')))]

  return (
    <section className="certs" id="certificates">
      <div className="zone mono">185 m · Credentials</div>
      <h2 className="h2" aria-label="Things I've completed"><span className="serif">Things I’ve</span> <BendText text="completed" preset="h2" /></h2>
      <p className="mono hint">{certificates.length} certificates, all on the wall · tap one to enlarge it</p>

      <Marquee words={issuers} />

      <div className="wall">
        {wall.map((c, i) => <Print key={c.id} c={c} i={i} onOpen={show} />)}
      </div>

      <AnimatePresence>{open && <Viewer key={open.id} cert={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  )
}
