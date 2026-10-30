import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { BendText } from './BendText'
import { HoloPreview } from './Holo'
import { featured, type Project } from '../data'
import { lockScroll, onFrame, ripple, world } from '../world'
import { sound } from '../audio'

export function Poster({ p, big = false }: { p: { title: string; alt?: string; hue: number; image?: string; live?: 'holo' }; big?: boolean }) {
  if (p.live === 'holo') return <HoloPreview />
  if (p.image) return <img className="poster-img" src={p.image} alt={`${p.title} screenshot`} loading="lazy" decoding="async" draggable={false} />
  return (
    <div className="poster" style={{ '--h': p.hue } as React.CSSProperties}>
      <span className="poster-grid" />
      <span className="poster-title" data-big={big}>{p.title}</span>
      {p.alt && <span className="poster-alt">{p.alt}</span>}
    </div>
  )
}

/* ---------- floating preview that chases the cursor ---------- */
function Preview({ project }: { project: Project | null }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 180, damping: 22, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 180, damping: 22, mass: 0.6 })
  const rot = useMotionValue(0)
  const srot = useSpring(rot, { stiffness: 120, damping: 14 })
  useEffect(
    () =>
      onFrame(() => {
        x.set(world.px + 28)
        y.set(world.py - 110)
        rot.set(Math.max(-9, Math.min(9, world.vel * 0.004)))
      }),
    [x, y, rot],
  )
  const scale = useTransform(srot, [-9, 0, 9], [0.96, 1, 0.96])
  return (
    <motion.div className="preview" style={{ x: sx, y: sy, rotate: srot, scale }} aria-hidden="true">
      <AnimatePresence mode="popLayout">
        {project && (
          <motion.div
            key={project.id}
            className="preview-card"
            initial={{ clipPath: 'inset(0 0 100% 0 round 14px)', opacity: 0 }}
            animate={{ clipPath: 'inset(0 0 0% 0 round 14px)', opacity: 1 }}
            exit={{ clipPath: 'inset(100% 0 0 0 round 14px)', opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Poster p={project} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ---------- full-screen case study ---------- */
function CaseStudy({ index, origin, from, onClose, onNav }: { index: number; origin: { x: number; y: number }; from: DOMRect | null; onClose: () => void; onNav: (d: number) => void }) {
  const fly = useRef<HTMLDivElement>(null)
  const p = featured[index]
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-1, 1], [7, -7]), { stiffness: 120, damping: 16 })
  const ry = useSpring(useTransform(mx, [-1, 1], [-9, 9]), { stiffness: 120, damping: 16 })
  const ref = useRef<HTMLDivElement>(null)

  // shared-element transition: the hover preview card flies into the screenshot slot (FLIP, transform only)
  useLayoutEffect(() => {
    const el = fly.current
    if (!el || !from || world.reduced) return
    const to = el.getBoundingClientRect()
    if (!to.width || !to.height) return
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.top + from.height / 2 - (to.top + to.height / 2)
    const a = el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`, borderRadius: '10px', opacity: 0.95 },
        { transform: 'translate(0,0) scale(1,1)', borderRadius: '0px', opacity: 1 },
      ],
      { duration: 1000, delay: 150, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
    )
    return () => a.cancel()
  }, [from])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft') onNav(-1)
    }
    addEventListener('keydown', key)
    ref.current?.focus()
    return () => removeEventListener('keydown', key)
  }, [onClose, onNav])

  const stagger = (i: number) => ({ initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.35 + i * 0.07, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } })

  return (
    <motion.div
      className="case"
      role="dialog"
      aria-modal="true"
      aria-label={`${p.title} case study`}
      tabIndex={-1}
      ref={ref}
      initial={{ clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }}
      animate={{ clipPath: `circle(150% at ${origin.x}px ${origin.y}px)` }}
      exit={{ clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }}
      transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
      data-lenis-prevent
    >
      <div className="case-bar mono">
        <span>{String(index + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}</span>
        <span>{p.tag}</span>
        <button onClick={() => { sound.whoosh(-1, 0.7); onClose() }} data-cursor="Close" aria-label="Close case study">Esc ✕</button>
      </div>

      <div className="case-grid">
        <div className="case-copy">
          <motion.p className="mono eyebrow" {...stagger(0)}>{p.year} · −{38 + index * 11} m</motion.p>
          <motion.h2 {...stagger(1)}>{p.title}{p.alt && <span className="dev">{p.alt}</span>}</motion.h2>
          <motion.p className="case-blurb serif" {...stagger(2)}>{p.blurb}</motion.p>
          <motion.p className="case-long" {...stagger(3)}>{p.long}</motion.p>
          {p.stats && (
            <motion.div className="stats" {...stagger(4)}>
              {p.stats.map(([a, b]) => <div key={a + b}><b>{a}</b><span className="mono">{b}</span></div>)}
            </motion.div>
          )}
          <motion.div className="chips" {...stagger(5)}>{p.stack.map((s) => <span className="chip" key={s}>{s}</span>)}</motion.div>
          <motion.div className="cta" {...stagger(6)}>
            {p.url && <a className="btn primary" href={p.url} target="_blank" rel="noopener" data-cursor="Open">Visit live ↗</a>}
            {p.repo && <a className="btn" href={p.repo} target="_blank" rel="noopener" data-cursor="Code">Source on GitHub ↗</a>}
          </motion.div>
        </div>

        <div className="case-fly" ref={fly}>
        <motion.div
          className="case-visual"
          style={{ rotateX: rx, rotateY: ry }}
          initial={from ? false : { opacity: 0, scale: 0.85, y: 60 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            mx.set(((e.clientX - r.left) / r.width) * 2 - 1)
            my.set(((e.clientY - r.top) / r.height) * 2 - 1)
          }}
          onPointerLeave={() => { mx.set(0); my.set(0) }}
        >
          <Poster p={p} big />
          <span className="glare" />
        </motion.div>
        </div>
      </div>

      <div className="case-nav">
        <button onClick={() => onNav(-1)} data-cursor="Prev" aria-label="Previous project">← <span className="mono">{featured[(index + featured.length - 1) % featured.length].title}</span></button>
        <button onClick={() => onNav(1)} data-cursor="Next" aria-label="Next project"><span className="mono">{featured[(index + 1) % featured.length].title}</span> →</button>
      </div>
    </motion.div>
  )
}

/* ---------- the dive list ---------- */
export function Dives({ openId, setOpenId }: { openId: string | null; setOpenId: (id: string | null) => void }) {
  const [hover, setHover] = useState<Project | null>(null)
  const origin = useRef({ x: innerWidth / 2, y: innerHeight / 2 })
  const fromRect = useRef<DOMRect | null>(null)
  const index = featured.findIndex((p) => p.id === openId)

  const wasOpen = useRef(false)
  useEffect(() => {
    // only react to open/close transitions, never the initial mount (the loader owns that lock)
    if (index < 0 && !wasOpen.current) return
    wasOpen.current = index >= 0
    lockScroll(index >= 0)
    document.documentElement.classList.toggle('locked', index >= 0)
  }, [index])

  const open = useCallback((p: Project, e: React.MouseEvent) => {
    origin.current = { x: e.clientX || innerWidth / 2, y: e.clientY || innerHeight / 2 }
    // remember where the hover preview card is, so it can fly into the case study
    const card = document.querySelector('.preview-card')
    fromRect.current = card ? card.getBoundingClientRect() : null
    ripple(origin.current.x / innerWidth, origin.current.y / innerHeight, 1.6)
    sound.whoosh(1, 0.9)
    setOpenId(p.id)
  }, [setOpenId])

  const nav = useCallback((d: number) => {
    const i = (index + d + featured.length) % featured.length
    fromRect.current = null
    setOpenId(featured[i].id)
  }, [index, setOpenId])

  return (
    <section className="log" id="dives">
      <div className="zone mono">40 – 130 m · Twilight zone</div>
      <h2 className="h2" aria-label="Dive log"><span className="serif">Dive</span> <BendText text="log" preset="h2" /></h2>
      <p className="mono hint">Hover to peek · click to descend into the case study</p>

      <div className="dive-list" onPointerLeave={() => setHover(null)}>
        {featured.map((p, i) => (
          <motion.article
            key={p.id}
            className="dive"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              className="dive-head"
              onPointerEnter={() => { setHover(p); sound.tick(900 + Math.random() * 500) }}
              onFocus={() => setHover(p)}
              onClick={(e) => open(p, e)}
              data-cursor="Open"
              aria-label={`Open ${p.title} case study`}
            >
              <span className="d mono">−{38 + i * 11} m</span>
              <span className="dive-title">
                <BendText text={p.title} preset="title" />
                {p.alt && <span className="dev" aria-hidden="true">{p.alt}</span>}
              </span>
              <span className="dive-tag mono">{p.tag}<span className="arrow-go" aria-hidden="true">↗</span></span>
            </button>
          </motion.article>
        ))}
      </div>

      <Preview project={index >= 0 ? null : hover} />

      {createPortal(
        <AnimatePresence>
          {index >= 0 && <CaseStudy key="case" index={index} origin={origin.current} from={fromRect.current} onClose={() => setOpenId(null)} onNav={nav} />}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  )
}
