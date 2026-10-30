import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Loader } from './components/Loader'
import { Cursor } from './components/Cursor'
import { Hud } from './components/Hud'
import { Hero } from './components/Hero'
import { Marquee } from './components/Marquee'
import { About } from './components/About'
import { Dives } from './components/Dives'
import { Reef } from './components/Reef'
import { Contact } from './components/Contact'
import { Offer } from './components/Offer'
import { Atmosphere } from './components/Atmosphere'
import { allProjects, profile } from './data'
import { ripple, world } from './world'
import { sound } from './audio'
import { track } from './analytics'
import { SceneGate } from './components/SceneGate'

// below-the-fold and on-demand pieces load in their own chunks, then get prefetched when the browser is idle
const Sonar = lazy(() => import('./components/Sonar').then((m) => ({ default: m.Sonar })))
const Contributions = lazy(() => import('./components/Contributions').then((m) => ({ default: m.Contributions })))
const Diver = lazy(() => import('./components/Diver'))
const Palette = lazy(() => import('./components/Palette').then((m) => ({ default: m.Palette })))
const Hold = ({ id, cls, h }: { id: string; cls: string; h: string }) => <section id={id} className={cls} style={{ minHeight: h }} aria-hidden="true" />

const idFromHash = () => {
  const m = location.hash.match(/^#\/dive\/([\w-]+)/)
  return m && allProjects.some((p) => p.id === m[1]) ? m[1] : null
}

export default function App() {
  const [go, setGo] = useState(false)
  const [palette, setPaletteState] = useState(false)
  const [palMounted, setPalMounted] = useState(false)
  const setPalette = useCallback((v: boolean) => { if (v) setPalMounted(true); setPaletteState(v) }, [])
  const [openId, setOpenIdState] = useState<string | null>(idFromHash)
  const [toast, setToast] = useState('')
  const [diverOpen, setDiverOpen] = useState(false)
  const [diverMounted, setDiverMounted] = useState(false)
  const openDiver = useCallback(() => { setDiverMounted(true); setDiverOpen(true) }, [])

  const setOpenId = useCallback((id: string | null) => {
    setOpenIdState(id)
    if (id) track(`case-${id}`)
    history.replaceState(null, '', id ? `#/dive/${id}` : location.pathname)
  }, [])

  const say = useCallback((m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2200)
  }, [])

  const copy = useCallback(() => {
    track('email-copy')
    navigator.clipboard?.writeText(profile.email).then(
      () => say('Email copied to clipboard'),
      () => say(profile.email),
    )
    ripple(0.5, 0.6, 1.2)
  }, [say])

  const toggleSound = useCallback(async () => {
    await sound.toggle()
    window.dispatchEvent(new Event('snd'))
    say(sound.enabled ? 'Sound on' : 'Sound off')
  }, [say])

  // the palette chunk loads on first use, so the shortcut that opens it lives here until it has mounted
  useEffect(() => {
    if (palMounted) return
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /input|textarea/i.test(e.target.tagName)
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) { e.preventDefault(); setPalette(true) }
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [palMounted, setPalette])

  // warm the lazy chunks once the intro is done and the browser is idle
  useEffect(() => {
    if (!go) return
    const idle = (window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1200))
    idle(() => { void import('./components/Sonar'); void import('./components/Contributions'); void import('./components/Palette') })
  }, [go])

  // magnetic buttons: they lean toward the cursor
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || world.reduced) return
    let cur: HTMLElement | null = null
    const reset = () => { if (cur) { cur.style.transform = ''; cur = null } }
    const move = (e: PointerEvent) => {
      const el = (e.target instanceof Element ? e.target : null)?.closest<HTMLElement>('.btn,.brand,.hud-tools button,.copy') ?? null
      if (el !== cur) { reset(); cur = el; if (el) sound.tick(1500) }
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2)
      el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.4}px)`
    }
    addEventListener('pointermove', move, { passive: true })
    return () => { removeEventListener('pointermove', move); reset() }
  }, [])

  // pointer ripples: movement leaves a wake, clicks drop a stone
  useEffect(() => {
    let lx = 0, ly = 0
    const move = (e: PointerEvent) => {
      const dx = e.clientX - lx, dy = e.clientY - ly
      if (dx * dx + dy * dy > 95 * 95) {
        lx = e.clientX; ly = e.clientY
        if (world.loaded) ripple(e.clientX / innerWidth, e.clientY / innerHeight, 0.7)
      }
    }
    const down = (e: PointerEvent) => ripple(e.clientX / innerWidth, e.clientY / innerHeight, 1.5)
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerdown', down, { passive: true })
    return () => { removeEventListener('pointermove', move); removeEventListener('pointerdown', down) }
  }, [])

  return (
    <>
      <SceneGate />
      <Cursor />
      <Loader onDone={() => { world.loaded = true; setGo(true) }} />
      <Atmosphere />
      <Hud onPalette={() => setPalette(true)} onAsk={openDiver} />

      <main data-go={go}>
        <Hero go={go} />
        <Marquee words={['Coding Club President', 'Full-stack', 'IoT', '3D web', 'Hackathon lead', 'Ships real things']} />
        <About onOpen={(id) => setOpenId(id)} />
        <Dives openId={openId} setOpenId={setOpenId} />
        <Reef onOpen={(id) => setOpenId(id)} />
        <Suspense fallback={<Hold id="sonar" cls="sonar" h="120vh" />}><Sonar /></Suspense>
        <Suspense fallback={<Hold id="signal" cls="signal" h="100vh" />}><Contributions /></Suspense>
        <Offer onOpen={(id) => setOpenId(id)} />
        <Contact copy={copy} />
      </main>

      {palMounted && <Suspense fallback={null}><Palette open={palette} setOpen={setPalette} openCase={(id) => setOpenId(id)} copy={copy} toggleSound={toggleSound} ask={openDiver} /></Suspense>}

      {diverMounted && <Suspense fallback={null}><Diver open={diverOpen} onClose={() => setDiverOpen(false)} onOpenCase={(id) => setOpenId(id)} /></Suspense>}

      <AnimatePresence>
        {toast && (
          <motion.div className="toast mono" role="status" initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
