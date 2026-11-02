import Lenis from 'lenis'
import { sound } from './audio'
import { quality } from './quality'

/**
 * Mutable per-frame state shared by the DOM and the WebGL scene.
 * It lives outside React so a 60fps update never triggers a re-render.
 */
export const NR = 12

export const world = {
  t: 0,
  dt: 0.016,
  depth: 0, // 0 surface -> 1 seabed (smoothed)
  scrollY: 0,
  scrollMax: 1,
  vel: 0, // smoothed scroll velocity, px/s
  px: -9999, // pointer in px
  py: -9999,
  nx: 0.5, // pointer normalised
  ny: 0.5,
  active: false,
  rip: new Float32Array(NR * 3).fill(-100),
  str: new Float32Array(NR),
  ri: 0,
  loaded: false,
  night: 0, // 0 day water .. 1 moonlit water (smoothed)
  nightTarget: 0,
  hold: 0, // 0..1 eased free-dive pressure
  holding: false,
  reduced: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
}

/** auto from the visitor's local clock, overridable with ?time=night|day or the toggle in the HUD */
function initialNight() {
  try {
    const q = new URLSearchParams(location.search).get('time')
    if (q === 'night') return 1
    if (q === 'day') return 0
    const saved = localStorage.getItem('night')
    if (saved === '1') return 1
    if (saved === '0') return 0
  } catch { /* storage can be blocked */ }
  const h = new Date().getHours()
  return h >= 19 || h < 5 ? 1 : h >= 17 || h < 7 ? 0.5 : 0
}
world.nightTarget = world.night = typeof window === 'undefined' ? 0 : initialNight()
export function toggleNight() {
  world.nightTarget = world.nightTarget > 0.5 ? 0 : 1
  try { localStorage.setItem('night', String(world.nightTarget)) } catch { /* ignore */ }
  window.dispatchEvent(new Event('night'))
}

export function ripple(nx: number, ny: number, strength = 1) {
  const i = world.ri
  world.rip[i * 3] = nx
  world.rip[i * 3 + 1] = ny
  world.rip[i * 3 + 2] = world.t
  world.str[i] = strength
  world.ri = (i + 1) % NR
  sound.bubble(strength)
}

type Listener = (t: number, dt: number, rawDt: number) => void
const listeners = new Set<Listener>()
export const onFrame = (fn: Listener) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/* ---------- smooth scroll (Lenis) ---------- */
// touch devices already have good native momentum scrolling; smoothing it in JS only adds latency and cost
export const lenis = world.reduced || quality.touch ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.4 })

export function goTo(target: string | number | HTMLElement, offset = 0) {
  sound.whoosh(1, 0.9)
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (lenis) lenis.scrollTo(el ?? (target as number), { offset, duration: 1.8, easing: (x) => 1 - Math.pow(1 - x, 4) })
  else if (el instanceof HTMLElement) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: 'smooth' })
}
export const setHold = (on: boolean) => {
  if (on === world.holding) return
  world.holding = on
  if (on) sound.whoosh(-1, 1.1)
}
export const lockScroll = (lock: boolean) => (lock ? lenis?.stop() : lenis?.start())

let started = false
export function startWorld() {
  if (started) return
  started = true
  let last = performance.now()
  let prevY = window.scrollY
  const measure = () => { world.scrollMax = Math.max(1, document.documentElement.scrollHeight - innerHeight) }
  measure()
  new ResizeObserver(measure).observe(document.body)
  addEventListener('resize', measure)
  addEventListener('load', measure)
  addEventListener('scroll', () => (world.scrollY = window.scrollY), { passive: true })
  addEventListener(
    'pointermove',
    (e) => {
      world.px = e.clientX
      world.py = e.clientY
      world.nx = e.clientX / innerWidth
      world.ny = e.clientY / innerHeight
      world.active = true
    },
    { passive: true },
  )
  document.addEventListener('pointerleave', () => (world.active = false))
  addEventListener('pointerup', (e) => e.pointerType === 'touch' && (world.active = false))

  const frame = (now: number) => {
    const raw = Math.max(0.001, (now - last) / 1000)
    last = now
    const dt = Math.min(0.033, raw)
    world.dt = dt
    world.t += dt
    lenis?.raf(now)
    const v = (world.scrollY - prevY) / raw
    prevY = world.scrollY
    world.vel += (v - world.vel) * (1 - Math.exp(-raw * 8))
    const target = Math.min(1, Math.max(0, world.scrollY / world.scrollMax))
    world.depth += (target - world.depth) * (1 - Math.exp(-raw * 6))
    world.night += (world.nightTarget - world.night) * (1 - Math.exp(-raw * 2.5))
    // free-dive: holding eases speed up, releasing eases it back down
    world.hold += ((world.holding && !document.documentElement.classList.contains('locked') ? 1 : 0) - world.hold) * (1 - Math.exp(-raw * 2.6))
    if (world.hold > 0.02 && world.scrollY < world.scrollMax - 1) {
      const y = Math.min(world.scrollMax, world.scrollY + world.hold * 1500 * raw)
      if (lenis) lenis.scrollTo(y, { immediate: true })
      else window.scrollTo(0, y)
    }
    listeners.forEach((fn) => fn(world.t, dt, raw))
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
