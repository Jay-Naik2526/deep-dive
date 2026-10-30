const GH = 'https://github.com/Jay-Naik2526/'

export const profile = {
  name: 'Jay Naik',
  email: 'naikjay208@gmail.com',
  location: 'Navsari, Gujarat · India',
  site: 'https://jaynaik.tech',
  github: 'https://github.com/Jay-Naik2526',
  linkedin: 'https://www.linkedin.com/in/jay-naik-68a00231a',
  resume: 'https://drive.google.com/file/d/13OciOYR9Az33goxw0QJZmFvYamSWxK_Z/view?usp=sharing',
  hologram: 'https://jaynaik.tech',
}

export const roles = ['Coding Club President', 'Full-stack developer', 'IoT builder', '3D web', 'Hackathon team lead']

export interface Project {
  id: string
  title: string
  alt?: string // devanagari / sub title
  tag: string
  year: string
  blurb: string
  long: string
  stack: string[]
  stats?: [string, string][]
  url?: string
  repo?: string
  image?: string
  live?: 'holo'
  hue: number // poster hue for projects without a screenshot
}

export const featured: Project[] = [
  {
    id: 'coding-club', title: 'The Coding Club', tag: 'President · NMIMS MPSTME', year: '2026', hue: 225, image: '/img/codingclub.webp',
    blurb: 'Code. Collaborate. Create.',
    long: 'The official website of the Coding Club I lead at NMIMS MPSTME. It is built as two worlds: a scroll-driven 3D landing (a glossy extruded </> glyph on a reflective floor, with a star field) and a warm newspaper-style editorial site for everything inside. It runs events and registrations, a live code judge in the browser (Monaco and Judge0), a real-time leaderboard, CTF challenges, recruitment forms and a role-guarded admin panel, with Google sign-in.',
    stack: ['React 19', 'Three.js (R3F)', 'GSAP + Lenis', 'Express', 'MongoDB', 'Socket.IO', 'Judge0'],
    stats: [['2', 'worlds: 3D + editorial'], ['Live', 'code judge + CTF'], ['500+', 'members']],
    url: 'https://coding-club-nmims.vercel.app',
  },
  {
    id: 'kupakosh', title: 'Kupakosh', alt: 'कूपकोश', tag: 'Smart India Hackathon 2026', year: '2026', hue: 28,
    blurb: 'Others search your PDFs. Kupakosh remembers.',
    long: "A well-memory system for Oil India Limited. Every well is drawn as its recorded formation column, so engineers can see what went wrong in the same rock layers before. Built on public stand-in data, as decision support only: the engineer decides. I led Team The RAGnarok on this one.",
    stack: ['Python', 'Next.js', 'RAG', 'Team lead'], stats: [['PS', '26121'], ['Client', 'Oil India']],
    repo: GH + 'kupakosh',
  },
  {
    id: 'niyamkosh', title: 'NiyamKosh', alt: 'नियमकोश', tag: 'Smart India Hackathon 2026', year: '2026', hue: 190,
    blurb: 'Describe what you are buying. Get the right Indian Standard.',
    long: 'An AI recommendation engine for BIS: describe a procurement need and get the applicable Indian Standard, plus your tender back, corrected. Hybrid retrieval (MiniLM and BM25 into a cross-encoder) that never invents a standard, in eleven Indian languages through Bhashini.',
    stack: ['FastAPI', 'MiniLM + BM25', 'Cross-encoder', 'Bhashini'],
    stats: [['27,687', 'standards indexed'], ['4,917', 'real tenders read'], ['70,366', 'co-citation links'], ['0', 'standards invented']],
    repo: GH + 'niyamkosh',
  },
  {
    id: 'or-studio', title: 'OR/Studio', tag: 'Open source · works offline', year: '2026', hue: 78,
    blurb: 'Every pivot, explained.',
    long: 'A free, in-browser Operations Research workbench and a modern replacement for TORA. Exact rational arithmetic, every tableau and ratio test shown and explained, with a step player and a tutor mode. Built to learn, check homework and present a solution to a class.',
    stack: ['React 19', 'TypeScript', 'Vite 6', 'Tailwind 4'], stats: [['174', 'tests passing'], ['Exact', 'fractions']],
    repo: GH + 'or-studio',
  },
  {
    id: 'studysync', title: 'StudySync', tag: 'Live · used by real students', year: '2025', hue: 18, image: '/img/studysync.webp',
    blurb: 'Your semester, mapped.',
    long: 'A deployed, multi-user academic platform for NMIMS Shirpur: live attendance via SAP automation, a marks hub with a what-if goal calculator, AI study tools powered by Gemini, and a full faculty mentor management system.',
    stack: ['React 19', 'Node.js', 'MongoDB', 'Playwright', 'Gemini'], stats: [['Live', 'multi-user'], ['SAP', 'auto-sync']],
    url: 'https://studysync-inky.vercel.app', repo: GH + 'studysync',
  },
  {
    id: 'w8', title: 'W8 Fitness', tag: 'React + TypeScript', year: '2025', hue: 150, image: '/img/w8fitness.webp',
    blurb: 'A gym website with client, admin and trainer portals.',
    long: 'A gym website with separate Client, Admin and Trainer portals: three roles, one product, typed end to end.',
    stack: ['React', 'TypeScript', 'Tailwind'], stats: [['3', 'portals']], url: 'https://w8-fitness.vercel.app', repo: GH + 'W8-fitness',
  },
  {
    id: 'skyflix', title: 'Skyflix', tag: 'Movies and series · admin panel', year: '2025', hue: 5, image: '/img/skyflix.webp',
    blurb: 'A streaming-style catalogue with a full admin panel.',
    long: 'Movies and series website with an admin panel for managing the catalogue, built on the MERN stack.',
    stack: ['React', 'Tailwind', 'Node.js', 'MongoDB'], url: 'https://skyflix-smoky.vercel.app', repo: GH + 'skyflix',
  },
  {
    id: 'ambiora', title: 'Ambiora Techfest', tag: 'Technical lead · 500+ visitors', year: '2025', hue: 265, image: '/img/ambiora.webp',
    blurb: 'The official techfest site, live for two days with zero downtime.',
    long: 'Official website for Ambiora Techfest at NMIMS Shirpur. As technical lead I ran all technical operations across 8+ events, and the site handled 500+ student visitors over the live two-day event with zero downtime.',
    stack: ['React', 'Tailwind', 'Vercel'], stats: [['500+', 'visitors'], ['0', 'downtime']], url: 'https://ambiora-techfest.vercel.app', repo: GH + 'ambiora-techfest',
  },
]

