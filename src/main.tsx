import '@fontsource-variable/roboto-flex/full.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource-variable/jetbrains-mono'
import './styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { NotFound } from './components/NotFound'
import { startWorld } from './world'
import { initAnalytics } from './analytics'

// the site lives at the root; any other path is a wrong turn (hash links like #/dive/... still belong to the site)
const lost = !/^\/(index\.html)?$/.test(location.pathname)

if (!lost) startWorld()
initAnalytics()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {lost ? <NotFound /> : <App />}
  </StrictMode>,
)
