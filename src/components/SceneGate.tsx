import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { onFrame, world } from '../world'

const Scene = lazy(() => import('./Scene'))

/** True when the browser can create a WebGL context and the visitor hasn't asked for the lite version (?lite). */
export function canRenderWebGL() {
  try {
    if (new URLSearchParams(location.search).has('lite')) return false
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Pure CSS water for devices without WebGL: same depth gradient, drifting light, no GPU shader. */
function Fallback() {
  useEffect(() => {
    const el = document.getElementById('fallback-water')
    if (!el) return
    const stops: [number, number[]][] = [[0, [204, 236, 240]], [0.14, [56, 158, 189]], [0.45, [10, 56, 102]], [0.8, [3, 13, 36]], [1, [0, 5, 15]]]
    let last = -1
    return onFrame(() => {
      const d = world.depth
      const key = d + world.night
      if (Math.abs(key - last) < 0.004) return
      last = key
      let a = stops[0], b = stops[stops.length - 1]
      for (let i = 0; i < stops.length - 1; i++) if (d >= stops[i][0] && d <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break }
      const t = (d - a[0]) / Math.max(0.0001, b[0] - a[0])
      const n = world.night * (1 - d)
      const night = [6, 18, 42]
      const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * t)).map((v, i) => Math.round(v + (night[i] - v) * n))
      el.style.setProperty('--w1', `rgb(${c})`)
      el.style.setProperty('--w2', `rgb(${c.map((v) => Math.round(v * 0.62))})`)
      el.style.setProperty('--glow', String(Math.max(0, 1 - d * 1.6)))
    })
  }, [])
  return <div id="fallback-water" className="scene-fallback" aria-hidden="true"><i /><i /><i /></div>
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err: unknown) { console.warn('3D scene failed, using the CSS fallback.', err) }
  render() { return this.state.failed ? <Fallback /> : this.props.children }
}

export function SceneGate() {
  if (!canRenderWebGL()) return <Fallback />
  return (
    <Boundary>
      <Suspense fallback={null}><Scene /></Suspense>
    </Boundary>
  )
}
