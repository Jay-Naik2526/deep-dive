/**
 * Privacy-friendly analytics. Cookie-free, no personal data, no banner needed, and OFF by default.
 *
 *  - Nothing loads and nothing is sent until you set an ID (see .env.example): VITE_GOATCOUNTER=yourcode (free) or VITE_PLAUSIBLE_DOMAIN=yourdomain.
 *  - Do Not Track is honoured, and a visitor can opt out for good with ?notrack (remembered in this browser).
 *  - Only counts are recorded: page views and a few named events. What anyone types into the chat is never sent.
 */
export type Provider = 'goatcounter' | 'plausible' | null

interface Config { goatcounter?: string; plausible?: string }

export function providerFrom(c: Config): Provider {
  if (c.goatcounter?.trim()) return 'goatcounter'
  if (c.plausible?.trim()) return 'plausible'
  return null
}

export function allowed(o: { dnt?: string | null; optOut?: boolean; provider: Provider }): boolean {
  if (!o.provider) return false
  if (o.optOut) return false
  if (o.dnt === '1' || o.dnt === 'yes') return false
  return true
}

/** Turns a clicked link into a named event. Names are fixed and contain no URLs or personal data. */
export function eventForLink(href: string): string | null {
  if (!href) return null
  if (href.startsWith('mailto:')) return 'email-click'
  try {
    const u = new URL(href, 'https://example.invalid')
    const h = u.hostname
    if (h === 'drive.google.com') return 'resume-open'
    if (h === 'github.com' && u.pathname.includes('/issues/new')) return 'guestbook-sign'
    if (h === 'github.com') return 'link-github'
    if (h.endsWith('linkedin.com')) return 'link-linkedin'
  } catch { /* not a url */ }
  return null
}

interface Win { goatcounter?: { count: (o: Record<string, unknown>) => void }; plausible?: (n: string, o?: Record<string, unknown>) => void; doNotTrack?: string }

let active: Provider = null

export function track(name: string) {
  if (!active || typeof window === 'undefined') return
  const w = window as unknown as Win
  try {
    if (active === 'goatcounter') w.goatcounter?.count({ path: `event/${name}`, title: name, event: true })
    else w.plausible?.(name)
  } catch { /* analytics must never break the page */ }
}

export function initAnalytics() {
  if (typeof window === 'undefined') return
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  const provider = providerFrom({ goatcounter: env?.VITE_GOATCOUNTER, plausible: env?.VITE_PLAUSIBLE_DOMAIN })

  let optOut = false
  try {
    if (new URLSearchParams(location.search).has('notrack')) localStorage.setItem('notrack', '1')
    optOut = localStorage.getItem('notrack') === '1'
  } catch { /* storage can be blocked */ }

  const w = window as unknown as Win
  if (!allowed({ dnt: navigator.doNotTrack ?? w.doNotTrack ?? null, optOut, provider })) return
  active = provider

  const s = document.createElement('script')
  s.async = true
  if (provider === 'goatcounter') {
    s.dataset.goatcounter = `https://${env!.VITE_GOATCOUNTER!.trim()}.goatcounter.com/count`
    s.src = 'https://gc.zgo.at/count.js'
  } else {
    s.dataset.domain = env!.VITE_PLAUSIBLE_DOMAIN!.trim()
    s.src = 'https://plausible.io/js/script.js'
    s.defer = true
  }
  document.head.appendChild(s)

  // named events from clicks on links we care about: nothing else is observed
  document.addEventListener('click', (e) => {
    const a = (e.target instanceof Element ? e.target : null)?.closest('a')
    const name = a ? eventForLink(a.getAttribute('href') ?? '') : null
    if (name) track(name)
  }, { capture: true })
}
