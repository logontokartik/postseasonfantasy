import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'

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

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    const ures = await supabase.from('users').select('id,name')
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

  const weekTotal = week =>
    rows.reduce((s, r) => {
      const ps = r.stats.find(x => x.week === week)
      return s + (ps ? calculateScore(ps) : 0)
    }, 0)

  return (
    <div className="w-full px-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>

      <div className="grid grid-cols-5 gap-4">
        {/* LEADERBOARD */}
        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="font-bold mb-2">Leaderboard</h2>
          {users.map((u, i) => (
            <button
              key={u.id}
              onClick={() => selectUser(u)}
              className={`w-full text-left py-2 ${
                selected?.id === u.id ? 'font-bold' : ''
              }`}
            >
              #{i + 1} {u.name}
              <span className="float-right">{u.total.toFixed(1)}</span>
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
    </div>
  )
}
