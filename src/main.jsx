import './theme.css'
import { createRoot } from 'react-dom/client'
import App from './app.jsx'
import { tokens } from './connectors/tokens.js'
import { LANDING_PATH, landingApplies, requestedStart } from './landing.js'

// A visitor with no session, arriving at the root of the web build, belongs on
// the landing page — see src/landing.js. Decided before React renders so the
// splash never flashes on its way out.
const visitor =
  landingApplies() &&
  window.location.pathname === '/' &&
  !requestedStart() &&
  !tokens.getAccess() &&
  !tokens.getRefresh()

if (visitor) {
  window.location.replace(LANDING_PATH)
} else {
  createRoot(document.getElementById('root')).render(<App />)
}
