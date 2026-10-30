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

export const roles = ['Coding Club President', 'Ambiora 2027 Vice President', 'Full-stack developer', '3D web']

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
    id: 'kupakosh', title: 'Kupakosh', alt: 'कूपकोश', tag: 'Smart India Hackathon 2026', year: '2026', hue: 28, image: '/img/kupakosh.webp',
    blurb: 'Others search your PDFs. Kupakosh remembers.',
    long: "A well-memory system for Oil India Limited. Every well is drawn as its recorded formation column, so engineers can see what went wrong in the same rock layers before. Built on public stand-in data, as decision support only: the engineer decides. I led Team The RAGnarok on this one.",
    stack: ['Python', 'Next.js', 'RAG', 'Team lead'], stats: [['PS', '26121'], ['Client', 'Oil India']],
    url: 'https://kupakosh.duckdns.org/', repo: GH + 'kupakosh',
  },
  {
    id: 'niyamkosh', title: 'NiyamKosh', alt: 'नियमकोश', tag: 'Smart India Hackathon 2026', year: '2026', hue: 190, image: '/img/niyamkosh.webp',
    blurb: 'Describe what you are buying. Get the right Indian Standard.',
    long: 'An AI recommendation engine for BIS: describe a procurement need and get the applicable Indian Standard, plus your tender back, corrected. Hybrid retrieval (MiniLM and BM25 into a cross-encoder) that never invents a standard, in eleven Indian languages through Bhashini.',
    stack: ['FastAPI', 'MiniLM + BM25', 'Cross-encoder', 'Bhashini'],
    stats: [['27,687', 'standards indexed'], ['4,917', 'real tenders read'], ['70,366', 'co-citation links'], ['0', 'standards invented']],
    url: 'https://niyamkosh.indiasouthcentral.cloudapp.azure.com/#draft', repo: GH + 'niyamkosh',
  },
  {
    id: 'or-studio', title: 'OR/Studio', tag: 'Open source · works offline', year: '2026', hue: 78, image: '/img/or-studio.webp',
    blurb: 'Every pivot, explained.',
    long: 'A free, in-browser Operations Research workbench and a modern replacement for TORA. Exact rational arithmetic, every tableau and ratio test shown and explained, with a step player and a tutor mode. Built to learn, check homework and present a solution to a class.',
    stack: ['React 19', 'TypeScript', 'Vite 6', 'Tailwind 4'], stats: [['174', 'tests passing'], ['Exact', 'fractions']],
    url: 'https://or-studio.antideploy.app/#/', repo: GH + 'or-studio',
  },
  {
    id: 'studysync', title: 'StudySync', tag: 'Live · used by real students', year: '2025', hue: 18, image: '/img/studysync.webp',
    blurb: 'Your semester, mapped.',
    long: 'A deployed, multi-user academic platform for NMIMS Shirpur: live attendance via SAP automation, a marks hub with a what-if goal calculator, AI study tools powered by Gemini, and a full faculty mentor management system.',
    stack: ['React 19', 'Node.js', 'MongoDB', 'Playwright', 'Gemini'], stats: [['Live', 'multi-user'], ['SAP', 'auto-sync']],
    url: 'https://studysync-inky.vercel.app', repo: GH + 'studysync',
  },
  {
    id: 'skyflix', title: 'Skyflix', tag: 'Movies and series · admin panel', year: '2025', hue: 5, image: '/img/skyflix.webp',
    blurb: 'A streaming-style catalogue with a full admin panel.',
    long: 'Movies and series website with an admin panel for managing the catalogue, built on the MERN stack.',
    stack: ['React', 'Tailwind', 'Node.js', 'MongoDB'], url: 'https://skyflixer.fun', repo: GH + 'skyflix',
  },
  {
    id: 'ambiora', title: 'Ambiora Techfest', tag: 'Technical lead · 500+ visitors', year: '2025', hue: 265, image: '/img/ambiora.webp',
    blurb: 'The official techfest site, live for two days with zero downtime.',
    long: 'Official website for Ambiora Techfest at NMIMS Shirpur. As technical lead I ran all technical operations across 8+ events, and the site handled 500+ student visitors over the live two-day event with zero downtime.',
    stack: ['React', 'Tailwind', 'Vercel'], stats: [['500+', 'visitors'], ['0', 'downtime']], url: 'https://ambiora-techfest.vercel.app', repo: GH + 'ambiora-techfest',
  },
]




