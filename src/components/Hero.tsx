import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BendText } from './BendText'
import { goTo } from '../world'
import { profile, roles } from '../data'

export function Hero({ go }: { go: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % roles.length), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="hero" id="top" data-go={go}>
      <div className="zone mono reveal-up" style={{ '--d': '0.1s' } as React.CSSProperties}>
        <span className="live" /> Surface · 0 m · {profile.location}
      </div>

      <h1 className="name" aria-label="Jay Naik">
        <span className="rowmask"><span className="row"><BendText text="JAY" preset="hero" /></span></span>
        <span className="rowmask"><span className="row"><BendText text="NAIK" preset="hero" /></span></span>
      </h1>

      <div className="intro">
        <div className="reveal-up" style={{ '--d': '0.9s' } as React.CSSProperties}>
          <div className="role-line">
            <span className="mono">Currently</span>
            <span className="role-swap">
              <AnimatePresence mode="wait">
                <motion.span
                  key={roles[i]}
                  className="serif"
                  initial={{ y: '110%', opacity: 0, filter: 'blur(6px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: '-110%', opacity: 0, filter: 'blur(6px)' }}
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                >
                  {roles[i]}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
          <p>
            President of the Coding Club at NMIMS Shirpur, previously Web Dev Lead at GDG on Campus. I build <em>things that actually ship</em>: web, IoT, and 3D you can touch.
          </p>
          <div className="cta">
            <button className="btn primary" data-cursor="Dive" onClick={() => goTo('#dives')}>
              Start the dive <span aria-hidden="true">↓</span>
            </button>
            <a className="btn" href={profile.resume} target="_blank" rel="noopener" data-cursor="Open">Résumé ↗</a>
            <a className="btn ghost" href={profile.hologram} target="_blank" rel="noopener" data-cursor="3D">Holographic version ↗</a>
          </div>
        </div>
        <div className="cue reveal-up" style={{ '--d': '1.1s' } as React.CSSProperties}>
          <span className="open mono"><i /> Open to internships · freelance</span>
          <span className="mono">Move your cursor · scroll to descend</span>
          <span className="arrow" />
        </div>
      </div>
    </section>
  )
}
