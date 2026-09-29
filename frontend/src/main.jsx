import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SandboxApp from './sandbox/SandboxApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SandboxApp />
  </StrictMode>,
)
