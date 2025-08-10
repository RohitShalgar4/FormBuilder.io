import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('🚀 Application starting...')
console.log('🌐 Current URL:', window.location.href)
console.log('🔧 Environment:', process.env.NODE_ENV)

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('✅ React app rendered successfully')
} catch (error) {
  console.error('❌ Failed to render React app:', error)
}