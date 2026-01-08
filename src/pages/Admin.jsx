import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'
import { useAdminAuth } from '../context/AdminAuth'
import { 
  Container, Title, Card, Table, Stack, Box, Badge, 
  Tabs, NumberInput, SegmentedControl, Text
} from '@mantine/core'

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
  { key: 'sacks', label: 'Sacks' },
  { key: 'def_turnovers', label: 'Def TO' },
  { key: 'safety', label: 'Safety' },
  { key: 'points_allowed', label: 'PA' },
  { key: 'fg_yards', label: 'FG Yds' },
]

export default function Admin() {
  const [week, setWeek] = useState('wildcard')
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(null)
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
    catches,
    pass_yards,
    rush_rec_yards,
    tds,
    turnovers,
    two_pt,
    misc_td,
    return_yards,
    sacks,
    def_turnovers,
    safety,
    points_allowed,
    fg_yards,
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
    <Box bg="gray.1" mih="100vh">
      <Container size="100%" p="md" style={{ maxWidth: '100%' }}>
        <Card shadow="sm" radius="md" withBorder mb="md">
          <Tabs defaultValue="admin" variant="pills">
            <Tabs.List mb="md">
              <Tabs.Tab value="admin" fz="lg" fw={600}>Admin Scoring</Tabs.Tab>
              <Tabs.Tab value="leaderboard" fz="lg" fw={600} onClick={() => nav('/leaderboard')}>Leaderboard</Tabs.Tab>
              <Tabs.Tab value="signup" fz="lg" fw={600} onClick={() => nav('/signup')}>Signup</Tabs.Tab>
              <Tabs.Tab value="help" fz="lg" fw={600} onClick={() => nav('/help')}>Help / Rules</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Card>

        <Stack gap="md">
          <Title order={1} size="h2">Player Scoring</Title>

          <SegmentedControl
            value={week}
            onChange={setWeek}
            data={WEEKS.map(w => ({ value: w.key, label: w.label }))}
            fullWidth
          />

          <Card shadow="sm" radius="md" withBorder p="md">
            <Box style={{ overflowX: 'auto' }}>
              <Table highlightOnHover striped withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Player</Table.Th>
                    <Table.Th>Team</Table.Th>
                    {STAT_FIELDS.map(f => (
                      <Table.Th key={f.key} style={{ textAlign: 'center', minWidth: 80 }}>
                        {f.label}
                      </Table.Th>
                    ))}
                    <Table.Th style={{ textAlign: 'center' }}>Score</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {rows.map(r => {
                    const score = calculateScore(r)

                    return (
                      <Table.Tr key={r.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>{r.players?.name}</Text>
                          <Text size="xs" c="dimmed">{r.players?.position}</Text>
                        </Table.Td>

                        <Table.Td>
                          <Text size="sm" c="dimmed">{r.players?.teams?.name}</Text>
                        </Table.Td>

                        {STAT_FIELDS.map(f => (
                          <Table.Td key={f.key} style={{ textAlign: 'center' }}>
                            <NumberInput
                              value={r[f.key] ?? 0}
                              onChange={val => updateStat(r.id, f.key, val)}
                              size="xs"
                              style={{ width: 70 }}
                              hideControls
                              styles={{
                                input: { textAlign: 'center' }
                              }}
                            />
                          </Table.Td>
                        ))}

                        <Table.Td style={{ textAlign: 'center' }}>
                          <Badge size="lg" variant="filled" color="blue">
                            {score.toFixed(1)}
                          </Badge>
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
