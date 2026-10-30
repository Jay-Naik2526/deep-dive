import { motion } from 'motion/react'
import { BendText } from './BendText'
import { allProjects, offers, testimonials } from '../data'
import { caseFx } from '../caseFx'

const title = (id: string) => allProjects.find((p) => p.id === id)?.title ?? id

export function Offer({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <section className="offer" id="offer">
      <div className="zone mono">192 m · Work with me</div>
      <h2 className="h2" aria-label="What I'd build for you"><span className="serif">What I’d</span> <BendText text="build for you" preset="h2" /></h2>

      <div className="offer-grid">
        {offers.map((o, i) => (
          <motion.article
            key={o.title}
            className="offer-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ delay: (i % 2) * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mono offer-n">0{i + 1}</span>
            <h3>{o.title}</h3>
            <p>{o.line}</p>
            <div className="offer-proof">
              <span className="mono">Proof</span>
              {o.proof.map((id) => (
                <button
                  key={id}
                  className="chip proof-chip"
                  data-cursor="Open"
                  onClick={(e) => {
                    caseFx.x = e.clientX || innerWidth / 2
                    caseFx.y = e.clientY || innerHeight / 2
                    caseFx.from = null
                    onOpen(id)
                  }}
                >
                  {title(id)} <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </motion.article>
        ))}
      </div>

      {testimonials.length > 0 && (
        <div className="quotes" aria-label="What people say">
          {testimonials.map((t) => (
            <motion.figure key={t.name} className="quote" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              <blockquote className="serif">“{t.quote}”</blockquote>
              <figcaption className="mono">{t.name} · {t.role}</figcaption>
            </motion.figure>
          ))}
        </div>
      )}
    </section>
  )
}