/** Everything beyond the featured eight. Each one opens the same case-study window. */
export const reef: Project[] = [
  {
    id: 'holo', live: 'holo', title: 'Holographic Portfolio', tag: 'Three.js · WebGL', year: '2026', hue: 200,
    blurb: 'My previous portfolio: a holographic 3D world you fly through.',
    long: 'A fully immersive portfolio built with React and Three.js. A glowing rotating core for home, hexagonal data nodes for about, a 3D carousel of projects, a floating cloud of skills and interactive icons for contact, all lit with bloom and a vignette, with separate camera rigs for phones and desktops.',
    stack: ['React 19', 'Three.js', 'R3F', 'Bloom', 'Vite'], url: 'https://jaynaik.tech', repo: GH + '3d-portfolio',
  },
  {
    id: 'base', title: 'Base Platform', tag: 'MERN · role dashboards', year: '2025', hue: 215, image: '/img/base.webp',
    blurb: 'A tuition platform with student, parent and admin dashboards.',
    long: 'The website and portal for BASE, a science tuition brand: a cinematic landing page with a background video, Firebase sign-in, and a separate dashboard for students, parents and the admin, plus a written admin guide for the owner.',
    stack: ['React', 'Node.js', 'Firebase', 'Express'], url: 'https://studyatbase.in',
  },
  {
    id: 'choksi', title: 'Choksi Classes', tag: 'Full-stack · tuition portal', year: '2026', hue: 24, image: '/img/choksi.webp',
    blurb: 'A tuition management portal for a Navsari institute: tests, fees, doubts and homework.',
    long: 'A full-stack portal for Choksi Classes in Navsari. Behind an animated public landing page sits a private dashboard where the teacher, students and parents each get their own view of tests, study material, homework, fees, doubts and progress.',
    stack: ['React', 'Vite', 'Node.js', 'MongoDB', 'Socket.IO'], url: 'https://choksi-classes.vercel.app', repo: GH + 'choksi-classes',
  },
  {
    id: 'firstpr', title: 'First PR Festival', tag: 'Open source · Next.js', year: '2026', hue: 355, image: '/img/firstpr.webp',
    blurb: 'Merge a pull request and your Spider-ID card goes live on the site.',
    long: 'The live roster for a workshop that teaches people to make their first pull request. Every card on the page is a real merged PR: students add a file, it merges, the site rebuilds, and their card appears. There is no database, only JSON files, Git and a strict sandbox.',
    stack: ['Next.js', 'TypeScript', 'GitHub', 'Vercel'], url: 'https://first-pr-festival.vercel.app', repo: GH + 'first-pr-festival',
  },
  {
    id: 'w8', title: 'W8 Fitness', tag: 'React + TypeScript', year: '2025', hue: 150, image: '/img/w8fitness.webp',
    blurb: 'A gym website with client, admin and trainer portals.',
    long: 'A gym website with separate Client, Admin and Trainer portals: three roles, one product, typed end to end.',
    stack: ['React', 'TypeScript', 'Tailwind'], stats: [['3', 'portals']], url: 'https://w8-fitness.vercel.app', repo: GH + 'W8-fitness',
  },
  {
    id: 'nash', title: 'NashSttrike', tag: 'Cyber division · CTF', year: '2026', hue: 140, image: '/img/nash.webp',
    blurb: 'The Coding Club cyber-division event site, behind a matrix-rain login.',
    long: 'The front door for the Coding Club cyber division’s NashSttrike event: a falling-code matrix background and a terminal-style login that leads into a challenge, with a companion Streamlit app that serves the flags from secrets instead of the code.',
    stack: ['HTML', 'CSS', 'JavaScript', 'Streamlit'], url: 'https://nash-sttrike.vercel.app', repo: GH + 'NashSttrike',
  },
  {
    id: 'treasure', title: 'Treasure Hunt 26', tag: 'Ambiora 2026 · event platform', year: '2026', hue: 100, image: '/img/treasure.webp',
    blurb: 'A team-based treasure hunt with admin and participant roles.',
    long: 'The platform behind the Ambiora 2026 treasure hunt. Explorers log in as participants, teams answer a seeded set of questions, uploads go through Cloudinary, and an admin side runs the hunt, with points calculated on the server.',
    stack: ['React', 'Node.js', 'Express', 'Docker'], url: 'https://treasurehunt26.vercel.app',
  },
  {
    id: 'flavium', title: 'Flavium Official', tag: 'Technical lead · sports fest', year: '2026', hue: 30, image: '/img/flavium.webp',
    blurb: 'The official broadcast site for the Flavium sports festival.',
    long: 'The official site for Flavium, the NMIMS sports festival, styled as a live broadcast: a dashboard with the year-wise medal tally, match cards, a branch-versus-branch scoreboard, results, rules, contact, and an admin page to publish scores.',
    stack: ['React', 'Vite', 'Vercel'], url: 'https://flavium-official.vercel.app', repo: GH + 'flavium-official',
  },
  {
    id: 'money', title: 'Finance Tracker', tag: 'MERN · money tools', year: '2026', hue: 140, image: '/img/moneymap.webp',
    blurb: 'A personal finance app with split bills, debts, savings jars and subscriptions.',
    long: 'A MERN finance tracker built around how people actually share money: split a bill between several payers, track who owes whom, set budgets, fill savings jars toward goals, watch recurring subscriptions, and read analytics and reports.',
    stack: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind'], url: 'https://personal-finance-tracker-one-lime.vercel.app', repo: GH + 'personal-finance-tracker',
  },
  {
    id: 'tiny', title: 'TinyTies', tag: 'Storefront · handmade jewellery', year: '2026', hue: 300, image: '/img/tinyties.webp',
    blurb: 'A soft, editorial storefront for handmade beaded jewellery.',
    long: 'A storefront for a small handmade beaded-jewellery brand. Visitors browse the shop, open a quick view, check the size guide, fill a cart, read reviews and the FAQ, and place a custom order, in a pale rose and gold design.',
    stack: ['React', 'Vite', 'CSS'], url: 'https://tinyties.vercel.app', repo: GH + 'tinyties',
  },
  {
    id: 'jam', title: 'Study Jam', tag: 'React · leaderboard', year: '2025', hue: 45, image: '/img/studyjam.webp',
    blurb: 'Course guidelines, solutions and a live leaderboard for a study jam.',
    long: 'The website for a study jam: the courses and labs, the rules, worked solutions, the teams, and a leaderboard rebuilt from CSV exports so participants can see where they stand.',
    stack: ['React', 'Vite', 'CSV data'], url: 'https://studyjam-website.vercel.app', repo: GH + 'studyjam-website',
  },
  {
    id: 'imdb', title: 'Personal IMDb', tag: 'React · Firebase', year: '2025', hue: 340, image: '/img/imdb.webp',
    blurb: 'My own movie library, organised into collections.',
    long: 'A personal movie library in the style of a streaming app: posters in a grid, a sidebar of hand-made collections (a director, a franchise, a mood), search and sort, a detail page for each film, and a form to add new ones, backed by Firebase.',
    stack: ['React', 'Firebase', 'Vite'], url: 'https://personal-imdb-eight.vercel.app', repo: GH + 'personal-imdb',
  },
  {
    id: 'stock', title: 'Smart Stock', tag: 'React · inventory API', year: '2026', hue: 160, image: '/img/smartstock.webp',
    blurb: 'A stock tracking dashboard with an audit trail.',
    long: 'An inventory dashboard backed by a REST API for products, categories and stock transactions, with sign-in and an audit log that records every change.',
    stack: ['React', 'Node.js', 'Express'], url: GH + 'smart-stock', repo: GH + 'smart-stock',
  },
  {
    id: 'fire', title: 'Fire Evacuation', tag: 'DAIoT · ESP32 + MQTT', year: '2026', hue: 12, image: '/img/fireguard.webp',
    blurb: 'A smart evacuation system that routes people away from the fire.',
    long: 'An IoT project that senses danger and finds the safest way out. ESP32 sensors report over MQTT, a Python backend models the building as a graph and recomputes the shortest safe route with Dijkstra as conditions change, and a live dashboard shows the state over WebSockets.',
    stack: ['Python', 'Flask', 'ESP32', 'MQTT', 'Dijkstra'], url: GH + 'fire-evacuation-system', repo: GH + 'fire-evacuation-system',
  },
  {
    id: 'resume', title: 'Resume Analyzer', tag: 'Python · Streamlit', year: '2025', hue: 250, image: '/img/resume.webp',
    blurb: 'Match a résumé against a job description and see the skill gap.',
    long: 'A small Streamlit app that reads a résumé and a job description, pulls out the skills in each, scores the match, charts it, lists the skills that match and the ones missing, and exports the result as a PDF report.',
    stack: ['Python', 'Streamlit', 'Matplotlib', 'FPDF'], url: GH + 'Resume_Analyzer', repo: GH + 'Resume_Analyzer',
  },
  {
    id: 'tcs', title: 'TCS Notes', tag: 'HTML + CSS · study notes', year: '2026', hue: 60, image: '/img/tcsnotes.webp',
    blurb: 'Theory of Computation notes, chapter by chapter, with past papers.',
    long: 'A static notes site for Theory of Computer Science: six chapters, a worked DFA example, diagrams, and four sets of previous-year question papers, written so a whole class could revise from a link.',
    stack: ['HTML', 'CSS', 'JavaScript'], url: 'https://tcs-notes.vercel.app',
  },
]

