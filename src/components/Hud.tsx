import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { goTo, onFrame, toggleNight, world } from '../world'
import { sound } from '../audio'
import { MAX_DEPTH, sections } from '../data'
import { quality } from '../quality'

// zone names by metres, matching the labels on each section
const zones: [number, string][] = [[0, 'Sunlight zone'], [35, 'Twilight zone'], [130, 'Midnight zone'], [198, 'The seabed']]

/** Metres at scroll position y, interpolating between where each section starts. */
function metresAt(y: number, tops: number[], end: number) {
  let i = 0
  while (i + 1 < sections.length && tops[i + 1] <= y) i++
  const a = tops[i], b = i + 1 < sections.length ? tops[i + 1] : Math.max(end, a + 1)
  const m0 = sections[i].m, m1 = i + 1 < sections.length ? sections[i + 1].m : MAX_DEPTH
  return Math.min(MAX_DEPTH, Math.max(0, m0 + ((y - a) / (b - a)) * (m1 - m0)))
}

export function Hud({ onPalette, onAsk }: { onPalette: () => void; onAsk: () => void }) {
  const pin = useRef<HTMLDivElement>(null)
  const gauge = useRef<HTMLDivElement>(null)
  const depth = useRef<HTMLElement>(null)
  const readout = useRef<HTMLDivElement>(null)
  const zone = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [snd, setSnd] = useState(false)
  const [night, setNight] = useState(world.nightTarget > 0.5)
  const [trench, setTrench] = useState(() => { try { return localStorage.getItem('trench') === '1' } catch { return false } })
  const [active, setActive] = useState('top')
  const last = useRef('')
  const inkStep = useRef(-1)
  const frame = useRef(0)
  const tops = useRef<number[]>([])
  const pageEnd = useRef(1)
  const gaugeH = useRef(0)
  const dirty = useRef(true)
  const curSection = useRef('top')
  const wasTop = useRef<boolean | null>(null)
  const lastM = useRef(-1)
  const lastFrac = useRef(-1)
  const nav = useRef<HTMLElement>(null)

  useEffect(() => {
    const sync = () => setSnd(sound.enabled)
    const syncNight = () => setNight(world.nightTarget > 0.5)
    const onTrench = () => setTrench(true)
    window.addEventListener('snd', sync)
    window.addEventListener('night', syncNight)
    window.addEventListener('trench', onTrench)
    return () => { window.removeEventListener('snd', sync); window.removeEventListener('night', syncNight); window.removeEventListener('trench', onTrench) }
  }, [])

  useEffect(() => {
    const mark = () => { dirty.current = true }
    addEventListener('resize', mark)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(mark) : null
    ro?.observe(document.body)
    return () => { removeEventListener('resize', mark); ro?.disconnect() }
  }, [])

  // on small screens the section list scrolls sideways: keep the current section in view
  useEffect(() => {
    const a = nav.current?.querySelector<HTMLElement>('a[data-on=true]')
    if (nav.current && a) nav.current.scrollTo({ left: a.offsetLeft - nav.current.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' })
  }, [active])

  useEffect(
    () =>
      onFrame(() => {
        const d = world.depth
        const root = document.documentElement
        // ink flips from navy to white as the light fades
        const k = Math.min(1, Math.max(0, (d - 0.03) / 0.11)), e = Math.max(k * k * (3 - 2 * k), world.night)
        const a = [6, 34, 58], b = [226, 248, 252]
        // custom props on :root restyle the whole page, which is by far the most expensive thing this loop can do.
        // So the ink colour moves in 24 steps instead of 60 per second: the eye cannot tell, the browser can.
        const step = Math.round(e * 24)
        if (step !== inkStep.current) {
          inkStep.current = step
          const f = step / 24
          root.style.setProperty('--ink', `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f))})`)
          root.style.setProperty('--ink-inv', `rgb(${b.map((v, i) => Math.round(v + (a[i] - v) * f))})`)
        }
        // layout reads (section tops, page height, gauge height) happen a couple of times a second, never every frame:
        // reading layout right after other code has written styles forces the browser to lay the page out again, mid-frame
        if (frame.current++ % 45 === 0 || dirty.current) {
          dirty.current = false
          const next: number[] = []
          for (const s of sections) {
            const el = document.getElementById(s.id)
            next.push(el ? el.getBoundingClientRect().top + scrollY : Infinity)
          }
          if (next.every(Number.isFinite)) tops.current = next
          pageEnd.current = root.scrollHeight - innerHeight
          gaugeH.current = gauge.current?.clientHeight ?? 0
        }
        const t = tops.current
        const sy = scrollY
        const ready = t.length === sections.length
        const metres = ready ? metresAt(sy, t, pageEnd.current) : d * MAX_DEPTH
        if (ready) {
          let cur = 'top'
          for (let i = 0; i < sections.length; i++) if (t[i] - sy < innerHeight * 0.45) cur = sections[i].id
          if (cur !== curSection.current) { curSection.current = cur; setActive(cur) }
        }
        sound.setDepth(metres / MAX_DEPTH)
        // only touch the DOM when a value actually changed
        const atTop = sy < 80
        if (atTop !== wasTop.current) { wasTop.current = atTop; if (readout.current) readout.current.dataset.top = String(atTop) }
        const m = Math.round(metres)
        if (m !== lastM.current) { lastM.current = m; if (depth.current) depth.current.textContent = m + ' m' }
        let z = zones[0][1]
        zones.forEach((zz) => metres >= zz[0] && (z = zz[1]))
        if (zone.current && z !== last.current) {
          zone.current.textContent = z
          if (last.current) window.dispatchEvent(new CustomEvent('zone', { detail: z }))
          last.current = z
        }
        const frac = Math.round((metres / MAX_DEPTH) * 1000) / 1000
        if (frac !== lastFrac.current) {
          lastFrac.current = frac
          if (pin.current) pin.current.style.transform = `translateY(${(frac * gaugeH.current).toFixed(1)}px)`
          if (bar.current) bar.current.style.transform = `scaleX(${frac})`
        }
      }),
    [],
  )

  return (
    <>
      <div className="hud hud-top mono">
        <button className="brand" onClick={() => goTo(0)} data-cursor="Surface">JN</button>
        <nav aria-label="Sections" ref={nav}>
          {sections.slice(1).map((s) => (
            <a key={s.id} href={`#${s.id}`} data-on={active === s.id} onClick={(e) => { e.preventDefault(); goTo('#' + s.id) }}>
              {s.label}
            </a>
          ))}
        </nav>
        <div className="hud-tools">
          <button onClick={onAsk} aria-label="Ask the diver" data-cursor="Ask">
            <span aria-hidden="true">✦</span>
            <span className="tool-label">Ask</span>
          </button>
          <button onClick={toggleNight} aria-pressed={night} aria-label={night ? 'Switch to daylight water' : 'Switch to moonlit water'} data-cursor={night ? 'Day' : 'Night'}>
            <span aria-hidden="true">{night ? '☀' : '☾'}</span>
            <span className="tool-label">{night ? 'Day' : 'Night'}</span>
          </button>
          {!quality.touch && <button onClick={onPalette} aria-label="Open command palette"><kbd>⌘</kbd><kbd>K</kbd></button>}
          <button
            aria-pressed={snd}
            aria-label={snd ? 'Mute ambient sound' : 'Enable ambient sound'}
            onClick={async () => { await sound.toggle(); setSnd(sound.enabled) }}
          >
            <span className="eq" data-on={snd}><i /><i /><i /><i /></span>
            {snd ? 'Sound on' : 'Sound off'}
          </button>
        </div>
      </div>

      <div className="hud gauge" ref={gauge} aria-hidden="true">
        <div className="rail" /><div className="ticks" />
        <div className="pin" ref={pin}><i /></div>
      </div>

      <div className="hud readout mono" aria-hidden="true" ref={readout}>
        <span>Depth <b ref={depth}>0 m</b></span>
        <span ref={zone}>Sunlight zone</span>
        {trench && <span className="trench-badge" title="Secret found: the trench">◆ Trench</span>}
      </div>
      <motion.div className="progress" ref={bar} aria-hidden="true" />
    </>
  )
}
