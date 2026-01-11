import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'
import { 
  Container, Title, Card, Table, Stack, Box, Badge, 
  Tabs, Text, Group, Button, Collapse, Select
} from '@mantine/core'

const WEEKS = ['wildcard', 'divisional', 'conference', 'superbowl']
const WEEK_LABELS = {
  wildcard: 'Wild Card',
  divisional: 'Divisional',
  conference: 'Conference',
  superbowl: 'Super Bowl'
}

export default function TeamManagement() {
  const [teams, setTeams] = useState([])
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [playerStats, setPlayerStats] = useState({})
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    loadTeams()
  }, [])

  async function loadTeams() {
    setLoading(true)
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('seed', { ascending: true })
    setTeams(data || [])
    setLoading(false)
  }

  async function loadTeamPlayers(teamId) {
    // Get players for this team
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('position')

    setPlayers(playersData || [])

    // Get stats for all players across all weeks
    const playerIds = (playersData || []).map(p => p.id)
    if (playerIds.length > 0) {
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*')
        .in('player_id', playerIds)

      // Organize stats by player and week
      const statsMap = {}
      ;(statsData || []).forEach(stat => {
        if (!statsMap[stat.player_id]) {
          statsMap[stat.player_id] = {}
        }
        statsMap[stat.player_id][stat.week] = stat
      })
      setPlayerStats(statsMap)
    }
  }

  async function toggleTeamExpand(team) {
    if (expandedTeam === team.id) {
      setExpandedTeam(null)
      setPlayers([])
    } else {
      setExpandedTeam(team.id)
      await loadTeamPlayers(team.id)
    }
  }

  async function eliminateTeam(teamId, week) {
    await supabase
      .from('teams')
      .update({ eliminated_week: week })
      .eq('id', teamId)
    
    // Refresh teams
    loadTeams()
  }

  async function restoreTeam(teamId) {
    await supabase
      .from('teams')
      .update({ eliminated_week: null })
      .eq('id', teamId)
    
    loadTeams()
  }

  function getWeekScore(playerId, week) {
    const stat = playerStats[playerId]?.[week]
    return stat ? calculateScore(stat) : 0
  }

  return (
    <Box bg="gray.1" mih="100vh">
      <Container size="lg" p="md">
        <Card shadow="sm" radius="md" withBorder mb="md">
          <Tabs defaultValue="teams" variant="pills">
            <Tabs.List mb="md">
              <Tabs.Tab value="teams" fz="lg" fw={600}>Team Management</Tabs.Tab>
              <Tabs.Tab value="admin" fz="lg" fw={600} onClick={() => nav('/admin')}>Admin Scoring</Tabs.Tab>
              <Tabs.Tab value="leaderboard" fz="lg" fw={600} onClick={() => nav('/leaderboard')}>Leaderboard</Tabs.Tab>
              <Tabs.Tab value="stats" fz="lg" fw={600} onClick={() => nav('/stats')}>Player Stats</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Card>

        <Stack gap="md">
          <Title order={1} size="h2">Playoff Teams</Title>

          {loading ? (
            <Text>Loading teams...</Text>
          ) : (
            <Stack gap="sm">
              {teams.map(team => (
                <Card 
                  key={team.id} 
                  shadow="sm" 
                  radius="md" 
                  withBorder 
                  p="md"
                  style={{ 
                    opacity: team.eliminated_week ? 0.6 : 1,
                    backgroundColor: team.eliminated_week ? '#fff5f5' : 'white'
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group 
                      gap="md" 
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => toggleTeamExpand(team)}
                    >
                      <Badge size="lg" variant="filled" color={team.eliminated_week ? 'red' : 'blue'}>
                        #{team.seed}
                      </Badge>
                      <Text size="lg" fw={600} style={{ textDecoration: team.eliminated_week ? 'line-through' : 'none' }}>
                        {team.name}
                      </Text>
                      {team.eliminated_week && (
                        <Badge color="red" variant="light">
                          Out after {WEEK_LABELS[team.eliminated_week]}
                        </Badge>
                      )}
                      <Text size="sm" c="dimmed">
                        {expandedTeam === team.id ? '▼' : '▶'} Click to view players
                      </Text>
                    </Group>

                    <Group gap="xs">
                      {team.eliminated_week ? (
                        <Button 
                          size="sm" 
                          color="green" 
                          variant="light"
                          onClick={(e) => { e.stopPropagation(); restoreTeam(team.id) }}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Select
                          size="sm"
                          placeholder="Eliminate after..."
                          data={WEEKS.map(w => ({ value: w, label: WEEK_LABELS[w] }))}
                          onChange={(value) => value && eliminateTeam(team.id, value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 180 }}
                        />
                      )}
                    </Group>
                  </Group>

                  <Collapse in={expandedTeam === team.id}>
                    <Box mt="md">
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Player</Table.Th>
                            <Table.Th>Pos</Table.Th>
                            {WEEKS.map(w => (
                              <Table.Th key={w} style={{ textAlign: 'center' }}>
                                {WEEK_LABELS[w]}
                              </Table.Th>
                            ))}
                            <Table.Th style={{ textAlign: 'center' }}>Total</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {players.map(player => {
                            const total = WEEKS.reduce((sum, w) => sum + getWeekScore(player.id, w), 0)
                            return (
                              <Table.Tr key={player.id}>
                                <Table.Td>
                                  <Text fw={500}>{player.name}</Text>
                                </Table.Td>
                                <Table.Td>
                                  <Badge size="sm" variant="light">{player.position}</Badge>
                                </Table.Td>
                                {WEEKS.map(w => {
                                  const score = getWeekScore(player.id, w)
                                  const isEliminated = team.eliminated_week && 
                                    WEEKS.indexOf(w) > WEEKS.indexOf(team.eliminated_week)
                                  return (
                                    <Table.Td 
                                      key={w} 
                                      style={{ 
                                        textAlign: 'center',
                                        backgroundColor: isEliminated ? '#ffe0e0' : undefined
                                      }}
                                    >
                                      <Text size="sm" c={isEliminated ? 'dimmed' : undefined}>
                                        {score.toFixed(2)}
                                      </Text>
                                    </Table.Td>
                                  )
                                })}
                                <Table.Td style={{ textAlign: 'center' }}>
                                  <Badge color="blue">{total.toFixed(2)}</Badge>
                                </Table.Td>
                              </Table.Tr>
                            )
                          })}
                        </Table.Tbody>
                      </Table>
                    </Box>
                  </Collapse>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
