/**
 * Guestbook entries are GitHub issues on this repo. A visitor submits one (signed in with GitHub); it stays invisible
 * until I add the `guestbook` label. That label is the approval, so nothing unmoderated can ever appear on the site.
 * Everything here is pure so it can be tested without a browser.
 */
export const GUESTBOOK_REPO = 'Jay-Naik2526/deep-dive'
export const GUESTBOOK_LABEL = 'guestbook'
export const SIGN_URL = `https://github.com/${GUESTBOOK_REPO}/issues/new?template=guestbook.yml`
export const FEED_URL = `https://api.github.com/repos/${GUESTBOOK_REPO}/issues?labels=${GUESTBOOK_LABEL}&state=all&sort=created&direction=desc&per_page=30`

export interface Entry { id: number; who: string; login: string; avatar: string | null; text: string; when: string; url: string }

interface RawIssue {
  id: number
  number: number
  title?: string
  body?: string | null
  created_at: string
  html_url: string
  pull_request?: unknown
  labels?: ({ name?: string } | string)[]
  user?: { login?: string; avatar_url?: string } | null
}

const MAX = 280

/** Pulls the visitor's own words out of a GitHub issue-form body and removes anything that is not plain text. */
export function cleanText(body: string): string {
  let t = body
  const m = t.match(/###\s*Your line\s*\n+([\s\S]*?)(?:\n###|$)/i)
  if (m) t = m[1]
  t = t
    .replace(/_No response_/gi, ' ') // GitHub's placeholder for an empty field; must go before underscores are stripped
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ') // html
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links keep their text, drop the url
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[`*_>#~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > MAX ? t.slice(0, MAX - 1).trimEnd() + '…' : t
}

function cleanName(body: string, login: string): string {
  const m = body.match(/###\s*(?:Name|Your name)[^\n]*\n+([^\n#]+)/i)
  const n = m?.[1]?.replace(/_No response_/gi, '').replace(/[<>`*_[\]()]/g, '').trim()
  return n && n.length <= 40 ? n : login
}

const avatarOk = (u?: string) => {
  try {
    const url = new URL(u ?? '')
    return url.protocol === 'https:' && url.hostname === 'avatars.githubusercontent.com' ? url.toString() : null
  } catch {
    return null
  }
}

/** Raw issue list in, safe entries out: only labelled issues, never pull requests, plain text only. */
export function toEntries(raw: unknown): Entry[] {
  if (!Array.isArray(raw)) return []
  const out: Entry[] = []
  for (const i of raw as RawIssue[]) {
    if (!i || i.pull_request) continue
    const labelled = (i.labels ?? []).some((l) => (typeof l === 'string' ? l : l?.name) === GUESTBOOK_LABEL)
    if (!labelled) continue
    const body = i.body ?? ''
    const text = cleanText(body)
    const login = i.user?.login
    if (!text || !login) continue
    out.push({ id: i.id, who: cleanName(body, login), login, avatar: avatarOk(i.user?.avatar_url), text, when: i.created_at, url: i.html_url })
  }
  return out
}
