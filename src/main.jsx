import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import './styles/components.css'
import './styles/portfolio.css'
import './styles/projects.css'
import './styles/skills.css'
import './styles/about.css'
import './styles/contact.css'
import './styles/motion.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
