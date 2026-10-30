import { useEffect, useMemo, useRef, useState } from 'react'
import { BendText } from './BendText'
import { skillGroups } from '../data'
import { onFrame, ripple } from '../world'
import { sound } from '../audio'
import { quality } from '../quality'

interface Blip { label: string; g: number; a: number; r: number; b: number; pinged: boolean }
const TAU = Math.PI * 2
const glowCache = new Map<number, HTMLCanvasElement>()
function glow(hue: number) {
  let c = glowCache.get(hue)
  if (!c) {
    c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')!
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, `hsla(${hue},100%,70%,.9)`)
    gr.addColorStop(0.35, `hsla(${hue},100%,65%,.28)`)
    gr.addColorStop(1, `hsla(${hue},100%,60%,0)`)
    g.fillStyle = gr
    g.fillRect(0, 0, 64, 64)
    glowCache.set(hue, c)
  }
  return c
}

/** Radar sweep over every skill. Blips light up as the beam passes and ping softly (with sound on). */
export function Sonar() {
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const hov = useRef<number>(-1)
  const [group, setGroup] = useState<number | null>(null)
  const groupRef = useRef<number | null>(null)
  groupRef.current = group
  const [label, setLabel] = useState('')

  const blips = useMemo<Blip[]>(() => {
    const out: Blip[] = []
    skillGroups.forEach((g, gi) => {
      g.items.forEach((label, k) => {
        const a = (gi / skillGroups.length) * TAU + (k / g.items.length) * (TAU / skillGroups.length) * 0.92 + 0.12
        const r = 0.3 + ((k * 0.37 + gi * 0.21) % 0.62)
        out.push({ label, g: gi, a: a % TAU, r, b: 0, pinged: false })
      })
    })
    return out
  }, [])

  useEffect(() => {
    const c = cv.current, w = wrap.current
    if (!c || !w) return
    const ctx = c.getContext('2d')!
    let size = 600, dpr = 1
    const fit = () => {
      dpr = Math.min(devicePixelRatio || 1, quality.lite ? 1 : 1.5)
      size = Math.min(w.clientWidth, 720)
      c.width = size * dpr; c.height = size * dpr
      c.style.width = size + 'px'; c.style.height = size + 'px'
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(w)

    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      const x = e.clientX - r.left - size / 2, y = e.clientY - r.top - size / 2
      const R = size / 2 - 24
      let best = -1, bd = 26 * 26
      blips.forEach((b, i) => {
        const bx = Math.cos(b.a) * b.r * R, by = Math.sin(b.a) * b.r * R
        const d = (bx - x) ** 2 + (by - y) ** 2
        if (d < bd) { bd = d; best = i }
      })
      if (best !== hov.current) {
        hov.current = best
        setLabel(best >= 0 ? blips[best].label : '')
        if (best >= 0) { ripple(e.clientX / innerWidth, e.clientY / innerHeight, 0.5); sound.ping(520 + blips[best].g * 90) }
      }
    }
    const leave = () => { hov.current = -1; setLabel('') }
    c.addEventListener('pointermove', move)
    c.addEventListener('pointerdown', move)
    c.addEventListener('pointerleave', leave)

    let skip = 0
    const off = onFrame((t) => {
      // radar redraws at 30fps (20 on lite); the sweep is slow enough that you can't tell
      if (quality.lite ? ++skip % 3 !== 0 : (skip ^= 1) === 1) return
      const rect = c.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > innerHeight) return
      const R = size / 2 - 24
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)
      ctx.translate(size / 2, size / 2)
      const sweep = (t * 0.85) % TAU
      // rings + spokes
      ctx.strokeStyle = 'rgba(124,243,255,.18)'; ctx.lineWidth = 1
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(0, 0, (R * i) / 4, 0, TAU); ctx.stroke() }
      for (let i = 0; i < skillGroups.length; i++) {
        const a = (i / skillGroups.length) * TAU
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke()
      }
      // beam
      const g = ctx.createConicGradient(sweep - 0.9, 0, 0)
      g.addColorStop(0, 'rgba(124,243,255,0)'); g.addColorStop(0.14, 'rgba(124,243,255,.34)'); g.addColorStop(0.1401, 'rgba(124,243,255,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill()
      ctx.strokeStyle = 'rgba(190,255,255,.9)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sweep) * R, Math.sin(sweep) * R); ctx.stroke()

      ctx.font = '500 11px "JetBrains Mono Variable", monospace'
      ctx.textBaseline = 'middle'
      const gsel = groupRef.current
      blips.forEach((b, i) => {
        const diff = (sweep - b.a + TAU) % TAU
        if (diff < 0.06 && !b.pinged) { b.pinged = true; b.b = 1; if (i % 3 === 0) sound.ping(420 + b.g * 70) }
        if (diff > 0.3) b.pinged = false
        b.b = Math.max(b.b * 0.985, Math.exp(-diff * 1.4))
        const isH = hov.current === i, isG = gsel === b.g
        const a = Math.max(isH || isG ? 1 : 0, b.b)
        const x = Math.cos(b.a) * b.r * R, y = Math.sin(b.a) * b.r * R
        const hue = 170 + b.g * 28
        const gs = 16 + a * 40 + (isH ? 10 : 0)
        ctx.globalAlpha = Math.min(1, 0.25 + a)
        ctx.drawImage(glow(hue), x - gs / 2, y - gs / 2, gs, gs)
        ctx.globalAlpha = 1
        ctx.fillStyle = `hsla(${hue},100%,72%,${0.25 + a * 0.75})`
        ctx.beginPath(); ctx.arc(x, y, 3 + a * 3.5 + (isH ? 3 : 0), 0, TAU); ctx.fill()
        if (a > 0.18) {
          ctx.fillStyle = `rgba(226,248,252,${Math.min(1, a)})`
          ctx.textAlign = x > 0 ? 'left' : 'right'
          ctx.fillText(b.label, x + (x > 0 ? 12 : -12), y)
        }
      })
      ctx.fillStyle = 'rgba(190,255,255,.95)'
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    })
    return () => { off(); ro.disconnect(); c.removeEventListener('pointermove', move); c.removeEventListener('pointerdown', move); c.removeEventListener('pointerleave', leave) }
  }, [blips])

  return (
    <section className="sonar" id="sonar">
      <div className="zone mono">175 m · Echo-location</div>
      <h2 className="h2" aria-label="What I work with"><span className="serif">Ping</span> <BendText text="the stack" preset="h2" /></h2>
      <div className="sonar-grid">
        <div className="radar" ref={wrap} data-cursor="Ping">
          <canvas ref={cv} aria-hidden="true" />
          <div className="radar-label mono" aria-live="polite">{label || (quality.touch ? 'Tap a signal' : 'Hover a signal')}</div>
        </div>
        <div className="legend">
          {skillGroups.map((g, i) => (
            <div className="legend-row" key={g.name} data-on={group === i} onPointerEnter={() => setGroup(i)} onPointerLeave={() => setGroup(null)}>
              <span className="mono"><i style={{ background: `hsl(${170 + i * 28} 100% 72%)` }} />{g.name}</span>
              <p>{g.items.join(' · ')}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