export interface Shallow { id: string; live?: 'holo'; title: string; desc: string; url: string; image?: string; hue: number; stack: string[] }
export const shallows: Shallow[] = [
  { id: 'holo', live: 'holo', title: 'Holographic Portfolio', desc: 'Immersive 3D portfolio · React Three Fiber', url: 'https://jaynaik.tech', hue: 200, stack: ['Three.js', 'R3F', 'Bloom'] },
  { id: 'base', title: 'Base Platform', desc: 'Tuition platform with student, teacher and parent portals', url: 'https://studyatbase.in', image: '/img/base.webp', hue: 215, stack: ['MERN', 'Role-based'] },
  { id: 'choksi', title: 'Choksi Classes', desc: 'Tuition portal: tests, fees, doubts and homework for Sir, students and parents', url: 'https://choksi-classes.vercel.app', image: '/img/choksi.webp', hue: 24, stack: ['React', 'Node.js', 'MongoDB', 'Socket.IO'] },
  { id: 'firstpr', title: 'First PR Festival', desc: 'Spider-Society mainframe: merge a pull request and your ID card goes live', url: 'https://first-pr-festival.vercel.app', image: '/img/firstpr.webp', hue: 355, stack: ['Next.js', 'GitHub', 'Open source'] },
  { id: 'nash', title: 'NashSttrike', desc: 'Coding Club cyber-division event site with a matrix-style login', url: 'https://nash-sttrike.vercel.app', image: '/img/nash.webp', hue: 140, stack: ['HTML', 'CSS', 'JS', 'CTF'] },
  { id: 'treasure', title: 'Treasure Hunt 26', desc: 'Ambiora 2026 team-based treasure hunt with admin and participant roles', url: 'https://treasurehunt26.vercel.app', image: '/img/treasure.webp', hue: 100, stack: ['React', 'Node.js', 'Docker'] },
  { id: 'flavium', title: 'Flavium Official', desc: 'Official sports event broadcast site', url: 'https://flavium-official.vercel.app', image: '/img/flavium.webp', hue: 30, stack: ['React'] },
  { id: 'money', title: 'Finance Tracker', desc: 'Multi-payer split bills and debt tracking', url: 'https://personal-finance-tracker-one-lime.vercel.app', image: '/img/moneymap.webp', hue: 140, stack: ['MERN', 'Tailwind'] },
  { id: 'tiny', title: 'TinyTies', desc: 'URL shortener and analytics platform', url: 'https://tinyties.vercel.app', image: '/img/tinyties.webp', hue: 300, stack: ['React', 'Node.js'] },
  { id: 'jam', title: 'Study Jam', desc: 'Guidelines, solutions and a leaderboard', url: 'https://studyjam-website.vercel.app', image: '/img/studyjam.webp', hue: 45, stack: ['React'] },
  { id: 'imdb', title: 'Personal IMDb', desc: 'Movie details with React and Three.js', url: 'https://personal-imdb-eight.vercel.app', image: '/img/imdb.webp', hue: 340, stack: ['React', 'Three.js'] },
  { id: 'stock', title: 'Smart Stock', desc: 'Real-time stock tracking dashboard', url: GH + 'smart-stock', image: '/img/smartstock.webp', hue: 160, stack: ['React'] },
  { id: 'fire', title: 'Fire Evacuation', desc: 'DAIoT smart evacuation system', url: GH + 'fire-evacuation-system', image: '/img/fireguard.webp', hue: 12, stack: ['Python', 'IoT'] },
  { id: 'resume', title: 'Resume Analyzer', desc: 'A simple resume analyser in Python', url: GH + 'Resume_Analyzer', image: '/img/resume.webp', hue: 250, stack: ['Python'] },
  { id: 'tcs', title: 'TCS Notes', desc: 'Theory of computer science notes portal', url: 'https://tcs-notes.vercel.app', image: '/img/tcsnotes.webp', hue: 60, stack: ['HTML', 'CSS'] },
]

