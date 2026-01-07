
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import { AdminAuthProvider } from './context/AdminAuth'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AdminAuthProvider>
      <App />
    </AdminAuthProvider>
  </BrowserRouter>
)
