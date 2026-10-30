import '@fontsource-variable/roboto-flex/full.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource-variable/jetbrains-mono'
import './styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { startWorld } from './world'

startWorld()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