export const logbook = [
  { role: 'Coding Club President', org: 'Coding Club · NMIMS MPSTME Shirpur', when: 'Now', now: true, points: ['Leading the club: events, workshops and the people who build them.'] },
  { role: 'Web Development Lead', org: 'GDG on Campus · NMIMS MPSTME Shirpur', when: '2025', points: ['Led a team of 10 across web dev workshops and campus tech events.', 'Top 10 at the GDG On Campus Hackathon out of 30+ teams.', 'Ran 3+ developer workshops for 100+ students.'] },
  { role: 'Technical Lead', org: 'Ambiora Techfest', when: '2024 →', points: ['Site served 500+ visitors over a live two-day event with zero downtime.', 'Owned technical operations across 8+ events.'] },
  { role: 'Technical Lead', org: 'Flavium Sports Event', when: '2024 →', points: ['Built the official event site and ran technical setup for 5+ sports events.'] },
]

export const numbers = [
  { n: 500, plus: true, label: 'visitors, zero downtime' },
  { n: 10, plus: false, label: 'developers led at GDGoC' },
  { n: 10, plus: false, label: 'top-10 hackathon finish', pre: 'Top ' },
  { n: 20, plus: true, label: 'projects shipped' },
]

export const skillGroups: { name: string; items: string[] }[] = [
  { name: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'SQL'] },
  { name: 'Frontend', items: ['React', 'Next.js', 'Three.js', 'Tailwind', 'HTML/CSS'] },
  { name: 'Backend', items: ['Node.js', 'Express', 'Flask', 'FastAPI', 'REST'] },
  { name: 'Data', items: ['MongoDB', 'Oracle SQL', 'MS SQL'] },
  { name: 'IoT', items: ['ESP32', 'MQTT', 'Blynk', 'ThingSpeak'] },
  { name: 'Craft', items: ['Git', 'Vercel', 'Playwright', 'RAG'] },
]

export const sections = [
  { id: 'top', label: 'Surface' },
  { id: 'about', label: 'Logbook' },
  { id: 'dives', label: 'Dives' },
  { id: 'reef', label: 'Reef' },
  { id: 'sonar', label: 'Sonar' },
  { id: 'signal', label: 'Signal' },
  { id: 'seabed', label: 'Contact' },
]