/** Every project, in the order the case-study window pages through them. */
export const allProjects: Project[] = [...featured, ...reef]

/** The depth label shown beside a project (featured go −38 to −115 m, the reef continues below). */
export const depthOf = (id: string) => {
  const f = featured.findIndex((p) => p.id === id)
  if (f >= 0) return 38 + f * 11
  return 130 + Math.max(0, reef.findIndex((p) => p.id === id)) * 4
}

export interface Writeup {
  problem: string
  built: string[]
  numbers: [string, string][]
  /** In my own words: why I built it. Left empty until filled in; the page shows it only when present. */
  why?: string
  /** What the project does NOT claim. Shown when present. */
  honest?: string
}

/**
 * Writeups for every project. Each figure is either from the project's own README / measured results,
 * or a count taken straight from its code (models, routes, pages, components).
 * `why` stays empty until it is filled in with the author's own words; the page only shows it when present.
 */
export const writeups: Record<string, Writeup> = {
  'coding-club': {
    problem: "A club that runs events, contests, CTFs and recruitment across two campuses and three departments (DSA, Web and Cybersecurity) needed one home for all of it, and a front door that actually felt like the club.",
    built: [
      "Two worlds in one site: a scroll-driven 3D landing, then a warm newspaper-style editorial site for every inner page, linked by a cinematic wipe.",
      "A code judge in the browser: Monaco editor wired to Judge0, run against samples, submit against hidden tests, with verdicts, time and memory.",
      "Live leaderboards (global and per department) pushed over Socket.IO, plus CTF challenges, events with QR tickets and PDF certificates.",
      "Google sign-in, a role-guarded admin panel, and recruitment that posts straight into a Google Form.",
      "A monorepo with a Vite and React 19 web app, an Express and MongoDB API, and a shared package of Zod schemas so both sides agree on the data.",
    ],
    numbers: [["3", "departments"], ["14", "data models"], ["9", "API route groups"], ["3", "real events archived"]],
    why: "",
    honest: "The 3D layer downgrades itself on touch, low-core and reduced-motion devices, so the club site stays usable on a phone.",
  },
  kupakosh: {
    problem: "Oil wells are drilled 2 to 4 km deep through rock layers called formations, and the same problems keep coming back in the same layers across nearby wells: mud losses, kicks, stuck pipe, overpressure. What happened in older wells is written down, but buried in thousands of daily drilling reports, while the live rig system shows only the well being drilled now, with no memory of the ones before it.",
    built: [
      "A Well Wiki compiled once from the reports: pages per well, formation and hazard, with a citation on every sentence. Uncited sentences and unsupported numbers are rejected by the compiler, and an engineer approves each page.",
      "A problem, action, outcome ledger that follows each problem through the next days of real reports to see which fix actually worked, and how often.",
      "An honest hazard model with an 80% range and the evidence count behind it, a look-ahead alert before the bit reaches a risky layer, and a shift-handover note in English and Hindi.",
      "A Hindsight test that replays real history blind: for each well the model only sees other wells, then we check whether it flagged the layer where trouble really happened.",
    ],
    numbers: [["431", "wells replayed blind"], ["0.87", "ranking accuracy (AUC)"], ["54%", "of problems had happened before"], ["391 m", "median warning before the bit"]],
    why: "",
    honest: "Every well comes from public records in eight countries, standing in for Oil India’s own reports; no Oil India data is used or claimed. It is decision support only: the engineer decides. The hazard model alone shows no measured skill (its Brier score equals the base rate), which is why the interface shows ranges and says insufficient evidence instead of guessing, and only about 1 in 10 alerts matches a recorded event.",
  },
  niyamkosh: {
    problem: "Tenders name the Indian Standard the product must meet, and many cite the wrong one. Measured on the collected corpus: 562 of 1,580 real government tenders cite a standard BIS has already withdrawn, 59 of 116 tenders for products under a Quality Control Order never ask for the ISI mark, and 209 of 512 Ministry of Defence tenders cite a withdrawn standard today. A wrong standard means the wrong product is supplied, rejected at inspection, and argued over.",
    built: [
      "A finder that takes plain words (English or an Indian language) and returns the governing standard, a confidence band, the mandatory certification, and the standards real tenders buy alongside it.",
      "A tender checker for PDF and Word files, scans included: every IS number is checked against the register and flagged as withdrawn, superseded, not in the register, or missing certification.",
      "A corrected tender handed back in the same file with the same letterhead: withdrawn citations replaced with the BIS successor, the Standard Mark clause inserted where the law demands it, and the corrected file audited again from scratch.",
      "The whole console in 11 Indian languages through Bhashini, and a browser extension for GeM, CPPP and nProcure that keeps the tender text on the officer’s machine.",
    ],
    numbers: [["27,687", "standards in the register"], ["492 / 621", "correct standard ranked first"], ["608 / 621", "correct in the top 10"], ["0", "answers outside the register"]],
    why: "",
    honest: "A model may phrase the output but never decides the standard. When evidence is weak it says so and shows the shortlist (it declined 38 of 621 test queries rather than guess). Adding co-citation neighbours to retrieval made recall worse (608 to 591), so it was measured, rejected and kept out of the product.",
  },
  'or-studio': {
    problem: "Most Operations Research solvers hand you an answer. Students need the working: each tableau, each ratio test, each reason a variable enters or leaves. TORA, the old standard, does not explain itself and does not run on a modern machine.",
    built: [
      "Thirteen solvers in the browser, from simplex, transportation and assignment to queuing, inventory, Markov chains and simulation, all using exact fractions rather than floating point.",
      "A step player with a plain-language reason for every move, and a tutor mode that pauses so you choose the entering variable or the next node and explains a wrong answer.",
      "A diff mode: type your own working and it finds the first step where it diverged and infers why.",
      "Private by design: no account, no server, no network calls. It installs as an offline app, and exports to PDF, LaTeX, PNG, CSV, JSON and HTML.",
    ],
    numbers: [["13", "solvers"], ["174", "tests passing"], ["60+", "worked textbook problems, re-solved by the test suite"], ["6", "export formats"]],
    why: "",
    honest: "Unbounded, infeasible, degenerate and cycling problems are detected and explained instead of hidden, and Big-M uses a symbolic M, never a big number.",
  },
  studysync: {
    problem: "The college’s SAP portal is clunky, attendance data is hard to interpret, and there was no infrastructure at all for mentors to follow their students. Students found out they were short on attendance too late to do anything about it.",
    built: [
      "A live attendance dashboard fed by automated SAP scraping with Playwright, on a manual button and a nightly sync, plus a class-count engine that projects how many lectures and labs each professor still owes.",
      "A marks hub with interactive charts and a what-if goal calculator, and AI study tools on Google Gemini: notes, quizzes, an adaptive planner and a chatbot that knows your own attendance and grades.",
      "A mentor system: share a MNT-XXXXX code and students enrol themselves, mentors see only their own mentees, and applications (sick leave, test absence with a medical certificate) are approved or rejected with remarks.",
    ],
    numbers: [["2", "roles: student and mentor"], ["8", "data models"], ["10", "API route groups"], ["Nightly", "automatic SAP sync"]],
    why: "",
    honest: "Mentors never see SAP credentials or a student’s personal notes: strict data boundaries are enforced on the server, not just hidden in the interface.",
  },
  w8: {
    problem: "A gym has three kinds of people who all need something different from the same data: members following a plan, trainers managing their clients, and an owner running memberships. A single generic app serves none of them well.",
    built: [
      "Three separate portals, client, trainer and admin, behind one sign-in with role-based access.",
      "For members: a dashboard, a workout architect, a nutrition tracker called Fuel, protocols, progress reports, and an AI assistant called Oracle.",
      "For trainers and the owner: client management, weekly plans, trainer and membership administration, and notifications.",
      "A TypeScript React front end on a Node and MongoDB back end, with a bundled exercise library and images.",
    ],
    numbers: [["3", "portals"], ["17", "screens"], ["7", "data models"], ["6", "API route groups"]],
    why: "",
  },
  skyflix: {
    problem: "A streaming-style catalogue gets messy fast: duplicate entries, inconsistent names, scattered requests, and a homepage someone has to curate by hand. The viewer sees a polished library only if the admin has good tools behind it.",
    built: [
      "A fast React and Vite front end with a hero banner, content rows, movies, series, categories, search, a detail modal and a player page, designed to feel the same on a phone as on a desktop.",
      "A real admin panel: a post editor, a homepage manager, a duplicate finder, a bulk rename tool and a requests inbox.",
      "A Node, Express and MongoDB API that pulls metadata from TMDB and keeps the library in sync.",
    ],
    numbers: [["15", "pages"], ["6", "admin tools"], ["5", "API controllers"]],
    why: "",
  },
  ambiora: {
    problem: "A techfest needs registration, team formation, ticketing and a schedule that all work at once when hundreds of people open the site at the same time, run by a student who is also one of the organisers.",
    built: [
      "The official Ambiora Techfest site: events and event details, a checkout, sign-up and login, a my-events page, my-teams and team-member pages, a timeline, faculty, about and contact pages.",
      "An admin page and an Express and MongoDB back end for users, teams, event registrations and the newsletter.",
      "As technical lead I ran all the technical operations around it across the festival’s events.",
    ],
    numbers: [["500+", "visitors in two days"], ["0", "downtime"], ["8+", "events run technically"], ["15", "pages"]],
    why: "",
  },
  base: {
    problem: "A tuition brand needs to look credible to parents and still give students, parents and the owner each a place to see what matters to them, without a separate app for every role.",
    built: [
      "A cinematic landing page with a background video, and Firebase sign-in that sends each person to the right dashboard.",
      "Three dashboards: students see their own work, parents see their child’s progress, and the admin manages everyone.",
      "A written admin guide for the owner, so the platform can be run without me.",
    ],
    numbers: [["3", "role dashboards"], ["5", "pages"], ["1", "admin guide written for the owner"]],
    why: "",
  },
  choksi: {
    problem: "A tuition centre in Navsari ran tests, fees, homework and parent updates by hand. The teacher needed one place to manage students, parents needed to see how their child was doing, and students needed somewhere to ask doubts and get material.",
    built: [
      "A private dashboard for three roles, the teacher, students and parents, with test creation and auto-grading, study material backed by Google Drive, homework submission and grading, and fee management with overdue tracking.",
      "Real-time doubt threads over Socket.IO, push notifications for every key event, and branded progress-report PDFs.",
      "A public landing page for the institute with animated effects, reviews, courses, a Google Maps embed and a floating WhatsApp enquiry button.",
    ],
    numbers: [["3", "user roles"], ["12", "data models"], ["10", "API route groups"], ["Real-time", "doubts and push notifications"]],
    why: "",
  },
  firstpr: {
    problem: "The hardest part of open source is the first pull request. A workshop on it needed a place where every attendee’s first merged PR is immediately visible, without anyone running a server or a database.",
    built: [
      "A live roster where each card is a real merged pull request: add a file, it merges, Vercel rebuilds, your Spider-ID card appears.",
      "A security model that lets strangers contribute HTML safely: each hand-built card renders in a sandboxed iframe with scripts disabled, so their JavaScript never runs and their CSS cannot leak out.",
      "A validator that rejects scripts, inline handlers, iframes, unfilled placeholders and oversized files, and strips them again at build time as defence in depth.",
      "Also a cheatsheet page and a small game for the workshop itself.",
    ],
    numbers: [["100+", "merged Spider-ID cards"], ["23", "components"], ["0", "databases, only JSON files and Git"], ["30 KB", "limit per hand-built card"]],
    why: "",
    honest: "Everything contributors submit is treated as untrusted. The worst a student can do is break their own card.",
  },
  nash: {
    problem: "A cyber-security event needs an entrance that sets the mood and a challenge that cannot be cheated by reading the page source.",
    built: [
      "The event site: a falling-code matrix background drawn on a canvas and a terminal-style login in plain HTML, CSS and JavaScript.",
      "A companion Streamlit app for the challenge itself. Credentials, the security answer and up to ten flags are loaded from secrets and environment variables, so none of them live in the code.",
    ],
    numbers: [["2", "apps: the site and the challenge"], ["10", "flag slots loaded from secrets"], ["0", "front-end dependencies"]],
    why: "",
  },
  treasure: {
    problem: "A treasure hunt at a techfest needs teams, questions, scoring and an organiser view that all work live while hundreds of people play.",
    built: [
      "A participant and admin login, with explorers signing in by name and a secret passcode.",
      "A Node and Express back end with question, team and user routes, a seeded question set, a server-side points calculator and image uploads through Cloudinary.",
      "A Docker image for the back end and a cheerful map-style interface for the players.",
    ],
    numbers: [["2", "roles: participant and admin"], ["3", "API route groups"], ["1", "Docker image for the back end"]],
    why: "",
  },
  flavium: {
    problem: "A sports festival wants a live feel: scores that update, a medal tally everyone argues about, and one official place for rules and results.",
    built: [
      "A site styled as a live broadcast, with a hero, match cards and a dashboard that shows the year-wise medal tally.",
      "A branch-versus-branch scoreboard, results, rules and contact pages, and an admin page to publish scores.",
      "As technical lead I handled the site and the technical setup for the festival’s sports events.",
    ],
    numbers: [["5", "pages"], ["7", "components"], ["5+", "sports events set up technically"]],
    why: "",
  },
  money: {
    problem: "Most budgeting apps are built for one person. Real money is shared: dinners split between friends, debts that go back and forth, subscriptions nobody remembers.",
    built: [
      "Split-bill support across several payers and a debt tracker that shows who owes whom.",
      "Budgets, savings jars toward goals, a wishlist, recurring subscriptions and a wallet view.",
      "Analytics, reports and insights over your transactions, on a MERN stack with JWT login.",
    ],
    numbers: [["6", "data models"], ["8", "API route groups"], ["15", "components"]],
    why: "",
  },
  tiny: {
    problem: "A small handmade jewellery brand needs a storefront that feels as soft and personal as the product, and an easy way to take custom orders, without a heavy e-commerce platform.",
    built: [
      "A pale rose and gold storefront with a hero, a shop, a quick-view, a size guide and a cart.",
      "Sections for how to order, custom orders, reviews, social proof, an FAQ and an Instagram feed.",
      "A static React front end that loads fast on a phone, where most of the visitors are.",
    ],
    numbers: [["15", "components"], ["0", "servers: a static storefront"]],
    why: "",
  },
  jam: {
    problem: "A study jam has many teams doing many labs at once. Participants want the rules, the solutions and a leaderboard they can trust, in one place.",
    built: [
      "Pages for the courses and labs, the rules, worked solutions, the teams and a leaderboard.",
      "A leaderboard rebuilt from CSV exports, so the organisers update a file rather than a database.",
    ],
    numbers: [["9", "components"], ["6", "CSV files driving the leaderboard"]],
    why: "",
  },
  imdb: {
    problem: "Rating sites tell you what everyone else thinks. I wanted my own library, organised my way: by director, by franchise, by mood.",
    built: [
      "A poster grid in the style of a streaming app, with a sidebar of hand-made collections, search and sort by year.",
      "A detail page for each film, an add-movie form, and a one-off migration script that moved the library into Firebase.",
    ],
    numbers: [["3", "views: library, detail and add"], ["1", "Firebase backend"]],
    why: "",
  },
  stock: {
    problem: "A small shop knows what it stocked and what it sold only if someone writes every change down, and nobody can say who changed what.",
    built: [
      "A REST API for products, categories and stock transactions, with sign-in.",
      "An audit route that records every change, and a React dashboard on top.",
    ],
    numbers: [["5", "API route groups"], ["1", "audit trail for every change"]],
    why: "",
  },
  fire: {
    problem: "In a fire, people need to be told which way to go, and the safe way changes as the fire spreads. A static exit sign cannot do that.",
    built: [
      "ESP32 sensors that report over MQTT, with Blynk and ThingSpeak as extra data channels.",
      "A Python backend that models the building as a graph and recomputes the shortest safe route with Dijkstra as sensor readings change.",
      "A real-time dashboard over WebSockets, and two simulators so the whole system can be tested without hardware.",
    ],
    numbers: [["7", "backend modules"], ["3", "data channels: MQTT, Blynk, ThingSpeak"], ["2", "simulators for hardware-free testing"]],
    why: "",
  },
  resume: {
    problem: "Job descriptions and résumés rarely use the same words, so it is hard to see at a glance which skills you already show and which you are missing.",
    built: [
      "A Streamlit app that reads a résumé and a job description and extracts the skills in each with pattern matching.",
      "A match score, a chart, a list of matching skills and a list of missing skills, exported as a PDF report.",
    ],
    numbers: [["1", "Streamlit app in a single file"], ["3", "outputs: score, matched skills, missing skills"]],
    why: "",
  },
  tcs: {
    problem: "Theory of Computation is easy to lose track of: automata, grammars and proofs spread across lecture slides and notebooks, with no single place to revise.",
    built: [
      "Six chapters of notes as plain pages, with diagrams and a worked DFA example.",
      "Four sets of previous-year question papers, so a revision session can start from a real paper.",
    ],
    numbers: [["14", "pages"], ["6", "chapters"], ["4", "previous-year papers"]],
    why: "",
  },
  holo: {
    problem: "A portfolio is the first thing a stranger sees, and a list of links is forgettable. I wanted one you navigate like a place.",
    built: [
      "A glowing rotating core for home, hexagonal data nodes for about, a 3D carousel of projects, a floating cloud of skills and interactive icons for contact.",
      "Bloom and vignette post-processing for the holographic look, with smooth camera damping between scenes.",
      "Separate camera rigs and layouts for phones and desktops, so the 3D scene works on both.",
    ],
    numbers: [["6", "sections to fly through"], ["2", "post-processing effects"], ["2", "layouts: phone and desktop"]],
    why: "",
  },
}


