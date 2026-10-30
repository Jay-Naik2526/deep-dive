/** Small, cached helpers over GitHub's public events API. Nothing here needs a token; everything fails soft. */
export interface RecentRepo { repo: string; when: string; pushes: number }

const KEY = 'recent-repos-v1'
const TTL = 5 * 60 * 1000

/** The repos you pushed to most recently, newest first, with how many recent pushes each had. */
export async function fetchRecentRepos(login: string, signal?: AbortSignal, limit = 4): Promise<RecentRepo[]> {
  try {
    const c = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    if (c && Date.now() - c.at < TTL) return c.v as RecentRepo[]
  } catch { /* storage can be blocked */ }
  const res = await fetch(`https://api.github.com/users/${login}/events/public?per_page=100`, { signal })
  if (!res.ok) throw new Error(String(res.status))
  const ev = (await res.json()) as { type: string; created_at: string; repo: { name: string } }[]
  const map = new Map<string, RecentRepo>()
  for (const e of ev) {
    if (e.type !== 'PushEvent') continue
    const name = e.repo.name.split('/')[1] ?? e.repo.name
    const r = map.get(name)
    if (r) r.pushes++
    else map.set(name, { repo: name, when: e.created_at, pushes: 1 })
  }
  const v = [...map.values()].slice(0, limit)
  try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), v })) } catch { /* ignore */ }
  return v
}

export function ago(iso: string, now = Date.now()) {
  const mins = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000))
  return mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} d ago`
}
