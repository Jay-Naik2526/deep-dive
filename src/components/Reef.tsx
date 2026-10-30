import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { BendText } from './BendText'
import { Poster } from './Dives'
import { reef, depthOf, type Project } from '../data'
import { caseFx } from '../caseFx'
import { ripple } from '../world'

function Card({ s, i, onOpen }: { s: Project; i: number; onOpen: (id: string) => void }) {
  const imgRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 200, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-11, 11]), { stiffness: 200, damping: 18 })
  const moved = useRef(false)
  return (
    <motion.div
      className="reef-card"
      role="button"
      tabIndex={0}
      aria-label={`Open ${s.title} case study`}
      draggable={false}
      data-cursor="Open"
      onClick={(e) => {
        if (moved.current) return // that was a drag, not a click
        caseFx.x = e.clientX || innerWidth / 2
        caseFx.y = e.clientY || innerHeight / 2
        caseFx.from = imgRef.current?.getBoundingClientRect() ?? null
        onOpen(s.id)
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        const r = e.currentTarget.getBoundingClientRect()
        caseFx.x = r.left + r.width / 2
        caseFx.y = r.top + r.height / 2
        caseFx.from = imgRef.current?.getBoundingClientRect() ?? null
        onOpen(s.id)
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 100px 0px 0px' }}
      transition={{ delay: Math.min(i, 4) * 0.06, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onPointerLeave={() => { mx.set(0); my.set(0) }}
      onPointerDown={() => (moved.current = false)}
      onPointerMoveCapture={(e) => { if (e.buttons) moved.current = true }}
      onPointerEnter={(e) => ripple(e.clientX / innerWidth, e.clientY / innerHeight, 0.5)}
    >
      <div className="reef-img" ref={imgRef}><Poster p={s} /></div>
      <div className="reef-meta">
        <span className="mono reef-depth">−{depthOf(s.id)} m · {s.tag}</span>
        <h3>{s.title}</h3>
        <p>{s.blurb}</p>
        <div className="chips">{s.stack.map((t) => <span className="chip" key={t}>{t}</span>)}</div>
      </div>
    </motion.div>
  )
}

export function Reef({ onOpen }: { onOpen: (id: string) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [limit, setLimit] = useState(0)
  useEffect(() => {
    const m = () => wrap.current && track.current && setLimit(Math.min(0, wrap.current.clientWidth - track.current.scrollWidth))
    m()
    addEventListener('resize', m)
    const t = setTimeout(m, 600)
    return () => { removeEventListener('resize', m); clearTimeout(t) }
  }, [])
  const x = useMotionValue(0)
  const progress = useTransform(x, [0, limit || -1], [0, 1])

  return (
    <section className="reef" id="reef">
      <div className="zone mono">150 m · Midnight zone</div>
      <h2 className="h2" aria-label="The reef"><span className="serif">The</span> <BendText text="reef" preset="h2" /></h2>
      <p className="mono hint">Everything else I've built · drag to explore · open one for its writeup</p>

      <div className="reef-wrap" ref={wrap} data-cursor="Drag">
        <motion.div ref={track} className="reef-track" drag="x" dragConstraints={{ left: limit, right: 0 }} dragElastic={0.14} dragTransition={{ power: 0.35, timeConstant: 260 }} style={{ x }}>
          {reef.map((s, i) => <Card key={s.id} s={s} i={i} onOpen={onOpen} />)}
        </motion.div>
      </div>
      <div className="reef-progress"><motion.i style={{ scaleX: progress }} /></div>
    </section>
  )
}
