import { useEffect, useRef } from 'react'
import { onFrame } from '../world'

/**
 * Live recreation of the jaynaik.tech holographic home screen:
 * a glowing cyan wireframe torus knot, drifting particles, title and nav tiles.
 * Drawn with a tiny 3D projection on a 2D canvas, so it costs almost nothing.
 */
const TAU = Math.PI * 2
const N = 150 // samples along the knot
const M = 12 // samples around the tube

function knot(u: number, out: number[]) {
  const p = 2, q = 3
  const r = 0.62 + 0.28 * Math.cos(q * u)
  out[0] = r * Math.cos(p * u)
  out[1] = r * Math.sin(p * u)
  out[2] = 0.32 * Math.sin(q * u)
}

const grid: Float32Array = (() => {
  // precompute tube vertices (x,y,z) for N x M
  const g = new Float32Array(N * M * 3)
  const a = [0, 0, 0], b = [0, 0, 0]
  for (let i = 0; i < N; i++) {
    const u = (i / N) * TAU
    knot(u, a)
    knot(u + 0.01, b)
    const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const tl = Math.hypot(t[0], t[1], t[2])
    t[0] /= tl; t[1] /= tl; t[2] /= tl
    const up = Math.abs(t[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]
    const n1 = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]
    const l1 = Math.hypot(n1[0], n1[1], n1[2])
    n1[0] /= l1; n1[1] /= l1; n1[2] /= l1
    const n2 = [t[1] * n1[2] - t[2] * n1[1], t[2] * n1[0] - t[0] * n1[2], t[0] * n1[1] - t[1] * n1[0]]
    for (let j = 0; j < M; j++) {
      const v = (j / M) * TAU
      const R = 0.16
      const k = (i * M + j) * 3
      g[k] = a[0] + R * (Math.cos(v) * n1[0] + Math.sin(v) * n2[0])
      g[k + 1] = a[1] + R * (Math.cos(v) * n1[1] + Math.sin(v) * n2[1])
      g[k + 2] = a[2] + R * (Math.cos(v) * n1[2] + Math.sin(v) * n2[2])
    }
  }
  return g
})()

const dust = Array.from({ length: 140 }, (_, i) => ({ x: (Math.sin(i * 91.7) * 0.5 + 0.5), y: (Math.sin(i * 47.3 + 2) * 0.5 + 0.5), s: 0.5 + (i % 5) * 0.35, p: i * 0.7 }))
const tiles = [['HOME', 1], ['ABOUT', 0], ['PROJECTS', 0], ['SKILLS', 0], ['RESUME', 0], ['CONTACT', 0]] as const

export function HoloPreview() {
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = cv.current, w = wrap.current
    if (!c || !w) return
    const ctx = c.getContext('2d')!
    let W = 400, H = 260, dpr = 1
    const fit = () => {
      dpr = Math.min(devicePixelRatio || 1, 2)
      W = w.clientWidth; H = w.clientHeight
      c.width = W * dpr; c.height = H * dpr
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(w)
    const proj = new Float32Array(N * M * 3)

    const off = onFrame((t) => {
      const r = c.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight || W < 2) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#00060a'
      ctx.fillRect(0, 0, W, H)
      const u = Math.min(W, H * 1.55)

      // particles
      for (const d of dust) {
        const a = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.6 + d.p))
        ctx.fillStyle = `rgba(0,243,255,${a * 0.55})`
        ctx.fillRect(d.x * W, d.y * H, d.s, d.s)
      }

      // knot
      const ax = t * 0.5, ay = t * 0.37
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay)
      const S = u * 0.3, ox = W / 2, oy = H * 0.5
      for (let i = 0; i < N * M; i++) {
        const k = i * 3
        let x = grid[k], y = grid[k + 1], z = grid[k + 2]
        let y2 = y * cx - z * sx; let z2 = y * sx + z * cx; y = y2; z = z2
        const x2 = x * cy + z * sy; z2 = -x * sy + z * cy; x = x2; z = z2
        const f = 1 / (1 - z * 0.28)
        proj[k] = ox + x * S * f; proj[k + 1] = oy + y * S * f; proj[k + 2] = z
      }
      ctx.lineWidth = 0.7
      ctx.shadowColor = '#00f3ff'
      ctx.shadowBlur = 8
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const i2 = (i + 1) % N
          for (let j = 0; j < M; j++) {
            if (pass === 0) {
              const a = (i * M + j) * 3, b = (i2 * M + j) * 3
              ctx.moveTo(proj[a], proj[a + 1]); ctx.lineTo(proj[b], proj[b + 1])
            } else {
              const a = (i * M + j) * 3, b = (i * M + ((j + 1) % M)) * 3
              ctx.moveTo(proj[a], proj[a + 1]); ctx.lineTo(proj[b], proj[b + 1])
            }
          }
        }
        ctx.strokeStyle = pass ? 'rgba(0,243,255,.55)' : 'rgba(40,255,255,.9)'
        ctx.stroke()
      }
      ctx.shadowBlur = 0

      // title
      ctx.textAlign = 'center'
      ctx.fillStyle = '#e8ffff'
      ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 16
      ctx.font = `500 ${Math.max(12, u * 0.058)}px "Roboto Flex Variable", sans-serif`
      ctx.fillText("JAY NAIK'S PORTFOLIO", W / 2, H * 0.16)
      ctx.shadowBlur = 0

      // nav tiles
      const tw = u * 0.15, th = Math.max(16, u * 0.05), gap = u * 0.02
      ctx.font = `700 ${Math.max(7, u * 0.02)}px "JetBrains Mono Variable", monospace`
      ctx.textBaseline = 'middle'
      const rows = [tiles.slice(0, 4), tiles.slice(4)]
      rows.forEach((row, ri) => {
        const total = row.length * tw + (row.length - 1) * gap
        row.forEach(([label, on], k) => {
          const x = W / 2 - total / 2 + k * (tw + gap), y = H * 0.8 + ri * (th + gap * 0.8)
          ctx.fillStyle = on ? 'rgba(0,243,255,.18)' : 'rgba(0,0,0,.5)'
          ctx.strokeStyle = on ? '#00f3ff' : 'rgba(255,255,255,.28)'
          ctx.lineWidth = 1
          ctx.fillRect(x, y, tw, th); ctx.strokeRect(x + 0.5, y + 0.5, tw, th)
          ctx.fillStyle = on ? '#00f3ff' : '#e5f4f6'
          ctx.fillText(label, x + tw / 2, y + th / 2 + 0.5)
        })
      })
      ctx.textBaseline = 'alphabetic'
    })
    return () => { off(); ro.disconnect() }
  }, [])

  return (
    <div className="holo" ref={wrap} aria-label="Holographic portfolio preview">
      <canvas ref={cv} role="img" aria-label="A rotating cyan wireframe torus knot above Jay Naik's portfolio navigation" />
    </div>
  )
}
