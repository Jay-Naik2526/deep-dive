import { allProjects, writeups, logbook, skillGroups, profile, offers, nowItems, featured, reef, certificates } from '../data.ts'

/** One citable piece of my own writing. The diver can only ever say things that appear in these. */
export interface Passage {
  id: string
  /** Shown as the citation, e.g. "Kupakosh · what I built" */
  label: string
  text: string
  /** Extra words that should count toward matching (names, section titles) but are not part of the answer */
  keys: string
  projectId?: string
}

export function buildCorpus(): Passage[] {
  const out: Passage[] = []

  for (const p of allProjects) {
    const w = writeups[p.id]
    const base = `${p.title} ${p.alt ?? ''} ${p.tag} ${p.stack.join(' ')}`
    out.push({ id: `${p.id}:about`, label: `${p.title} · overview`, text: `${p.title} (${p.tag.includes(p.year) ? p.tag : `${p.tag}, ${p.year}`}). ${p.long}`, keys: base, projectId: p.id })
    out.push({ id: `${p.id}:stack`, label: `${p.title} · tech stack`, text: `${p.title} is built with ${p.stack.join(', ')}.`, keys: `${base} stack tech technologies tools built with`, projectId: p.id })
    if (!w) continue
    out.push({ id: `${p.id}:problem`, label: `${p.title} · the problem`, text: w.problem, keys: `${base} problem why need`, projectId: p.id })
    w.built.forEach((b, i) => out.push({ id: `${p.id}:built${i}`, label: `${p.title} · what I built`, text: b, keys: `${base} built build feature`, projectId: p.id }))
    out.push({ id: `${p.id}:numbers`, label: `${p.title} · the numbers`, text: `${p.title}, the numbers: ${w.numbers.map(([n, l]) => `${n} ${l}`).join('; ')}.`, keys: `${base} numbers stats results accuracy measured metrics`, projectId: p.id })
    if (w.honest) out.push({ id: `${p.id}:honest`, label: `${p.title} · what it doesn't claim`, text: w.honest, keys: `${base} limits limitations honest claim caveat`, projectId: p.id })
    if (w.why) out.push({ id: `${p.id}:why`, label: `${p.title} · why I built it`, text: w.why, keys: `${base} why motivation`, projectId: p.id })
  }

  for (const l of logbook) {
    out.push({
      id: `log:${l.role}:${l.org}`,
      label: `${l.role} · ${l.org}`,
      text: `${l.role}, ${l.org} (${l.when}). ${l.points.join(' ')}`,
      keys: `${l.role} ${l.org} experience role leadership work history`,
    })
  }

  for (const g of skillGroups) {
    out.push({ id: `skills:${g.name}`, label: `Skills · ${g.name}`, text: `${g.name}: ${g.items.join(', ')}.`, keys: `skills stack technologies tools languages ${g.name} know use work with` })
  }

  for (const o of offers) {
    out.push({ id: `offer:${o.title}`, label: `What I'd build · ${o.title}`, text: `${o.title}. ${o.line}`, keys: `build offer hire services strengths speciality ${o.title}` })
  }
  for (const n of nowItems) {
    out.push({ id: `now:${n.title}`, label: `Right now · ${n.title}`, text: `${n.title}. ${n.line}`, keys: `now current currently focus working on this month` })
  }

  for (const c of certificates) {
    out.push({
      id: `cert:${c.id}`,
      label: `Certificates · ${c.title}`,
      text: `${c.title}, ${c.issuer} (${c.kind.toLowerCase()}${c.date ? `, ${c.date}` : ''}). ${c.line}${c.courses ? ` Courses: ${c.courses.map((k) => k.title).join('; ')}.` : ''}`,
      keys: `certificate certificates certification credentials courses completed learning coursera ${c.title} ${c.issuer}`,
    })
  }
  out.push({
    id: 'cert:all',
    label: 'Certificates',
    text: `I have ${certificates.length} certificates and workshop completions: ${certificates.map((c) => `${c.title} (${c.issuer}${c.date ? `, ${c.date}` : ''})`).join('; ')}. They are listed with the originals in the Credentials section.`,
    keys: 'certificates certifications credentials courses completed learning coursera google ibm python',
  })

  out.push(
    { id: 'me:about', label: 'About me', text: 'I’m Jay Naik, a B.Tech CSE student (2024–2028, CGPA 8.5) at NMIMS MPSTME Shirpur, from Navsari, Gujarat. I’m the President of the Coding Club, the Vice President of Ambiora 2027, the NMIMS inter-campus techfest, and a Google Student Ambassador on this campus (since May 2026, with a monthly session on new Gemini features), and I was the Web Dev Lead at GDG on Campus. I build full-stack web, IoT and 3D web.', keys: 'who about me jay naik introduce yourself education college university student cgpa location navsari' },
    { id: 'me:contact', label: 'Contact', text: `You can email me at ${profile.email}, find me on LinkedIn and GitHub, or open my résumé from the contact section.`, keys: 'contact email reach hire message linkedin github resume cv' },
    { id: 'me:availability', label: 'Availability', text: 'I’m open to internships, part-time work and freelance projects.', keys: 'available availability hire internship freelance part-time job opportunity open to work' },
  )
  return out
}

export const counts = { total: allProjects.length, featured: featured.length, reef: reef.length }
