import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'
import LoadingSpinner from '../components/LoadingSpinner'

const WEEKS = [
  { key: 'wildcard', label: 'Wild Card' },
  { key: 'divisional', label: 'Divisional' },
  { key: 'conference', label: 'Conference' },
  { key: 'superbowl', label: 'Super Bowl' },
]

export default function Leaderboard() {
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    setLoading(true)
    const ures = await supabase.from('users').select('id,name,is_locked')
    const list = ures.data || []

    const ranked = []
    for (const u of list) {
      const stats = await supabase
        .from('player_stats')
        .select('*')
        .in(
          'player_id',
          (
            await supabase
              .from('user_picks')
              .select('player_id')
              .eq('user_id', u.id)
          ).data.map(p => p.player_id)
        )

      const total = (stats.data || []).reduce(
        (s, ps) => s + calculateScore(ps),
        0
      )

      ranked.push({ ...u, total })
    }

    ranked.sort((a, b) => b.total - a.total)
    setUsers(ranked)
    setLoading(false)
  }

  async function selectUser(u) {
    setSelected(u)

    const picks = await supabase
      .from('user_picks')
      .select('slot, player_id, players(name), teams(name)')
      .eq('user_id', u.id)

    const stats = await supabase
      .from('player_stats')
      .select('*')
      .in('player_id', picks.data.map(p => p.player_id))

    const merged = picks.data.map(p => ({
      ...p,
      stats: stats.data.filter(s => s.player_id === p.player_id),
    }))

    setRows(merged)
  }

  async function deleteUser(e, u) {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete ${u.name}? This cannot be undone.`)) return

    // Delete picks first (cascade usually handles this but being safe)
    await supabase.from('user_picks').delete().eq('user_id', u.id)
    // Delete user
    await supabase.from('users').delete().eq('id', u.id)

    setUsers(users.filter(x => x.id !== u.id))
    if (selected?.id === u.id) {
      setSelected(null)
      setRows([])
    }
  }

  async function setGlobalLock(locked) {
    if (!confirm(`Are you sure you want to ${locked ? 'LOCK' : 'UNLOCK'} ALL picks?`)) return
    setLoading(true)
    
    // Using a filter that matches everything to allow "bulk" update if RLS permits
    // Assuming UUIDs, neq 000... is a safe "all" filter
    const { error } = await supabase
      .from('users')
      .update({ is_locked: locked })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!error) {
      setUsers(users.map(u => ({ ...u, is_locked: locked })))
    } else {
      alert('Error updating locks: ' + error.message)
    }
    setLoading(false)
  }

  const weekTotal = week =>
    rows.reduce((s, r) => {
      const ps = r.stats.find(x => x.week === week)
      return s + (ps ? calculateScore(ps) : 0)
    }, 0)

  return (
    <div className="w-full px-6 bg-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className="flex gap-4">
          <div className="flex gap-2 mr-4">
            <button 
              onClick={() => setGlobalLock(true)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200"
            >
              Lock All
            </button>
            <button 
              onClick={() => setGlobalLock(false)}
              className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200"
            >
              Unlock All
            </button>
          </div>
          <Link to="/signup" className="text-blue-600 underline">
            Join Pool
          </Link>
          <Link to="/admin" className="text-gray-500 underline text-sm">
            Admin
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-5 gap-4">
        {/* LEADERBOARD */}
        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="font-bold mb-2">Leaderboard</h2>
          {users.map((u, i) => (
            <button
              key={u.id}
              onClick={() => selectUser(u)}
              className={`w-full text-left py-2 flex justify-between items-center group ${
                selected?.id === u.id ? 'font-bold' : ''
              }`}
            >
              <span>#{i + 1} {u.name}</span>
              <div className="flex items-center gap-3">
                <span>{u.total.toFixed(1)}</span>
                {u.is_locked && <span title="Locked">🔒</span>}
                <span
                  onClick={(e) => deleteUser(e, u)}
                  className="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition"
                  title="Delete User"
                >
                  🗑️
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* WEEK COLUMNS */}
        {WEEKS.map(w => (
          <div key={w.key} className="bg-white rounded-xl p-4 shadow">
            <div className="font-bold mb-2 flex justify-between">
              <span>{w.label}</span>
              <span>{weekTotal(w.key).toFixed(1)}</span>
            </div>

            {rows.map(r => {
              const ps = r.stats.find(x => x.week === w.key)
              const score = ps ? calculateScore(ps) : 0

              return (
                <div
                  key={r.slot + w.key}
                  className="flex justify-between text-sm py-1"
                >
                  <div>
                    {r.players.name}
                    <div className="text-xs text-gray-500">
                      {r.teams.name}
                    </div>
                  </div>
                  <div>{score.toFixed(1)}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
