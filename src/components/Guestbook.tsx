import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { FEED_URL, SIGN_URL, toEntries, type Entry } from '../guestbook.ts'
import { ago } from '../github'

const KEY = 'guestbook-v1'
const TTL = 10 * 60 * 1000

/** Approved guestbook entries, read from GitHub (public, cached). Signing happens on GitHub itself. */
export function Guestbook() {
  const [entries, setEntries] = useState<Entry[] | null>(null)

  useEffect(() => {
    let alive = true
    try {
      const c = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
      if (c && Date.now() - c.at < TTL) { setEntries(c.v); return }
    } catch { /* storage can be blocked */ }
    const ctl = new AbortController()
    fetch(FEED_URL, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        const v = toEntries(j).slice(0, 6)
        if (!alive) return
        setEntries(v)
        try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), v })) } catch { /* ignore */ }
      })
      .catch(() => { if (alive) setEntries([]) })
    return () => { alive = false; ctl.abort() }
  }, [])

  return (
    <div className="guest" id="guestbook">
      <div className="guest-head">
        <h3 className="serif">The guestbook</h3>
        <a className="btn" href={SIGN_URL} target="_blank" rel="noopener" data-cursor="Sign">Sign it on GitHub ↗</a>
      </div>
      <p className="mono guest-note">Sign in with GitHub, leave a line. It appears here once I approve it.</p>

      {entries && entries.length > 0 ? (
        <ul className="guest-grid">
          {entries.map((e, i) => (
            <motion.li key={e.id} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <p className="serif">“{e.text}”</p>
              <div className="guest-who">
                {e.avatar && <img src={e.avatar} alt="" width="26" height="26" loading="lazy" decoding="async" referrerPolicy="no-referrer" />}
                <a href={`https://github.com/${e.login}`} target="_blank" rel="noopener" className="mono">{e.who}</a>
                <span className="mono">{ago(e.when)}</span>
              </div>
            </motion.li>
          ))}
        </ul>
      ) : entries ? (
        <p className="guest-empty">No lines yet. Be the first to leave one.</p>
      ) : null}
    </div>
  )
}
