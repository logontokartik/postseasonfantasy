import { Routes, Route, Navigate } from 'react-router-dom'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import Signup from './pages/Signup'
import Help from './pages/Help'
import PlayerStats from './pages/PlayerStats'
import TeamManagement from './pages/TeamManagement'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/help" element={<Help />} />
      <Route path="/stats" element={<PlayerStats />} />
      <Route
        path="/teams"
        element={
          <ProtectedAdminRoute>
            <TeamManagement />
          </ProtectedAdminRoute>
        }
      />
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
