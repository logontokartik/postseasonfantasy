
import { Routes, Route } from 'react-router-dom'
import Signup from './pages/Signup'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'

export default function App(){
  return (
    <Routes>
      <Route path='/' element={<Signup/>}/>
      <Route path='/leaderboard' element={<Leaderboard/>}/>
      <Route path='/admin' element={<Admin/>}/>
    </Routes>
  )
}
