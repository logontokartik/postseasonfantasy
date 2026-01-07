
import { SLOTS } from '../data/positions'
export function validateRoster(picks){
  for(const s of SLOTS){ if(!picks[s.key]) return `Missing ${s.key}` }
  const teams = Object.values(picks).map(p=>p.team_id)
  if(new Set(teams).size !== teams.length) return 'Only one player per team'
  return null
}
