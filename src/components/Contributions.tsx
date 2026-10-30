import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { BendText } from './BendText'
import snapshot from '../data/contributions.json'
import { profile } from '../data'
import { onFrame, ripple, world } from '../world'
import { sound } from '../audio'
import { quality } from '../quality'

interface Day { date: string; count: number; level: number }
interface Range { total: number; days: Day[] }
const ranges = snapshot.ranges as Record<string, Range>
const tabKeys = (r: Record<string, Range>) => ['last', ...Object.keys(r).filter((k) => k !== 'last' && r[k].total > 0).sort().reverse()]

/** Turns the public contributions API (every year, daily) into the same shape as the bundled snapshot. */
function fromApi(j: { contributions?: Day[] }): Record<string, Range> | null {
  if (!j.contributions?.length) return null
  // the API lists the rest of the current year too; never show future days
  const limit = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
  const days = j.contributions.filter((d) => d.date <= limit).map((d) => ({ date: d.date, count: d.count, level: d.level })).sort((a, b) => (a.date < b.date ? -1 : 1))
  if (!days.length) return null
  const out: Record<string, Range> = {}
  for (const d of days) {
    const y = d.date.slice(0, 4)
    ;(out[y] ??= { total: 0, days: [] }).days.push(d)
    out[y].total += d.count
  }
  const start = new Date(days[days.length - 1].date + 'T00:00:00Z')
  start.setUTCDate(start.getUTCDate() - 364)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()) // GitHub's grid begins on the Sunday of that week
  const startISO = start.toISOString().slice(0, 10)
  const last = days.filter((d) => d.date >= startISO)
  out.last = { total: last.reduce((a, d) => a + d.count, 0), days: last }
  return out
}

/** One count per day: the higher of the two sources. The public API can't see private-repo activity that the snapshot
 *  (pulled with the owner's login) includes, while the live feed knows about days newer than the snapshot. */
function mergeDays(a: Day[], b: Day[]): Day[] {
  const m = new Map<string, Day>()
  for (const d of [...a, ...b]) { const e = m.get(d.date); if (!e || d.count > e.count) m.set(d.date, d) }
  return [...m.values()]
}
const snapshotDays: Day[] = Object.entries(ranges).filter(([k]) => k !== 'last').flatMap(([, r]) => r.days)
const baseRanges = fromApi({ contributions: snapshotDays }) ?? ranges

const CONTRIB_KEY = 'contrib-live-v3'
const CONTRIB_TTL = 10 * 60 * 1000
const label = (k: string) => (k === 'last' ? 'Last 12 months' : k)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

function stats(days: Day[]) {
  let total = 0, active = 0, best = 0, bestDay: Day | null = null, streak = 0, longest = 0
  days.forEach((d) => {
    total += d.count
    if (d.count > 0) { active++; streak++; longest = Math.max(longest, streak) } else streak = 0
    if (d.count > best) { best = d.count; bestDay = d }
  })
  let cur = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) cur++
    else if (i === days.length - 1) continue
    else break
  }
  return { total, active, longest, best, bestDay: bestDay as Day | null, cur }
}

