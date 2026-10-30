import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { onFrame, ripple, setHold, world } from '../world'
import { sound } from '../audio'
import { quality } from '../quality'
import { profile } from '../data'

/** Glowing cursor trail (bioluminescence in the deep, bubbles near the surface). */
function Trail() {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current
    if (!c || world.reduced || quality.touch) return
    const ctx = c.getContext('2d')!
    const fit = () => { c.width = innerWidth; c.height = innerHeight }
    fit()
    addEventListener('resize', fit)
    // pre-rendered glow sprites per hue band (a gradient per particle per frame was the expensive part)
    const sprites = [170, 210, 250, 290].map((h) => {
      const sc = document.createElement('canvas')
      sc.width = sc.height = 48
      const g = sc.getContext('2d')!
      const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24)
      gr.addColorStop(0, `hsla(${h},100%,72%,1)`)
      gr.addColorStop(1, `hsla(${h},100%,60%,0)`)
      g.fillStyle = gr
      g.fillRect(0, 0, 48, 48)
      return sc
    })
    interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; hue: number }
    const ps: P[] = []
    let lx = -1, ly = -1
    let had = false
    const off = onFrame((_t, dt) => {
      if (!had && !ps.length && !(world.active && world.loaded)) return
      ctx.clearRect(0, 0, c.width, c.height)
      had = ps.length > 0
      if (world.active && world.loaded) {
        if (lx >= 0) {
          const dx = world.px - lx, dy = world.py - ly
          const n = Math.min(5, Math.floor(Math.hypot(dx, dy) / 14))
          for (let i = 0; i < n; i++)
            ps.push({ x: lx + dx * (i / n), y: ly + dy * (i / n), vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 40, life: 0, max: 0.9 + Math.random() * 1.1, r: 1.5 + Math.random() * 3.5, hue: 170 + Math.random() * 120 })
        }
        lx = world.px; ly = world.py
      } else lx = -1
      const deep = world.depth
      ctx.globalCompositeOperation = deep > 0.3 ? 'lighter' : 'source-over'
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]
        p.life += dt
        if (p.life > p.max) { ps.splice(i, 1); continue }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.99
        const a = 1 - p.life / p.max
        if (deep > 0.3) {
          const sz = p.r * 10
          ctx.globalAlpha = a * 0.9
          ctx.drawImage(sprites[Math.min(3, Math.floor((p.hue - 170) / 40))], p.x - sz / 2, p.y - sz / 2, sz, sz)
          ctx.globalAlpha = 1
        } else {
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.7})`; ctx.lineWidth = 1
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.4, 0, 6.283); ctx.stroke()
        }
      }
      if (ps.length > 260) ps.splice(0, ps.length - 260)
    })
    return () => { off(); removeEventListener('resize', fit) }
  }, [])
  return <canvas className="trail" ref={cv} aria-hidden="true" />
}

const ZONES: Record<string, { n: string; main: string; sub: string; m: number }> = {
  'Sunlight zone': { n: '01', main: 'Sunlight', sub: 'zone', m: 0 },
  'Twilight zone': { n: '02', main: 'Twilight', sub: 'zone', m: 40 },
  'Midnight zone': { n: '03', main: 'Midnight', sub: 'zone', m: 116 },
  'The seabed': { n: '04', main: 'Seabed', sub: 'the', m: 176 },
}
/**
 * Full-screen title card when you cross into a new depth zone.
 * The card lives in the page permanently and is animated with the Web Animations API (transform + opacity only),
 * so showing it costs no React render, no mount, and no backdrop blur.
 */
function ZoneBanner() {
  const root = useRef<HTMLDivElement>(null)
  const nEl = useRef<HTMLSpanElement>(null)
  const mEl = useRef<HTMLSpanElement>(null)
  const mainEl = useRef<HTMLElement>(null)
  const subEl = useRef<HTMLElement>(null)
  const rules = useRef<HTMLElement[]>([])

  useEffect(() => {
    const seen = new Set<string>()
    let anims: Animation[] = []
    const on = (e: Event) => {
      const name = (e as CustomEvent<string>).detail
      const info = ZONES[name]
      const r = root.current
      if (!info || seen.has(name) || !r) return
      seen.add(name)
      anims.forEach((a) => a.cancel())
      if (nEl.current) nEl.current.textContent = `Zone ${info.n} / 04`
      if (mEl.current) mEl.current.textContent = `−${info.m} m`
      if (mainEl.current) mainEl.current.textContent = info.main
      if (subEl.current) subEl.current.textContent = info.sub
      r.style.visibility = 'visible'
      const D = 1500
      const ease = 'cubic-bezier(.76,0,.24,1)'
      const rise = (el: Element | null, delay = 0) =>
        el?.animate(
          [{ transform: 'translateY(112%)', offset: 0 }, { transform: 'translateY(0)', offset: 0.4, easing: ease }, { transform: 'translateY(0)', offset: 0.78 }, { transform: 'translateY(-112%)', offset: 1, easing: ease }],
          { duration: D, delay, fill: 'both' },
        )
      const fade = r.animate([{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: D, fill: 'both' })
      fade.onfinish = () => { r.style.visibility = 'hidden' }
      const line = rules.current.map((el, i) => el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)', offset: 0.45, easing: ease }, { transform: 'scaleX(1)' }], { duration: D, delay: i * 90, fill: 'both' }))
      anims = [fade, ...line, rise(mainEl.current), rise(subEl.current, 70)].filter(Boolean) as Animation[]
    }
    window.addEventListener('zone', on)
    return () => window.removeEventListener('zone', on)
  }, [])

  return (
    <div className="zone-full" ref={root} aria-hidden="true">
      <div className="zf-top mono"><span ref={nEl} /><span ref={mEl} /></div>
      <div className="zf-title">
        <i className="zf-rule" ref={(el) => { if (el) rules.current[0] = el }} />
        <span className="zf-line"><strong ref={mainEl} /></span>
        <span className="zf-line"><em className="serif" ref={subEl} /></span>
        <i className="zf-rule" ref={(el) => { if (el) rules.current[1] = el }} />
      </div>
      <div className="zf-bot mono"><span>Descending</span></div>
    </div>
  )
}

/** Hold Space (or the button) to free-dive: pressure builds, the vignette closes in. */
function Pressure() {
  const ov = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      const t = e.target instanceof Element ? e.target : null
      if (t?.closest('input,textarea,button,a,[role=dialog]')) return
      e.preventDefault()
      setHold(true)
    }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setHold(false) }
    addEventListener('keydown', down)
    addEventListener('keyup', up)
    addEventListener('blur', () => setHold(false))
    let armed = true
    const off = onFrame(() => {
      const h = world.hold
      // the trench: reach the very bottom while free-diving
      if (armed && h > 0.5 && world.scrollY >= world.scrollMax - 3) { armed = false; window.dispatchEvent(new Event('trench-reached')) }
      if (h < 0.1 && world.scrollY < world.scrollMax - 400) armed = true
      if (ov.current) { ov.current.style.opacity = String(Math.min(1, h * 1.15)); ov.current.style.setProperty('--s', String(1 - h * 0.35)) }
      if (label.current) label.current.style.opacity = String(Math.min(1, h * 2))
    })
    return () => { off(); removeEventListener('keydown', down); removeEventListener('keyup', up) }
  }, [])
  return (
    <>
      <div className="pressure" ref={ov} aria-hidden="true" />
      <span className="pressure-label mono" ref={label} aria-hidden="true">Free-diving · pressure rising</span>
      <button
        className="hold-btn mono"
        onPointerDown={() => setHold(true)}
        onPointerUp={() => setHold(false)}
        onPointerLeave={() => setHold(false)}
        onPointerCancel={() => setHold(false)}
        onKeyDown={(e) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); setHold(true) } }}
        onKeyUp={() => setHold(false)}
        data-cursor="Hold"
        aria-label="Hold to free-dive down the page"
      >
        <kbd>Space</kbd> <span className="hold-long">Hold to free-dive</span><span className="hold-short">Hold to dive</span>
      </button>
    </>
  )
}


/** The secret: free-dive all the way down and the trench opens. Remembered in localStorage. */
function Trench() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const reached = () => {
      let seen = false
      try { seen = localStorage.getItem('trench') === '1' } catch { /* ignore */ }
      if (seen) return
      try { localStorage.setItem('trench', '1') } catch { /* ignore */ }
      window.dispatchEvent(new Event('trench'))
      setHold(false)
      setOpen(true)
      sound.chime()
      ;[0, 220, 480].forEach((t, i) => setTimeout(() => ripple(0.5, 0.5, 2.2 - i * 0.5), t))
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('trench-reached', reached)
    addEventListener('keydown', key)
    return () => { window.removeEventListener('trench-reached', reached); removeEventListener('keydown', key) }
  }, [])

  const sparks = useRef(Array.from({ length: 56 }, (_, i) => {
    const a = (i / 56) * Math.PI * 2 + Math.sin(i * 7.3) * 0.3
    const r = 140 + ((i * 53) % 240)
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, d: (i % 9) * 40, s: 3 + (i % 4) * 2, h: 170 + (i % 5) * 28 }
  })).current

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="trench" role="dialog" aria-modal="true" aria-label="Secret unlocked: the trench" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <div className="trench-burst" aria-hidden="true">
            {sparks.map((p, i) => (
              <motion.i key={i} style={{ width: p.s, height: p.s, background: `hsl(${p.h} 100% 70%)`, boxShadow: `0 0 12px hsl(${p.h} 100% 65%)` }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.2 }} animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: 1 }} transition={{ duration: 2.4, delay: p.d / 1000, ease: [0.22, 1, 0.36, 1] }} />
            ))}
          </div>
          <motion.span className="mono" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>Secret unlocked · The trench · −200 m</motion.span>
          <motion.h2 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            You held your breath <span className="serif">all the way down.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
            Almost nobody free-dives to the bottom. Here's the deal: email me with <b>trench</b> in the subject and I'll reply first.
          </motion.p>
          <motion.div className="cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15 }}>
            <a className="btn primary" href={`mailto:${profile.email}?subject=${encodeURIComponent('I found the trench')}`} data-cursor="Email">Email me from the trench</a>
            <button className="btn" onClick={() => setOpen(false)} data-cursor="Close">Keep diving</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Atmosphere() {
  return (
    <>
      <Trail />
      <ZoneBanner />
      <Pressure />
      <Trench />
    </>
  )
}