export interface Offer { title: string; line: string; proof: string[] }

/** What I'd build for you. Every claim points at projects that already exist, so each one is checkable. */
export const offers: Offer[] = [
  {
    title: 'Products people actually use',
    line: 'Full-stack web apps from the schema to the deploy, built for real users: attendance for a whole college, a tuition portal for parents and teachers, a techfest site that stayed up for 500+ visitors.',
    proof: ['studysync', 'choksi', 'ambiora'],
  },
  {
    title: 'Software that reads the fine print',
    line: 'Retrieval systems that cite their sources and say insufficient evidence instead of guessing, measured blind on real data before anyone is asked to trust them.',
    proof: ['kupakosh', 'niyamkosh'],
  },
  {
    title: 'Hardware that talks back',
    line: 'ESP32 sensors, MQTT and live dashboards that turn something physical happening into a decision on a screen, with simulators so it can be tested without the hardware.',
    proof: ['fire'],
  },
  {
    title: 'Interfaces that feel alive',
    line: 'Motion, 3D and typography that stay fast on a phone and degrade gracefully when they cannot keep up. You are looking at one.',
    proof: ['coding-club', 'holo'],
  },
]

export interface Testimonial { quote: string; name: string; role: string }

/**
 * Real words from real people only. The section stays hidden while this list is empty.
 * Add entries like: { quote: 'What they said, exactly.', name: 'Their name', role: 'Their role, organisation' }
 */
