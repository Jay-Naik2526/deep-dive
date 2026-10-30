import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { BendText } from './BendText'
import { logbook, numbers } from '../data'

function Counter({ n, plus, pre }: { n: number; plus: boolean; pre?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    let raf = 0
    const s = performance.now()
    const f = (now: number) => {
      const p = Math.min(1, (now - s) / 1600)
      setV(Math.round((1 - Math.pow(1 - p, 4)) * n))
      if (p < 1) raf = requestAnimationFrame(f)
    }
    raf = requestAnimationFrame(f)
    return () => cancelAnimationFrame(raf)
  }, [inView, n])
  return <span ref={ref}>{pre}{v}{plus && '+'}</span>
}

const rise = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } }

export function About() {
  return (
    <section className="about" id="about">
      <div className="zone mono">10 m · Sunlight zone</div>
      <h2 className="h2" aria-label="Above the line"><span className="serif">Above</span> <BendText text="the line" preset="h2" /></h2>

      <div className="about-grid">
        <motion.p className="lede" variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-12%' }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          I'm the <em>President of the Coding Club</em> at NMIMS Shirpur. Before that I led web at <em>GDG on Campus</em>, where I ran a team of ten. I ship real products for real students, and I wire ESP32s to the internet when software gets too comfortable.
        </motion.p>

        <div className="numbers">
          {numbers.map((n, i) => (
            <motion.div key={i} className="num" variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              <b><Counter n={n.n} plus={n.plus} pre={n.pre} /></b>
              <span className="mono">{n.label}</span>
            </motion.div>
          ))}
        </div>

        <ol className="logbook">
          {logbook.map((l, i) => (
            <motion.li
              key={l.role + l.org}
              data-now={l.now ? 'true' : undefined}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ delay: i * 0.05, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="when mono">{l.when}</span>
              <div>
                <h3>{l.role}{l.now && <span className="badge mono"><i /> Now</span>}</h3>
                <span className="org mono">{l.org}</span>
                <ul>{l.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
