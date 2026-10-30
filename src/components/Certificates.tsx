import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BendText } from './BendText'
import { certGroups, certificates, type Certificate } from '../data'
import { lockScroll } from '../world'
import { sound } from '../audio'

function Viewer({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  useEffect(() => {
    lockScroll(true)
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', key)
    return () => { removeEventListener('keydown', key); lockScroll(false) }
  }, [onClose])

  return createPortal(
    <motion.div className="cert-view" role="dialog" aria-label={`${cert.title} certificate`} data-lenis-prevent initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose}>
      <motion.figure initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} onClick={(e) => e.stopPropagation()}>
        <img src={cert.image} alt={`${cert.title}, ${cert.issuer}${cert.date ? `, ${cert.date}` : ''}`} decoding="async" />
        <figcaption>
          <span><b>{cert.title}</b><span className="mono">{cert.issuer}{cert.date && ` · ${cert.date}`}</span></span>
          <span className="cert-actions">
            {cert.verify && <a className="chip proof-chip" href={cert.verify} target="_blank" rel="noopener noreferrer" data-cursor="Open">Verify ↗</a>}
            <button className="chip proof-chip" onClick={onClose} data-cursor="Close">Close ✕</button>
          </span>
        </figcaption>
      </motion.figure>
    </motion.div>,
    document.body,
  )
}

/** Where each certificate's X sits on the chart, in the chart's 800 x 560 units. */
const SPOT: Record<string, [number, number]> = {
  'google-ai-essentials': [610, 150],
  'python-for-everybody': [150, 318],
  'ibm-data-science': [275, 305],
  'google-python': [135, 432],
  'learnbay-data-science': [262, 430],
  'google-cloud-identity': [440, 440],
  'microsoft-learn-git': [560, 485],
  'linkedin-programming': [685, 425],
}
const REGION: Record<Certificate['group'], { name: string; at: [number, number]; r: [number, number]; label: [number, number] }> = {
  AI: { name: 'AI Island', at: [610, 150], r: [120, 82], label: [610, 62] },
  'Python and data': { name: 'Python Reef', at: [205, 372], r: [170, 112], label: [205, 520] },
  'Cloud and tools': { name: 'Cloud Cove', at: [562, 455], r: [190, 92], label: [562, 540] },
}

/** A closed, smooth coastline around a centre, wobbled by fixed offsets so it looks drawn rather than computed. */
function coast(cx: number, cy: number, rx: number, ry: number, seed: number[]) {
  const pts = seed.map((w, i) => {
    const a = (i / seed.length) * Math.PI * 2
    return [cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]
  })
  const n = pts.length
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}
const SEEDS: Record<Certificate['group'], number[]> = {
  AI: [1, 0.82, 0.96, 0.78, 1.04, 0.86, 0.94, 0.8],
  'Python and data': [0.95, 1.05, 0.8, 0.98, 0.86, 1.04, 0.9, 0.82, 1, 0.88],
  'Cloud and tools': [1, 0.84, 1.02, 0.9, 0.8, 0.98, 1.04, 0.86],
}

function Chart() {
  return (
    <svg viewBox="0 0 800 560" aria-hidden="true" className="chart-svg">
      <defs>
        <pattern id="chart-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".12" /></pattern>
      </defs>
      <rect width="800" height="560" fill="url(#chart-grid)" />
      {(Object.keys(REGION) as Certificate['group'][]).map((g) => {
        const r = REGION[g]
        const d = coast(r.at[0], r.at[1], r.r[0], r.r[1], SEEDS[g])
        return (
          <g key={g}>
            {[1.5, 1.28, 1.12].map((k, i) => (
              <path key={k} d={d} className="chart-contour" style={{ transformOrigin: `${r.at[0]}px ${r.at[1]}px`, transform: `scale(${k})`, opacity: 0.16 + i * 0.1 }} />
            ))}
            <path d={d} className="chart-land" />
            <text x={r.label[0]} y={r.label[1]} textAnchor="middle" className="chart-name">{r.name}</text>
          </g>
        )
      })}
      <path className="chart-route" d="M40 534 C 100 480, 120 420, 205 392 S 330 470, 440 480 S 580 440 600 330 S 650 235 612 170" fill="none" />
      <g className="chart-compass" transform="translate(722 72)">
        <circle r="30" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".5" />
        <path d="M0 -38 L7 0 L0 38 L-7 0Z M-38 0 L0 -7 L38 0 L0 7Z" fill="currentColor" opacity=".35" />
        <text y="-44" textAnchor="middle" className="chart-n">N</text>
      </g>
      <g className="chart-start" transform="translate(40 534)">
        <circle r="6" fill="currentColor" />
        <text x="12" y="4" className="chart-n">START</text>
      </g>
    </svg>
  )
}