export const testimonials: Testimonial[] = []


export interface Certificate {
  id: string
  title: string
  issuer: string
  kind: 'Specialization' | 'Course' | 'Workshop'
  /** as printed on the certificate; empty when it does not print one */
  date: string
  /** only what the certificate itself says */
  line: string
  /** certificate image in /public/certs; absent when the PDF could not be shown whole */
  image?: string
  /** official verification link, only where it was read straight from the PDF or its file name */
  verify?: string
  courses?: { title: string; verify?: string }[]
}

const CV = 'https://coursera.org/verify/'

/** Newest first. Each image is the certificate PDF rendered as-is. */
export const certificates: Certificate[] = [
  {
    id: 'google-ai-essentials', title: 'Google AI Essentials', issuer: 'Google · Coursera', kind: 'Specialization', date: 'Jun 29, 2026',
    line: 'Five Google courses on building AI skills, using AI tools responsibly and improving productivity across a workflow.',
    image: '/certs/google-ai-essentials.webp', verify: CV + 'specialization/T59YYJDHA8U9',
    courses: [
      { title: 'Introduction to AI', verify: CV + '27YSYF7KDPXZ' },
      { title: 'Maximize Productivity With AI Tools', verify: CV + 'UJJBIAJ52C7V' },
      { title: 'Discover the Art of Prompting', verify: CV + 'H9V3XEJMVF10' },
      { title: 'Use AI Responsibly', verify: CV + 'GKYHA0SXR6MU' },
      { title: 'Stay Ahead of the AI Curve', verify: CV + 'EZC8G3PVBV5F' },
    ],
  },
  {
    id: 'ibm-data-science', title: 'What is Data Science?', issuer: 'IBM · Coursera', kind: 'Course', date: 'Jun 17, 2021',
    line: 'An online non-credit course authorized by IBM and offered through Coursera.',
    image: '/certs/ibm-what-is-data-science.webp', verify: CV + 'J7DDC8ULXYYL',
  },
  {
    id: 'python-for-everybody', title: 'Python for Everybody', issuer: 'University of Michigan · Coursera', kind: 'Specialization', date: 'Jun 12, 2021',
    line: 'Five courses: programming fundamentals, data structures, networked APIs and databases in Python, ending in a capstone that retrieves, processes and visualises data.',
    image: '/certs/python-for-everybody.webp',
    courses: [
      { title: 'Programming for Everybody (Getting Started with Python)' },
      { title: 'Python Data Structures' },
      { title: 'Using Python to Access Web Data' },
      { title: 'Using Databases with Python' },
      { title: 'Capstone: Retrieving, Processing, and Visualizing Data with Python' },
    ],
  },
  {
    id: 'google-python', title: 'Crash Course on Python', issuer: 'Google · Coursera', kind: 'Course', date: 'May 31, 2021',
    line: 'An online non-credit course authorized by Google and offered through Coursera.',
    image: '/certs/google-crash-course-python.webp',
  },
  {
    id: 'linkedin-programming', title: 'Programming Foundations: Fundamentals', issuer: 'LinkedIn Learning', kind: 'Course', date: 'May 22, 2021',
    line: 'A two-hour LinkedIn Learning course, completed on May 22, 2021.',
  },
  {
    id: 'learnbay-data-science', title: '5-day workshop on Data Science', issuer: 'Learnbay', kind: 'Workshop', date: 'May 17 to 21, 2021',
    line: 'A certificate of participation for a five-day Data Science workshop held by Learnbay.',
    image: '/certs/learnbay-data-science-workshop.webp',
  },
  {
    id: 'google-cloud-identity', title: 'Introduction to Cloud Identity', issuer: 'Google Cloud · Coursera', kind: 'Course', date: 'May 13, 2021',
    line: 'An online non-credit course authorized by Google Cloud and offered through Coursera.',
    image: '/certs/google-cloud-identity.webp',
  },
  {
    id: 'microsoft-learn-git', title: 'Introduction to Open-Source Development using Git and GitHub', issuer: 'Microsoft Learn Student Ambassadors', kind: 'Workshop', date: '',
    line: 'Recognition of attendance and completion of the Microsoft Student Ambassador workshop on open-source development with Git and GitHub.',
    image: '/certs/microsoft-learn-git-github.webp',
  },
]