function Count({ n }: { n: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-5% 0px' })
  // written straight into the element so the count-up never re-renders React
  useEffect(() => {
    if (!inView) return
    let raf = 0
    const s = performance.now()
    const f = (now: number) => {
      const p = Math.min(1, (now - s) / 1100)
      if (ref.current) ref.current.textContent = Math.round(n * (1 - Math.pow(1 - p, 4))).toLocaleString()
      if (p < 1) raf = requestAnimationFrame(f)
    }
    raf = requestAnimationFrame(f)
    return () => cancelAnimationFrame(raf)
  }, [inView, n])
  return <span ref={ref}>0</span>
}

/** Newest public activity from the GitHub events API: a push, a pull request or a new repo. Refreshes itself every 5 minutes. */
interface Latest { kind: string; repo: string; msg: string; when: string }
const LATEST_KEY = 'latest-activity-v2'
const LATEST_TTL = 5 * 60 * 1000

async function fetchLatest(signal: AbortSignal): Promise<Latest | null> {
  type Ev = { type: string; created_at: string; repo: { name: string }; payload?: { head?: string; ref_type?: string; action?: string; commits?: { message: string }[]; pull_request?: { title?: string; merged?: boolean } } }
  const res = await fetch(`https://api.github.com/users/${snapshot.login}/events/public?per_page=30`, { signal })
  if (!res.ok) throw new Error(String(res.status))
  const ev = (await res.json()) as Ev[]
  const short = (n: string) => n.split('/')[1] ?? n
  const e = ev.find((x) => x.type === 'PushEvent') ?? ev.find((x) => x.type === 'PullRequestEvent') ?? ev.find((x) => x.type === 'CreateEvent' && x.payload?.ref_type === 'repository')
  if (!e) return null
  if (e.type === 'PullRequestEvent') {
    const pr = e.payload?.pull_request
    return { kind: pr?.merged ? 'Merged PR' : 'Pull request', repo: short(e.repo.name), msg: (pr?.title ?? '').slice(0, 72), when: e.created_at }
  }
  if (e.type === 'CreateEvent') return { kind: 'New repo', repo: short(e.repo.name), msg: '', when: e.created_at }
  // the events feed no longer carries commit messages, so ask for the head commit directly
  let msg = e.payload?.commits?.at(-1)?.message ?? ''
  if (!msg && e.payload?.head) {
    try {
      const c = await fetch(`https://api.github.com/repos/${e.repo.name}/commits/${e.payload.head}`, { signal })
      if (c.ok) msg = ((await c.json()) as { commit: { message: string } }).commit.message
    } catch { /* the message is optional */ }
  }
  return { kind: 'Latest push', repo: short(e.repo.name), msg: msg.split('\n')[0].slice(0, 72), when: e.created_at }
}

function LatestPush() {
  const [item, setItem] = useState<Latest | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    let alive = true
    let ctl: AbortController | null = null
    const load = async (force = false) => {
      try {
        const c = JSON.parse(sessionStorage.getItem(LATEST_KEY) ?? 'null')
        if (c && (!force || Date.now() - c.at < 60000)) { if (alive) setItem(c.v); if (Date.now() - c.at < LATEST_TTL && !force) return }
      } catch { /* ignore */ }
      ctl?.abort()
      ctl = new AbortController()
      try {
        const v = await fetchLatest(ctl.signal)
        if (!v || !alive) return
        setItem(v)
        try { sessionStorage.setItem(LATEST_KEY, JSON.stringify({ at: Date.now(), v })) } catch { /* ignore */ }
      } catch { /* rate-limited or offline: keep showing the last known activity */ }
    }
    void load()
    const poll = setInterval(() => void load(true), LATEST_TTL)
    const tick = setInterval(() => setNow(Date.now()), 60000) // keeps "5 min ago" honest while the page is open
    return () => { alive = false; ctl?.abort(); clearInterval(poll); clearInterval(tick) }
  }, [])
  if (!item) return null
  const mins = Math.max(1, Math.round((now - new Date(item.when).getTime()) / 60000))
  const ago = mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} d ago`
  return (
    <a className="sig-push mono" href={`${profile.github}/${item.repo}`} target="_blank" rel="noopener" data-cursor="Open">
      <i className="live-dot" aria-hidden="true" />
      <span>{item.kind}</span>
      <b>{item.repo}</b>
      <em>{item.msg ? `“${item.msg}”` : ''}</em>
      <span className="ago">{ago}</span>
    </a>
  )
}

/* ---------- the plankton grid: one canvas instead of ~370 animated DOM nodes ---------- */
const COLORS = ['rgba(255,255,255,.075)', '#0d5a63', '#13a6b3', '#4fe0e6', '#c9fffb']
const GAP = 3, LEFT = 34, TOP = 22

function makeGlow(rgb: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, `rgba(${rgb},.85)`)
  gr.addColorStop(0.4, `rgba(${rgb},.25)`)
  gr.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = gr
  g.fillRect(0, 0, 64, 64)
  return c
}

const Grid = memo(function Grid({ cells, weeks, months, active, rangeKey, onTip }: {
  cells: (Day | null)[]; weeks: number; months: { label: string; col: number }[]; active: boolean; rangeKey: string
  onTip: (d: Day | null, x: number, y: number) => void
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const st = useRef({ cell: 14, w: 0, h: 0, dpr: 1, start: -1, hover: -1, dirty: true })
  const glows = useMemo(() => ({ 3: makeGlow('79,224,230'), 4: makeGlow('201,255,251') }), [])

  useEffect(() => {
    const c = cv.current, w = wrap.current
    if (!c || !w) return
    const s = st.current
    const fit = () => {
      s.dpr = Math.min(devicePixelRatio || 1, 2)
      s.cell = Math.max(11, Math.min(19, Math.floor((w.clientWidth - LEFT) / weeks - GAP)))
      s.w = LEFT + weeks * (s.cell + GAP)
      s.h = TOP + 7 * (s.cell + GAP)
      c.width = s.w * s.dpr; c.height = s.h * s.dpr
      c.style.width = s.w + 'px'; c.style.height = s.h + 'px'
      s.dirty = true
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(w)

    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      const x = e.clientX - r.left - LEFT, y = e.clientY - r.top - TOP
      const col = Math.floor(x / (s.cell + GAP)), row = Math.floor(y / (s.cell + GAP))
      if (x < 0 || y < 0 || col >= weeks || row > 6) return -1
      return col * 7 + row
    }
    const move = (e: PointerEvent) => {
      const i = pos(e)
      if (i === s.hover) return
      s.hover = i
      s.dirty = true
      const d = i >= 0 ? cells[i] : null
      if (d) {
        const col = Math.floor(i / 7), row = i % 7
        const r = c.getBoundingClientRect()
        const cx = r.left + LEFT + col * (s.cell + GAP) + s.cell / 2, cy = r.top + TOP + row * (s.cell + GAP)
        onTip(d, cx, cy)
        if (d.count > 0) { ripple(cx / innerWidth, (cy + s.cell / 2) / innerHeight, 0.3 + d.level * 0.1); sound.tick(700 + d.level * 220) }
      } else onTip(null, 0, 0)
    }
    const leave = () => { s.hover = -1; s.dirty = true; onTip(null, 0, 0) }
    c.addEventListener('pointermove', move)
    c.addEventListener('pointerdown', move) // a tap shows the day on touch screens
    c.addEventListener('pointerleave', leave)

    const draw = (now: number) => {
      const ctx = c.getContext('2d')!
      const k = s.dpr
      ctx.setTransform(k, 0, 0, k, 0, 0)
      ctx.clearRect(0, 0, s.w, s.h)
      const t = s.start < 0 ? 0 : now - s.start
      ctx.font = '500 10px "JetBrains Mono Variable", monospace'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(226,248,252,.62)'
      months.forEach((m) => ctx.fillText(m.label.toUpperCase(), LEFT + m.col * (s.cell + GAP), 8))
      ;['MON', 'WED', 'FRI'].forEach((d, i) => ctx.fillText(d, 0, TOP + (1 + i * 2) * (s.cell + GAP) + s.cell / 2))
      let animating = false
      for (let i = 0; i < cells.length; i++) {
        const d = cells[i]
        if (!d) continue
        const col = (i / 7) | 0, row = i % 7
        let p = world.reduced ? 1 : Math.min(1, Math.max(0, (t - col * 12) / 520))
        if (p < 1) animating = true
        if (p <= 0) continue
        p = 1 - Math.pow(1 - p, 3)
        const hov = i === s.hover
        const sc = (0.3 + 0.7 * p) * (hov ? 1.45 : 1)
        const sz = s.cell * sc
        const x = LEFT + col * (s.cell + GAP) + (s.cell - sz) / 2
        const y = TOP + row * (s.cell + GAP) + (s.cell - sz) / 2
        if (d.level >= 3) {
          const g = glows[d.level as 3 | 4]
          ctx.globalAlpha = p * (d.level === 4 ? 0.9 : 0.55)
          const gs = s.cell * 3.1
          ctx.drawImage(g, x + sz / 2 - gs / 2, y + sz / 2 - gs / 2, gs, gs)
        }
        ctx.globalAlpha = p
        ctx.fillStyle = COLORS[d.level] ?? COLORS[0]
        ctx.beginPath()
        ctx.roundRect(x, y, sz, sz, Math.max(2, sz * 0.24))
        ctx.fill()
      }
      ctx.globalAlpha = 1
      s.dirty = animating
    }

    const off = onFrame((_t, _dt) => {
      if (!s.dirty) return
      const r = c.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight) return
      draw(performance.now())
    })
    s.dirty = true
    return () => { off(); ro.disconnect(); c.removeEventListener('pointermove', move); c.removeEventListener('pointerdown', move); c.removeEventListener('pointerleave', leave) }
  }, [cells, weeks, months, glows, onTip])

  // restart the wave whenever the grid scrolls into view or the range changes
  useEffect(() => {
    if (!active) return
    st.current.start = performance.now()
    st.current.dirty = true
  }, [active, rangeKey])

  return (
    <div className="sig-scroll" ref={wrap} data-lenis-prevent>
      <canvas ref={cv} className="sig-canvas" role="img" aria-label={`Contribution calendar, ${rangeKey === 'last' ? 'last 12 months' : rangeKey}`} />
    </div>
  )
})

export function Contributions() {
  const [range, setRange] = useState('last')
  const [live, setLive] = useState(false)
  const [data, setData] = useState<Record<string, Range>>(baseRanges)
  const card = useRef<HTMLDivElement>(null)
  const tipEl = useRef<HTMLDivElement>(null)
  const tipB = useRef<HTMLElement>(null)
  const tipS = useRef<HTMLSpanElement>(null)
  const inView = useInView(card, { once: true, margin: '-12% 0px' })

  // Fully automatic: pull every year from the public API on load, then again every 10 minutes and whenever the
  // tab becomes visible after a while. New years appear as tabs by themselves. The bundled snapshot is the fallback.
  useEffect(() => {
    let alive = true
    let ctl: AbortController | null = null
    const apply = (r: Record<string, Range>) => { if (alive) { setData(r); setLive(true) } }
    const load = async (force = false) => {
      try {
        const c = JSON.parse(sessionStorage.getItem(CONTRIB_KEY) ?? 'null')
        if (c && !force && Date.now() - c.at < CONTRIB_TTL) { apply(c.ranges); return }
      } catch { /* storage can be blocked */ }
      ctl?.abort()
      ctl = new AbortController()
      try {
        const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${snapshot.login}?y=all`, { signal: ctl.signal })
        if (!res.ok) throw new Error(String(res.status))
        const live = (await res.json()) as { contributions?: Day[] }
        const r = fromApi({ contributions: mergeDays(snapshotDays, live.contributions ?? []) })
        if (!r) return
        apply(r)
        try { sessionStorage.setItem(CONTRIB_KEY, JSON.stringify({ at: Date.now(), ranges: r })) } catch { /* ignore */ }
      } catch { /* offline or rate-limited: keep whatever we are already showing */ }
    }
    void load()
    const timer = setInterval(() => void load(true), CONTRIB_TTL)
    const vis = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', vis)
    return () => { alive = false; ctl?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', vis) }
  }, [])
  const keys = useMemo(() => tabKeys(data), [data])

  const cur = data[range] ?? data.last
  const st = useMemo(() => stats(cur.days), [cur])

  const { cells, months, weeks } = useMemo(() => {
    const first = new Date(cur.days[0].date + 'T00:00:00').getDay()
    const all: (Day | null)[] = [...Array.from({ length: first }, () => null), ...cur.days]
    const w = Math.ceil(all.length / 7)
    const ms: { label: string; col: number }[] = []
    let lastM = -1
    for (let c = 0; c < w; c++) {
      const d = all.slice(c * 7, c * 7 + 7).find(Boolean)
      if (!d) continue
      const m = new Date(d.date + 'T00:00:00').getMonth()
      if (m !== lastM && (c > 0 || ms.length === 0)) {
        if (ms.length && c - ms[ms.length - 1].col < 3) ms.pop()
        ms.push({ label: MONTHS[m], col: c })
        lastM = m
      }
    }
    return { cells: all, months: ms, weeks: w }
  }, [cur])

  // tooltip is moved imperatively so hovering never re-renders React
  const onTip = useRef((d: Day | null, x: number, y: number) => {
    const el = tipEl.current
    if (!el) return
    if (!d) { el.style.opacity = '0'; return }
    if (tipB.current) tipB.current.textContent = `${d.count === 0 ? 'No' : d.count} contribution${d.count === 1 ? '' : 's'}`
    if (tipS.current) tipS.current.textContent = fmt(d.date)
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    el.style.opacity = '1'
  }).current

  const total = range === 'last' ? st.total : cur.total

  return (
    <section className="signal" id="signal">
      <div className="zone mono">190 m · Open signal</div>
      <h2 className="h2" aria-label="Plankton count"><span className="serif">Plankton</span> <BendText text="count" preset="h2" /></h2>
      <p className="mono hint">Every glowing cell is a day I shipped something · {quality.touch ? 'tap' : 'hover'} to read it</p>

      <motion.div ref={card} className="sig-card" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-8%' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
        <div className="sig-head">
          <a className="sig-who" href={profile.github} target="_blank" rel="noopener" data-cursor="Open">
            <span className="sig-ava" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="26" height="26" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
            </span>
            <span>
              <strong>@{snapshot.login}{live && <i className="live-tag mono">Live</i>}</strong>
              <small className="mono">github.com/{snapshot.login}</small>
            </span>
          </a>
          <div className="sig-tabs" role="tablist" aria-label="Contribution range">
            {keys.map((k) => (
              <button key={k} role="tab" aria-selected={range === k} data-on={range === k} onClick={() => { setRange(k); ripple(0.5, 0.5, 0.9); sound.tick(900) }} data-cursor="Switch">
                {range === k && <motion.i layoutId="sig-pill" className="sig-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span>{label(k)}</span>
              </button>
            ))}
          </div>
        </div>

        <LatestPush />

        <div className="sig-stats">
          <div><span className="mono">Contributions</span><b><Count n={total} /></b><small>{range === 'last' ? 'in the last year' : `in ${range}`}</small></div>
          <div><span className="mono">Active days</span><b><Count n={st.active} /></b><small>days with commits</small></div>
          <div><span className="mono">Longest streak</span><b><Count n={st.longest} /><em> days</em></b><small>{st.cur > 0 ? `${st.cur} running now` : 'consecutive activity'}</small></div>
          <div><span className="mono">Best day</span><b><Count n={st.best} /></b><small>{st.bestDay ? fmt(st.bestDay.date) : '—'}</small></div>
        </div>

        <Grid cells={cells} weeks={weeks} months={months} active={inView} rangeKey={range} onTip={onTip} />

        <div className="sig-foot mono">
          <span>{total.toLocaleString()} contributions · {range === 'last' ? 'last 12 months' : range}</span>
          <span className="sig-legend">Less {[0, 1, 2, 3, 4].map((l) => <i key={l} className="cell" data-l={l} />)} More</span>
        </div>
      </motion.div>

      <div className="sig-tip mono" ref={tipEl} style={{ opacity: 0 }} role="status">
        <b ref={tipB} /><span ref={tipS} />
      </div>
    </section>
  )
}
