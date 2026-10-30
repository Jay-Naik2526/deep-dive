# Deep Dive

Jay Naik's portfolio, built as a dive: the page is a body of water, and the deeper you scroll the darker and stranger it gets. Projects live at different depths, skills sit on a sonar, and GitHub activity glows as plankton.

**Live:** [jaynaik.tech](https://jaynaik.tech)

## Stack

React 19 · TypeScript · Vite · Three.js (React Three Fiber) · Motion · Lenis

- Real-time water shader (caustics, ripples, depth tint, bioluminescence), jellyfish and whales, all in WebGL
- Variable-font letters that bend under the cursor
- Case-study overlays, a command palette (`⌘K`), free-dive (hold `Space`), a day and night mode, and a secret at the bottom
- Procedural ambient sound with the Web Audio API, no audio files
- Contribution grid drawn on a single canvas from real GitHub data
- Falls back to a CSS background when WebGL isn't available (or with `?lite`)

## Run it

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run build` | Type-check and build to `dist/` |
| `npm test` | Type-check and run the data and asset tests |
| `npm run check:links` | Ping every external link on the site |
| `npm run sync:contrib` | Refresh the GitHub contribution snapshot (needs the GitHub CLI) |

## Structure

```
src/
  components/   sections, the 3D scene, HUD, overlays
  data.ts       projects, skills, timeline: edit content here
  data/         contribution snapshot (refreshed weekly by a workflow)
  world.ts      shared frame state for the DOM and the WebGL scene
  audio.ts      procedural sound
public/img/     project screenshots (WebP)
scripts/        contribution sync and link checker
tests/          data and asset integrity tests
```

To add or edit a project, change `src/data.ts` and drop its screenshot in `public/img/`; `npm test` checks that nothing is missing.