export function Certificates() {
  const [open, setOpen] = useState<Certificate | null>(null)
  // the key runs group by group, so the numbers on the chart and in the key agree
  const ordered = useMemo(() => certGroups.flatMap((g) => certificates.filter((c) => c.group === g.name)), [])
  const [sel, setSel] = useState(ordered[0].id)
  const cur = ordered.find((c) => c.id === sel) ?? ordered[0]
  const num = (c: Certificate) => ordered.indexOf(c) + 1
  const pick = (c: Certificate) => { if (c.id !== sel) sound.tick(620 + num(c) * 30); setSel(c.id) }

  return (
    <section className="certs" id="certificates">
      <div className="zone mono">185 m · Credentials</div>
      <h2 className="h2" aria-label="Things I've completed"><span className="serif">Things I’ve</span> <BendText text="completed" preset="h2" /></h2>
      <p className="mono hint">{certificates.length} certificates, charted · tap an X to bring it to the case</p>

      <div className="chart-wrap">
        <div className="chart" role="group" aria-label="Sea chart of my certificates">
          <Chart />
          {ordered.map((c) => (
            <button
              key={c.id}
              className="x-mark"
              data-on={c.id === sel}
              style={{ left: `${(SPOT[c.id][0] / 800) * 100}%`, top: `${(SPOT[c.id][1] / 560) * 100}%` }}
              aria-pressed={c.id === sel}
              aria-label={`${num(c)}. ${c.title}, ${c.issuer}`}
              onClick={() => pick(c)}
              data-cursor="Open"
            >
              <span aria-hidden="true">✕</span>
              <i className="mono" aria-hidden="true">{num(c)}</i>
            </button>
          ))}
        </div>

        <aside className="vault" aria-live="polite" aria-label="Selected certificate">
          <AnimatePresence mode="wait">
            <motion.figure
              key={cur.id}
              className="vitrine"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="vitrine-glass">
                <span className="mono vitrine-n">{String(num(cur)).padStart(2, '0')}</span>
                <button className="vitrine-print" onClick={() => { sound.tick(760); setOpen(cur) }} aria-label={`View the ${cur.title} certificate full size`} data-cursor="View">
                  <img src={cur.image} alt={`${cur.title}, ${cur.issuer}${cur.date ? `, ${cur.date}` : ''}`} decoding="async" />
                </button>
                <i className="vitrine-glare" aria-hidden="true" />
              </div>
              <figcaption className="plate">
                <div className="plate-top"><span>{cur.kind}</span>{cur.date && <span className="mono">{cur.date}</span>}</div>
                <h4>{cur.title}</h4>
                <span className="mono plate-issuer">{cur.issuer}</span>
                {cur.courses && (
                  <ul className="print-courses">
                    {cur.courses.map((k) => (
                      <li key={k.title}>{k.verify ? <a href={k.verify} target="_blank" rel="noopener noreferrer" data-cursor="Open">{k.title} <span aria-hidden="true">↗</span></a> : k.title}</li>
                    ))}
                  </ul>
                )}
                <div className="plate-actions">
                  <button className="plate-btn" onClick={() => { sound.tick(760); setOpen(cur) }} data-cursor="View">View full size</button>
                  {cur.verify && <a className="plate-btn" href={cur.verify} target="_blank" rel="noopener noreferrer" data-cursor="Open">Verify ↗</a>}
                </div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </aside>
      </div>

      <div className="chart-key">
        {certGroups.map((g) => (
          <div key={g.name}>
            <h3><span className="serif">{REGION[g.name].name}</span></h3>
            <p>{g.line}</p>
            <ol>
              {ordered.filter((c) => c.group === g.name).map((c) => (
                <li key={c.id}>
                  <button data-on={c.id === sel} onClick={() => pick(c)} data-cursor="Open">
                    <span className="mono">{String(num(c)).padStart(2, '0')}</span>
                    <b>{c.title}</b>
                    <span className="mono">{c.date.replace(/^.*, /, '') || c.kind}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <AnimatePresence>{open && <Viewer key={open.id} cert={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  )
}
