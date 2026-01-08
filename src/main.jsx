import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import App from './App'
import './styles.css'
import '@mantine/core/styles.css'
import { AdminAuthProvider } from './context/AdminAuth'

ReactDOM.createRoot(document.getElementById('root')).render(
  <MantineProvider>
    <BrowserRouter>
      <AdminAuthProvider>
        <App />
      </AdminAuthProvider>
    </BrowserRouter>
  </MantineProvider>
)
