import { useEffect } from 'react'

/** Shown for any path other than the root: the site is a single page, so a different path is a wrong turn. */
export function NotFound() {
  useEffect(() => { document.title = 'Lost at sea · Jay Naik' }, [])
  return (
    <main className="lost">
      <i className="lost-b" style={{ left: '12%', animationDelay: '0s' }} />
      <i className="lost-b" style={{ left: '34%', animationDelay: '1.8s' }} />
      <i className="lost-b" style={{ left: '61%', animationDelay: '0.9s' }} />
      <i className="lost-b" style={{ left: '83%', animationDelay: '2.6s' }} />
      <p className="mono">404 · 200 m · nothing down here</p>
      <h1><span className="serif">Lost</span> at sea</h1>
      <p className="lost-line">That path doesn’t lead anywhere. The way back is straight up.</p>
      <a className="btn primary" href="/">Back to the surface ↑</a>
    </main>
  )
}
