import { createContext, useContext, useState } from 'react'

const AdminAuthContext = createContext()

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem('isAdmin') === 'true'
  )

  function login(username, password) {
    if (
      username === import.meta.env.VITE_ADMIN_USERNAME &&
      password === import.meta.env.VITE_ADMIN_PASSWORD
    ) {
      setIsAdmin(true)
      localStorage.setItem('isAdmin', 'true')
      return true
    }
    return false
  }

  function logout() {
    setIsAdmin(false)
    localStorage.removeItem('isAdmin')
  }

  return (
    <AdminAuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
