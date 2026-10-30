import { Fragment, useEffect, useRef, type CSSProperties } from 'react'
import { onFrame, world } from '../world'

/**
 * Every letter is a spring on two variable-font axes (weight + width).
 * The cursor swells nearby letters, a slow wave runs through on its own,
 * and scrolling fast makes the whole line shiver.
 */
type Preset = 'hero' | 'h2' | 'title' | 'mail'
const PRESETS: Record<Preset, { w: number; wd: number; hi: number; hiwd: number; wave: number }> = {
  hero: { w: 300, wd: 100, hi: 900, hiwd: 140, wave: 0.42 },
  h2: { w: 260, wd: 90, hi: 820, hiwd: 135, wave: 0 },
  title: { w: 200, wd: 80, hi: 760, hiwd: 125, wave: 0 },
  mail: { w: 220, wd: 90, hi: 800, hiwd: 125, wave: 0 },
}

interface Rec {
  el: HTMLElement
  host: Element
  i: number
  p: (typeof PRESETS)[Preset]
  w: number
  vw: number
  wd: number
  vwd: number
  ow: number
  owd: number
  ox: number
  oy: number
}

const registry = new Set<Rec>()
const visible = new WeakMap<Element, boolean>()
const io =
  typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((es) => es.forEach((e) => visible.set(e.target, e.isIntersecting)), { rootMargin: '12% 0px' })
    : null

if (typeof window !== 'undefined') {
  let frame = 0
  onFrame((t, dt) => {
    frame++
    const refresh = frame % 12 === 0
    const hostRects = new Map<Element, DOMRect>()
    const R = Math.min(420, innerWidth * 0.34)
    const kickAmt = world.reduced ? 0 : Math.min(1, Math.abs(world.vel) / 1800)
    registry.forEach((l) => {
      if (!visible.get(l.host)) return
      // one layout read per heading per frame; letter offsets are cached and refreshed ~5x/sec
      let hr = hostRects.get(l.host)
      if (!hr) { hr = l.host.getBoundingClientRect(); hostRects.set(l.host, hr) }
      if (refresh || l.ox === -1) {
        const r = l.el.getBoundingClientRect()
        l.ox = r.left - hr.left + r.width / 2
        l.oy = r.top - hr.top + r.height / 2
      }
      let prox = 0
      if (world.active && !world.reduced) {
        const dx = hr.left + l.ox - world.px
        const dy = (hr.top + l.oy - world.py) * 1.4
        prox = Math.exp(-(dx * dx + dy * dy) / (R * R * 0.35))
      }
      const wave = world.reduced ? 0 : (0.5 + 0.5 * Math.sin(t * 1.0 - l.i * 0.7)) * l.p.wave
      const kick = kickAmt * (0.5 + 0.5 * Math.sin(t * 6 - l.i * 0.9)) * 0.55
      const k = Math.min(1, Math.max(prox, wave) + kick)
      const tw = l.p.w + (l.p.hi - l.p.w) * k
      const twd = l.p.wd + (l.p.hiwd - l.p.wd) * k
      if (Math.abs(tw - l.w) < 0.4 && Math.abs(twd - l.wd) < 0.4 && Math.abs(l.vw) < 1 && Math.abs(l.vwd) < 1) return
      l.vw += ((tw - l.w) * 190 - l.vw * 17) * dt
      l.w += l.vw * dt
      l.vwd += ((twd - l.wd) * 190 - l.vwd * 17) * dt
      l.wd += l.vwd * dt
      if (Math.abs(l.w - l.ow) > 0.6 || Math.abs(l.wd - l.owd) > 0.6) {
        l.el.style.setProperty('--w', l.w.toFixed(1))
        l.el.style.setProperty('--wd', l.wd.toFixed(1))
        l.ow = l.w
        l.owd = l.wd
      }
    })
  })
}

export function BendText({ text, preset = 'h2', className = '' }: { text: string; preset?: Preset; className?: string }) {
  const host = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const h = host.current
    if (!h) return
    io?.observe(h)
    const p = PRESETS[preset]
    const recs: Rec[] = [...h.querySelectorAll<HTMLElement>('.ch')].map((el, i) => ({ el, host: h, i, p, w: p.w, vw: 0, wd: p.wd, vwd: 0, ow: -1, owd: -1, ox: -1, oy: -1 }))
    recs.forEach((r) => registry.add(r))
    return () => {
      io?.unobserve(h)
      recs.forEach((r) => registry.delete(r))
    }
  }, [text, preset])

  return (
    <span ref={host} className={`bend ${className}`} aria-label={text}>
      {[...text].map((c, i) =>
        c === ' ' ? (
          <Fragment key={i}> </Fragment>
        ) : (
          <span key={i} className="ch" aria-hidden="true" style={{ '--i': i, '--w': PRESETS[preset].w, '--wd': PRESETS[preset].wd } as CSSProperties}>
            {c}
          </span>
        ),
      )}
    </span>
  )
}
