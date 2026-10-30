import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { goTo, onFrame, toggleNight, world } from '../world'
import { sound } from '../audio'
import { sections } from '../data'

const MAXD = 200
const zones: [number, string][] = [[0, 'Sunlight zone'], [0.2, 'Twilight zone'], [0.58, 'Midnight zone'], [0.88, 'The seabed']]

export function Hud({ onPalette }: { onPalette: () => void }) {
  const pin = useRef<HTMLDivElement>(null)
  const gauge = useRef<HTMLDivElement>(null)
  const depth = useRef<HTMLElement>(null)
  const zone = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [snd, setSnd] = useState(false)
  const [night, setNight] = useState(world.nightTarget > 0.5)
  const [trench, setTrench] = useState(() => { try { return localStorage.getItem('trench') === '1' } catch { return false } })
  const [active, setActive] = useState('top')
  const last = useRef('')
  const inkKey = useRef('')
  const frame = useRef(0)

  useEffect(() => {
    const sync = () => setSnd(sound.enabled)
    const syncNight = () => setNight(world.nightTarget > 0.5)
    const onTrench = () => setTrench(true)
    window.addEventListener('snd', sync)
    window.addEventListener('night', syncNight)
    window.addEventListener('trench', onTrench)
    return () => { window.removeEventListener('snd', sync); window.removeEventListener('night', syncNight); window.removeEventListener('trench', onTrench) }
  }, [])

  useEffect(
    () =>
      onFrame(() => {
        const d = world.depth
        const root = document.documentElement
        // ink flips from navy to white as the light fades
        const k = Math.min(1, Math.max(0, (d - 0.03) / 0.11)), e = Math.max(k * k * (3 - 2 * k), world.night)
        const a = [6, 34, 58], b = [226, 248, 252]
        // custom props on :root restyle the whole page, so only touch them while the colour is actually changing
        const ink = `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * e))})`
        if (ink !== inkKey.current) {
          inkKey.current = ink
          root.style.setProperty('--ink', ink)
          root.style.setProperty('--ink-inv', `rgb(${b.map((v, i) => Math.round(v + (a[i] - v) * e))})`)
        }
        if (depth.current) depth.current.textContent = Math.round(d * MAXD) + ' m'
        let z = zones[0][1]
        zones.forEach((zz) => d >= zz[0] && (z = zz[1]))
        if (zone.current && z !== last.current) {
          zone.current.textContent = z
          if (last.current) window.dispatchEvent(new CustomEvent('zone', { detail: z }))
          last.current = z
        }
        if (pin.current && gauge.current) pin.current.style.transform = `translateY(${(d * gauge.current.clientHeight).toFixed(1)}px)`
        if (bar.current) bar.current.style.transform = `scaleX(${d})`
        // active section: layout reads are throttled to ~10/sec
        if (++frame.current % 6 === 0) {
          let cur = 'top'
          for (const s of sections) {
            const el = document.getElementById(s.id)
            if (el && el.getBoundingClientRect().top < innerHeight * 0.45) cur = s.id
          }
          setActive((p) => (p === cur ? p : cur))
        }
      }),
    [],
  )

  return (
    <>
      <div className="hud hud-top mono">
        <button className="brand" onClick={() => goTo(0)} data-cursor="Surface">JN</button>
        <nav aria-label="Sections">
          {sections.slice(1).map((s) => (
            <a key={s.id} href={`#${s.id}`} data-on={active === s.id} onClick={(e) => { e.preventDefault(); goTo('#' + s.id) }}>
              {s.label}
            </a>
          ))}
        </nav>
        <div className="hud-tools">
          <button onClick={toggleNight} aria-pressed={night} aria-label={night ? 'Switch to daylight water' : 'Switch to moonlit water'} data-cursor={night ? 'Day' : 'Night'}>
            <span aria-hidden="true">{night ? '☀' : '☾'}</span>
            <span className="tool-label">{night ? 'Day' : 'Night'}</span>
          </button>
          <button onClick={onPalette} aria-label="Open command palette"><kbd>⌘</kbd><kbd>K</kbd></button>
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

      <div className="hud readout mono" aria-hidden="true">
        <span>Depth <b ref={depth}>0 m</b></span>
        <span ref={zone}>Sunlight zone</span>
        {trench && <span className="trench-badge" title="Secret found: the trench">◆ Trench</span>}
      </div>
      <motion.div className="progress" ref={bar} aria-hidden="true" />
    </>
  )
}
