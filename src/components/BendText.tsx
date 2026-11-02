import { Fragment, useEffect, useRef, type CSSProperties } from 'react'
import { onFrame, world } from '../world'
import { quality } from '../quality'

/**
 * Every letter is a spring on two variable-font axes (weight + width).
 * The cursor swells nearby letters, a slow wave runs through on its own,
 * and scrolling fast makes the whole line shiver.
 */
type Preset = 'hero' | 'h2' | 'title' | 'mail'
const PRESETS: Record<Preset, { w: number; wd: number; hi: number; hiwd: number; wave: number; reach: number }> = {
  hero: { w: 300, wd: 100, hi: 900, hiwd: 140, wave: 0.42, reach: 1 },
  h2: { w: 260, wd: 90, hi: 820, hiwd: 135, wave: 0, reach: 1 },
  // the dive log has seven huge titles stacked close together: a smaller reach keeps one row from waking its neighbours
  title: { w: 200, wd: 80, hi: 760, hiwd: 125, wave: 0, reach: 0.6 },
  mail: { w: 220, wd: 90, hi: 800, hiwd: 125, wave: 0, reach: 0.8 },
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
let needsMeasure = true
const visible = new WeakMap<Element, boolean>()
const io =
  typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((es) => es.forEach((e) => visible.set(e.target, e.isIntersecting)), { rootMargin: '12% 0px' })
    : null

/** Where a heading sat the last time it was measured. Scrolling moves it by a known amount, so no re-measuring is needed. */
const hostPos = new WeakMap<Element, { left: number; top: number; sy: number }>()

if (typeof window !== 'undefined') {
  let frame = 0
  onFrame((t, dt) => {
    frame++
    const refresh = frame % 12 === 0
    const sy = scrollY
    const R = Math.min(420, innerWidth * 0.34)
    const kickAmt = world.reduced || quality.touch ? 0 : Math.min(1, Math.abs(world.vel) / 1800)

    // pass 1: every layout read, together, and only ~5 times a second (or when a letter is new).
    // Reading layout after writing styles forces a full re-layout, so reads never share a loop with writes.
    if (refresh || needsMeasure) {
      needsMeasure = false
      registry.forEach((l) => {
        if (!visible.get(l.host)) return
        if (refresh || l.ox === -1 || !hostPos.has(l.host)) {
          let hp = hostPos.get(l.host)
          if (!hp || refresh) {
            const r = l.host.getBoundingClientRect()
            hp = { left: r.left, top: r.top, sy }
            hostPos.set(l.host, hp)
          }
          const r = l.el.getBoundingClientRect()
          l.ox = r.left - hp.left + r.width / 2
          l.oy = r.top - hp.top + r.height / 2
        }
      })
    }

    // pass 2: pure arithmetic and style writes
    registry.forEach((l) => {
      if (!visible.get(l.host)) return
      const hp = hostPos.get(l.host)
      if (!hp || l.ox === -1) { needsMeasure = true; return }
      let prox = 0
      if (world.active && !world.reduced) {
        const dx = hp.left + l.ox - world.px
        const dy = (hp.top - (sy - hp.sy) + l.oy - world.py) * 1.4
        const rr = R * l.p.reach
        prox = Math.exp(-(dx * dx + dy * dy) / (rr * rr * 0.35))
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
      // every write re-shapes the glyph and re-lays-out its line, so a change below ~2 units (invisible) is not worth one
      if (Math.abs(l.w - l.ow) > 2.2 || Math.abs(l.wd - l.owd) > 1.6) {
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
