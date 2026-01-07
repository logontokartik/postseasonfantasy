
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { SLOTS } from '../data/positions'
import { validateRoster } from '../utils/validatePicks'
import { useNavigate } from 'react-router-dom'

export default function Signup(){
  const [name,setName]=useState('')
  const [teams,setTeams]=useState([])
  const [players,setPlayers]=useState([])
  const [slot,setSlot]=useState(SLOTS[0].key)
  const [picks,setPicks]=useState({})
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const nav=useNavigate()

  const slotCfg = useMemo(() => SLOTS.find(s => s.key === slot), [slot])
  const pickedTeamIds = useMemo(() => new Set(Object.values(picks).map(p => p.team_id)), [picks])

  useEffect(()=>{
    (async () => {
      setLoading(true)
      const t = await supabase.from('teams').select('*').order('seed', { ascending: true })
      const p = await supabase.from('players').select('*').order('position', { ascending: true })
      setTeams(t.data || [])
      setPlayers(p.data || [])
      setLoading(false)
    })()
  },[])

  function pickPlayer(p){
    setError('')
    const updated = { ...picks }
    // If team already picked, allow "change slot": remove previous slot
    const existingSlot = Object.keys(updated).find(k => updated[k]?.team_id === p.team_id)
    if (existingSlot) delete updated[existingSlot]
    updated[slot] = p
    setPicks(updated)
  }

  async function submit(){
    setError('')
    if (!name.trim()) { setError('Please enter your name'); return }
    const err = validateRoster(picks)
    if(err){ setError(err); return }

    setSaving(true)
    try{
      const {data:user, error:e1} = await supabase.from('users').insert({ name: name.trim() }).select().single()
      if (e1) throw e1

      const rows = SLOTS.map(s => ({
        user_id: user.id,
        slot: s.key,
        player_id: picks[s.key].id,
        team_id: picks[s.key].team_id
      }))
      const { error:e2 } = await supabase.from('user_picks').insert(rows)
      if (e2) throw e2

      nav('/leaderboard')
    }catch(e){
      setError(e?.message || 'Signup failed. Check Supabase permissions/keys.')
    }finally{
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">NFL Playoff Pool</h1>
            <p className="text-sm text-gray-600 mt-1">
              Pick 14 slots with <span className="font-semibold">one player per team</span>. Re-clicking a team moves that team’s pick to the currently selected slot.
            </p>
          </div>
          <a className="text-sm underline text-blue-700" href="/leaderboard">View Leaderboard</a>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Your Name</label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={e=>setName(e.target.value)}
                  placeholder="e.g., Kartik"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Select Slot</label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={slot}
                  onChange={e=>setSlot(e.target.value)}
                >
                  {SLOTS.map(s => <option key={s.key} value={s.key}>{s.key}</option>)}
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  Allowed: {slotCfg.allowed.join(', ')}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-5 text-gray-600">Loading teams…</div>
            ) : (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {teams.map(t => {
                  const teamPicked = pickedTeamIds.has(t.id)
                  const eligible = players.filter(p => p.team_id === t.id && slotCfg.allowed.includes(p.position))
                  return (
                    <div key={t.id} className={`rounded-2xl p-3 border ${teamPicked ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{t.seed ? `#${t.seed} ` : ''}{t.name}</div>
                        {teamPicked && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Picked</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {eligible.length === 0 ? (
                          <span className="text-xs text-gray-500">No eligible players for this slot.</span>
                        ) : eligible.map(p => {
                          const isSelectedInSlot = picks[slot]?.id === p.id
                          return (
                            <button
                              key={p.id}
                              onClick={() => pickPlayer(p)}
                              className={`px-3 py-2 rounded-xl text-sm border transition ${
                                isSelectedInSlot ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50 border-gray-200'
                              }`}
                              title="Click to assign to current slot"
                            >
                              {p.name} <span className="text-xs opacity-70">({p.position})</span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Tip: team already picked? Click again to move that team’s player to the selected slot.
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={submit}
              disabled={saving}
              className="mt-5 w-full rounded-xl bg-blue-600 text-white font-semibold py-3 disabled:opacity-60"
            >
              {saving ? 'Submitting…' : 'Submit (Lock Picks)'}
            </button>

            <div className="mt-2 text-xs text-gray-500">
              Note: This app assumes your Supabase has teams/players seeded and RLS allows inserts for `users` and `user_picks`.
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Your Selections</h2>
              <span className="text-xs text-gray-500">{Object.keys(picks).length}/14</span>
            </div>
            <div className="mt-3 space-y-2">
              {SLOTS.map(s => (
                <div key={s.key} className={`flex items-center justify-between rounded-xl px-3 py-2 border ${slot === s.key ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <div className="text-sm font-semibold">{s.key}</div>
                  <div className="text-sm text-gray-700 truncate max-w-[180px] text-right">
                    {picks[s.key]?.name || <span className="text-gray-400">—</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Change slot, then click a player to place/move them.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
