import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { allProjects, nowItems, nowUpdated, profile } from '../data'
import { ago, fetchRecentRepos, type RecentRepo } from '../github'
import { caseFx } from '../caseFx'

const login = profile.github.split('/').pop() ?? 'Jay-Naik2526'
const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

/** "Right now": a short hand-edited focus list, plus a live list of what was pushed most recently. */
export function Now({ onOpen }: { onOpen: (id: string) => void }) {
  const [recent, setRecent] = useState<RecentRepo[] | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const ctl = new AbortController()
    const load = () => fetchRecentRepos(login, ctl.signal).then(setRecent).catch(() => {})
    void load()
    const poll = setInterval(load, 5 * 60 * 1000)
    const tick = setInterval(() => setNow(Date.now()), 60000)
    return () => { ctl.abort(); clearInterval(poll); clearInterval(tick) }
  }, [])

  return (
    <div className="now" id="now">
      <div className="now-head">
        <h3 className="serif">Right <span style={{ fontFamily: 'var(--sans)', fontStyle: 'normal', fontWeight: 200 }}>now</span></h3>
        <span className="mono">Updated {monthLabel(nowUpdated)}</span>
      </div>

      <div className="now-grid">
        <ul className="now-list">
          {nowItems.map((n, i) => (
            <motion.li key={n.title} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-6%' }} transition={{ delay: i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <h4>{n.title}</h4>
              <p>{n.line}</p>
              {n.proof && (
                <div className="now-proof">
                  {n.proof.map((id) => (
                    <button
                      key={id}
                      className="chip proof-chip"
                      data-cursor="Open"
                      onClick={(e) => { caseFx.x = e.clientX || innerWidth / 2; caseFx.y = e.clientY || innerHeight / 2; caseFx.from = null; onOpen(id) }}
                    >
                      {allProjects.find((p) => p.id === id)?.title ?? id} <span aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.li>
          ))}
        </ul>

        <aside className="now-live" aria-label="Recently shipped">
          <span className="mono"><i className="live-dot" aria-hidden="true" /> Recently shipped · live from GitHub</span>
          {recent ? (
            <ul>
              {recent.map((r) => (
                <li key={r.repo}>
                  <a href={`${profile.github}/${r.repo}`} target="_blank" rel="noopener" data-cursor="Open">
                    <b>{r.repo}</b>
                    <em className="mono">{r.pushes} push{r.pushes === 1 ? '' : 'es'} · {ago(r.when, now)}</em>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mono now-wait">Reading the latest pushes…</p>
          )}
        </aside>
      </div>
    </div>
  )
}
