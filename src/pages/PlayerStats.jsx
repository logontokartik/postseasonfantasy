import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'
import { 
  Container, Title, Card, Table, Stack, Box, Badge, 
  Tabs, SegmentedControl, Text, Group
} from '@mantine/core'

const WEEKS = [
  { key: 'wildcard', label: 'Wild Card' },
  { key: 'divisional', label: 'Divisional' },
  { key: 'conference', label: 'Conference' },
  { key: 'superbowl', label: 'Super Bowl' },
]

const STAT_FIELDS = [
  { key: 'catches_sacks', label: 'CTCH/SCK/XP/DFP' },
  { key: 'pass_yards', label: 'PSS' },
  { key: 'rush_rec_fg_yards', label: 'RSH/REC/FG Yds' },
  { key: 'tds', label: 'TD' },
  { key: 'turnovers', label: 'INT+FL' },
  { key: 'two_pt', label: '2PT' },
  { key: 'def_turnovers_misc', label: 'INT+FF+SFTY+XP RTN+BF' },
  { key: 'return_yards', label: 'RTN YDS' },
]

const WEEK_ORDER = ['wildcard', 'divisional', 'conference', 'superbowl']

export default function PlayerStats() {
  const [week, setWeek] = useState('wildcard')
  const [rows, setRows] = useState([])
  const [sortBy, setSortBy] = useState('team')
  const [sortDir, setSortDir] = useState('asc')
  const nav = useNavigate()

  useEffect(() => {
    load()
  }, [week])

  async function load() {
    const res = await supabase
      .from('player_stats')
      .select(`
        id,
        week,
        catches_sacks,
        pass_yards,
        rush_rec_fg_yards,
        tds,
        turnovers,
        two_pt,
        def_turnovers_misc,
        return_yards,
        player_id,
        players(
          name,
          position,
          team_id,
          teams(name, seed, eliminated_week)
        )
      `)
      .eq('week', week)
    
    sortRows(res.data || [])
  }

  function isPlayerEliminated(row) {
    const eliminatedWeek = row.players?.teams?.eliminated_week
    if (!eliminatedWeek) return false
    return WEEK_ORDER.indexOf(week) > WEEK_ORDER.indexOf(eliminatedWeek)
  }

  function sortRows(data) {
    const positionOrder = { QB: 1, RB: 2, WR: 3, TE: 4, K: 5, DEF: 6 }
    
    const sorted = [...data].sort((a, b) => {
      let compareA, compareB
      
      if (sortBy === 'player') {
        compareA = a.players?.name || ''
        compareB = b.players?.name || ''
      } else if (sortBy === 'position') {
        compareA = positionOrder[a.players?.position] || 99
        compareB = positionOrder[b.players?.position] || 99
      } else if (sortBy === 'score') {
        compareA = calculateScore(a)
        compareB = calculateScore(b)
      } else {
        compareA = a.players?.teams?.name || ''
        compareB = b.players?.teams?.name || ''
      }
      
      const direction = sortDir === 'asc' ? 1 : -1
      
      if (typeof compareA === 'string') {
        return compareA.localeCompare(compareB) * direction
      } else {
        return (compareA - compareB) * direction
      }
    })
    
    setRows(sorted)
  }

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  useEffect(() => {
    if (rows.length > 0) {
      sortRows(rows)
    }
  }, [sortBy, sortDir])

  return (
    <Box bg="gray.1" mih="100vh">
      <Container size="100%" p="md" style={{ maxWidth: '100%' }}>
        <Card shadow="sm" radius="md" withBorder mb="md">
          <Tabs defaultValue="stats" variant="pills">
            <Tabs.List mb="md">
              <Tabs.Tab value="stats" fz="lg" fw={600}>Player Stats</Tabs.Tab>
              <Tabs.Tab value="leaderboard" fz="lg" fw={600} onClick={() => nav('/leaderboard')}>Leaderboard</Tabs.Tab>
              <Tabs.Tab value="signup" fz="lg" fw={600} onClick={() => nav('/signup')}>Signup</Tabs.Tab>
              <Tabs.Tab value="help" fz="lg" fw={600} onClick={() => nav('/help')}>Help / Rules</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Card>

        <Stack gap="md">
          <Title order={1} size="h2">Player Stats</Title>

          <Group justify="space-between">
            <SegmentedControl
              value={week}
              onChange={setWeek}
              data={WEEKS.map(w => ({ value: w.key, label: w.label }))}
              style={{ flex: 1 }}
            />
          </Group>

          <Card shadow="sm" radius="md" withBorder p="md">
            <Box style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh' }}>
              <Table striped highlightOnHover>
                <Table.Thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                  <Table.Tr>
                    <Table.Th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('player')}
                    >
                      <Group gap="xs">
                        <Text>Player</Text>
                        {sortBy === 'player' && <Text size="xs">{sortDir === 'asc' ? '↑' : '↓'}</Text>}
                      </Group>
                    </Table.Th>
                    <Table.Th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('team')}
                    >
                      <Group gap="xs">
                        <Text>Team</Text>
                        {sortBy === 'team' && <Text size="xs">{sortDir === 'asc' ? '↑' : '↓'}</Text>}
                      </Group>
                    </Table.Th>
                    <Table.Th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('position')}
                    >
                      <Group gap="xs">
                        <Text>Pos</Text>
                        {sortBy === 'position' && <Text size="xs">{sortDir === 'asc' ? '↑' : '↓'}</Text>}
                      </Group>
                    </Table.Th>
                    {STAT_FIELDS.map(f => (
                      <Table.Th key={f.key} style={{ textAlign: 'center', minWidth: 80 }}>
                        {f.label}
                      </Table.Th>
                    ))}
                    <Table.Th 
                      style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('score')}
                    >
                      <Group gap="xs" justify="center">
                        <Text>Score</Text>
                        {sortBy === 'score' && <Text size="xs">{sortDir === 'asc' ? '↑' : '↓'}</Text>}
                      </Group>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {rows.map((r) => {
                    const score = calculateScore(r)
                    const eliminated = isPlayerEliminated(r)

                    return (
                      <Table.Tr 
                        key={r.id}
                        style={{ 
                          backgroundColor: eliminated ? '#fff0f0' : undefined,
                          opacity: eliminated ? 0.7 : 1
                        }}
                      >
                        <Table.Td>
                          <Text 
                            size="sm" 
                            fw={500} 
                            style={{ textDecoration: eliminated ? 'line-through' : 'none' }}
                          >
                            {r.players?.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Text size="sm">{r.players?.teams?.name}</Text>
                            {eliminated && <Badge size="xs" color="red">OUT</Badge>}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="sm" variant="light">{r.players?.position}</Badge>
                        </Table.Td>

                        {STAT_FIELDS.map(f => (
                          <Table.Td key={f.key} style={{ textAlign: 'center' }}>
                            <Text size="sm">{r[f.key] || 0}</Text>
                          </Table.Td>
                        ))}

                        <Table.Td style={{ textAlign: 'center' }}>
                          <Badge color={eliminated ? 'gray' : 'blue'}>{score.toFixed(2)}</Badge>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Box>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
