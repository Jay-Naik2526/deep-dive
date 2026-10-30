import { motion } from 'motion/react'
import { BendText } from './BendText'
import { Marquee } from './Marquee'
import { Guestbook } from './Guestbook'
import { profile } from '../data'
import { ripple } from '../world'

export function Contact({ copy }: { copy: () => void }) {
  return (
    <section className="seabed" id="seabed">
      <div className="zone mono glow">The seabed · say hello</div>
      <motion.h2 className="h2 glow" aria-label="Let's build something" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
        <span className="serif">Let's</span> <BendText text="build" preset="h2" /> something
      </motion.h2>

      <a className="mail glow" href={`mailto:${profile.email}`} data-cursor="Email" onPointerEnter={(e) => ripple(e.clientX / innerWidth, e.clientY / innerHeight, 1)}>
        <BendText text={profile.email} preset="mail" />
      </a>
      <button className="btn copy" onClick={copy} data-cursor="Copy">Copy email</button>

      <div className="links">
        <a href={profile.github} target="_blank" rel="noopener" data-cursor="Open">GitHub <span aria-hidden="true">↗</span></a>
        <a href={profile.linkedin} target="_blank" rel="noopener" data-cursor="Open">LinkedIn <span aria-hidden="true">↗</span></a>
        <a href={profile.hologram} target="_blank" rel="noopener" data-cursor="3D">Holographic portfolio <span aria-hidden="true">↗</span></a>
        <a href={profile.resume} target="_blank" rel="noopener" data-cursor="Open">Résumé <span aria-hidden="true">↗</span></a>
      </div>
      <Guestbook />

      <p className="mono open-line"><i /> Open to internships · part-time · freelance</p>

      <Marquee reverse words={['Coding Club President', 'Ambiora 2027 VP', 'Full-stack', 'IoT', '3D web', 'Hackathon lead', 'Ships real things']} />
      <div className="foot mono"><span>© 2026 {profile.name}</span><span>React · TypeScript · Three.js · Motion · built on a spring, not a timeline</span></div>
    </section>
  )
}