export interface NowItem { title: string; line: string; proof?: string[] }

/**
 * What I'm focused on right now. Edit this list once a month and bump `nowUpdated`, so a stale list is visible.
 * Everything here is something that is actually true today.
 */
export const nowUpdated = '2026-10'
export const nowItems: NowItem[] = [
  { title: 'Leading the Coding Club', line: 'Running events, contests and the club platform at NMIMS Shirpur as President.', proof: ['coding-club'] },
  { title: 'Ambiora 2027', line: 'Vice President of Ambiora, the NMIMS inter-campus techfest, planned for around 1,000 participants.', proof: ['ambiora'] },
  { title: 'Smart India Hackathon 2026', line: 'Kupakosh for Oil India and NiyamKosh for BIS, leading the team through measured, honest retrieval systems.', proof: ['kupakosh', 'niyamkosh'] },
  { title: 'Keeping StudySync alive', line: 'A live platform used by real students, so attendance sync and the mentor system keep getting small fixes.', proof: ['studysync'] },
  { title: 'Looking for what is next', line: 'Internships and freelance work in full-stack web, IoT and retrieval systems.' },
]

export const logbook = [
  { role: 'Vice President', org: 'Ambiora 2027 · NMIMS inter-campus techfest', when: 'Now', now: true, points: ['Co-leading the 2027 edition of the techfest, planned as an inter-campus event for around 1,000 participants.'] },
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
