import { Routes, Route } from 'react-router-dom'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import Signup from './pages/Signup'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Leaderboard />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <Admin />
          </ProtectedAdminRoute>
        }
      />
    </Routes>
  )
}
