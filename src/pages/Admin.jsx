import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'
import { useAdminAuth } from '../context/AdminAuth'

const WEEKS = [
  { key: 'wildcard', label: 'Wild Card' },
  { key: 'divisional', label: 'Divisional' },
  { key: 'conference', label: 'Conference' },
  { key: 'superbowl', label: 'Super Bowl' },
]

const STAT_FIELDS = [
  { key: 'catches', label: 'Catches' },
  { key: 'pass_yards', label: 'Pass Yds' },
  { key: 'rush_rec_yards', label: 'Rush/Rec Yds' },
  { key: 'tds', label: 'TDs' },
  { key: 'turnovers', label: 'TO' },
  { key: 'two_pt', label: '2PT' },
  { key: 'misc_td', label: 'Misc TD' },
  { key: 'return_yards', label: 'Return Yds' },
]

export default function Admin() {
  const [week, setWeek] = useState('wildcard')
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    load()
  }, [week])

  async function load() {
    const res = await supabase
  .from('player_stats')
  .select(`
    id,
    week,
    catches,
    pass_yards,
    rush_rec_yards,
    tds,
    turnovers,
    two_pt,
    misc_td,
    return_yards,
    players (
      name,
      position,
      teams (
        name
      )
    )
  `)
  .eq('week', week)
  .order('players(name)', { ascending: true })
    setRows(res.data || [])
  }

  async function updateStat(id, field, value) {
    setSaving(id + field)

    await supabase
      .from('player_stats')
      .update({ [field]: Number(value) })
      .eq('id', id)

    setRows(r =>
      r.map(row =>
        row.id === id ? { ...row, [field]: Number(value) } : row
      )
    )

    setSaving(null)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin Scoring</h1>
        <Link to="/leaderboard" className="text-blue-600 underline">
          Leaderboard
        </Link>
      </div>

      {/* WEEK SELECTOR */}
      <div className="mb-4">
        <select
          value={week}
          onChange={e => setWeek(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {WEEKS.map(w => (
            <option key={w.key} value={w.key}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-2 text-left">Player</th>
              <th className="p-2 text-left">Team</th>
              {STAT_FIELDS.map(f => (
                <th key={f.key} className="p-2 text-center">
                  {f.label}
                </th>
              ))}
              <th className="p-2 text-center font-bold">Score</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(r => {
              const score = calculateScore(r)

              return (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 font-medium">
                    {r.players?.name}
                    <div className="text-xs text-gray-500">
                      {r.players?.position}
                    </div>
                  </td>

                  <td className="p-2 text-gray-600">
                    {r.players?.teams?.name}
                  </td>

                  {STAT_FIELDS.map(f => (
                    <td key={f.key} className="p-1 text-center">
                      <input
                        type="number"
                        value={r[f.key]}
                        onChange={e =>
                          updateStat(r.id, f.key, e.target.value)
                        }
                        className="w-20 border rounded px-2 py-1 text-center"
                      />
                    </td>
                  ))}

                  <td className="p-2 text-center font-bold">
                    {score.toFixed(1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
