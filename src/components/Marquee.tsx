import { useEffect, useRef } from 'react'
import { onFrame, world } from '../world'

/** Infinite type strip. Scroll velocity speeds it up and skews it. */
export function Marquee({ words, reverse = false }: { words: string[]; reverse?: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const x = useRef(0)
  const skew = useRef(0)
  const vis = useRef(false)
  const half = useRef(1)

  useEffect(() => {
    const w = wrap.current, el = track.current
    if (!w || !el) return
    const io = new IntersectionObserver(([e]) => (vis.current = e.isIntersecting), { rootMargin: '60px' })
    io.observe(w)
    const m = () => (half.current = el.scrollWidth / 2)
    m()
    const ro = new ResizeObserver(m)
    ro.observe(el)
    document.fonts.ready.then(m)
    return () => { io.disconnect(); ro.disconnect() }
  }, [])

  useEffect(
    () =>
      onFrame((_t, dt) => {
        const el = track.current
        const w = wrap.current
        if (!el || !w) return
        if (!vis.current) return
        const dir = reverse ? 1 : -1
        const base = world.reduced ? 0 : 60
        x.current += dir * (base + Math.abs(world.vel) * 0.35) * dt
        const hf = half.current
        if (x.current <= -hf) x.current += hf
        if (x.current >= 0) x.current -= hf
        skew.current += (Math.max(-12, Math.min(12, -world.vel * 0.006)) - skew.current) * 0.12
        el.style.transform = `translate3d(${x.current}px,0,0) skewX(${skew.current}deg)`
      }),
    [reverse],
  )

  const row = words.map((w, i) => (
    <span key={i} className="mq-item">
      {w}
      <i aria-hidden="true">✦</i>
    </span>
  ))
  return (
    <div className="marquee" ref={wrap} aria-hidden="true">
      <div className="mq-track" ref={track}>
        {row}
        {row}
      </div>
    </div>
  )
}
