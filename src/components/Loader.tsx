import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { lockScroll, ripple, world } from '../world'

/** Cinematic descent: a rising water line, a counter in variable type, then a splash into the hero. */
export function Loader({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false)
  const num = useRef<HTMLSpanElement>(null)
  const fill = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const dur = world.reduced ? 400 : 2600
    let fontsReady = false
    document.fonts.ready.then(() => (fontsReady = true))
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      const v = Math.round(e * 100)
      if (num.current) {
        num.current.textContent = String(v).padStart(3, '0')
        num.current.style.setProperty('--w', String(100 + e * 800))
      }
      if (fill.current) fill.current.style.transform = `translateY(${(1 - e) * 100}%)`
      if (p < 1 || !fontsReady) raf = requestAnimationFrame(tick)
      else {
        setDone(true)
        lockScroll(false)
        document.documentElement.classList.remove('locked')
        // the splash lands as the iris closes
        setTimeout(() => { ripple(0.5, 0.42, 2.2); setTimeout(() => ripple(0.5, 0.42, 1.2), 380) }, 650)
      }
    }
    raf = requestAnimationFrame(tick)
    lockScroll(true)
    document.documentElement.classList.add('locked')
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!done && (
        <motion.div
          className="loader"
          exit={{ clipPath: 'circle(0% at 50% 42%)' }}
          initial={{ clipPath: 'circle(150% at 50% 42%)' }}
          transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="loader-water"><div ref={fill} className="loader-fill" /></div>
          <div className="loader-ui mono">
            <span>Submerging</span>
            <span>Jay Naik / Deep Dive</span>
          </div>
          <div className="loader-num"><span ref={num} className="ch">000</span></div>
          <div className="loader-foot mono">Pressure rising · lights dimming · wear headphones for the full dive</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
