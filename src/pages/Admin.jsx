import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'
import { useAdminAuth } from '../context/AdminAuth'
import { 
  Container, Title, Card, Table, Stack, Box, Badge, 
  Tabs, NumberInput, SegmentedControl, Text, Button, Group
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
  const [modifiedRows, setModifiedRows] = useState(new Set())
  const [saving, setSaving] = useState(false)
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

    // Custom sort: by team, then by position order
    const positionOrder = { QB: 1, RB: 2, WR: 3, TE: 4, K: 5, DEF: 6 }
    const sorted = (res.data || []).sort((a, b) => {
      // First sort by team name
      const teamA = a.players?.teams?.name || ''
      const teamB = b.players?.teams?.name || ''
      if (teamA !== teamB) return teamA.localeCompare(teamB)
      
      // Then sort by position
      const posA = positionOrder[a.players?.position] || 99
      const posB = positionOrder[b.players?.position] || 99
      return posA - posB
    })

    setRows(sorted)
    setModifiedRows(new Set())
  }

  function updateStat(id, field, value) {
    setRows(r =>
      r.map(row =>
        row.id === id ? { ...row, [field]: Number(value) } : row
      )
    )
    setModifiedRows(prev => new Set(prev).add(id))
  }

  async function saveStats() {
    setSaving(true)
    try {
      const updates = rows
        .filter(r => modifiedRows.has(r.id))
        .map(r => ({
          id: r.id,
          catches: r.catches,
          pass_yards: r.pass_yards,
          rush_rec_yards: r.rush_rec_yards,
          tds: r.tds,
          turnovers: r.turnovers,
          two_pt: r.two_pt,
          misc_td: r.misc_td,
          return_yards: r.return_yards,
          sacks: r.sacks,
          def_turnovers: r.def_turnovers,
          safety: r.safety,
          points_allowed: r.points_allowed,
          fg_yards: r.fg_yards
        }))

      for (const update of updates) {
        const { id, ...stats } = update
        await supabase.from('player_stats').update(stats).eq('id', id)
      }

      setModifiedRows(new Set())
      alert('Stats saved successfully!')
    } catch (e) {
      alert('Error saving stats: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function downloadCSVTemplate() {
    // Create CSV header
    const headers = ['Player', 'Team', 'Position', ...STAT_FIELDS.map(f => f.label)]
    
    // Create CSV rows
    const csvRows = rows.map(r => [
      r.players?.name || '',
      r.players?.teams?.name || '',
      r.players?.position || '',
      ...STAT_FIELDS.map(f => r[f.key] ?? 0)
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `player_stats_${week}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleCSVImport(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== 'string') return

      try {
        const lines = text.split('\n').filter(l => l.trim())
        const headers = lines[0].split(',')
        
        // Find stat column indices
        const statIndices = {}
        STAT_FIELDS.forEach(f => {
          const idx = headers.findIndex(h => h.trim() === f.label)
          if (idx !== -1) statIndices[f.key] = idx
        })

        // Parse data rows
        const updatedRows = [...rows]
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',')
          const playerName = values[0]?.trim()
          
          // Find matching row
          const rowIndex = updatedRows.findIndex(r => r.players?.name === playerName)
          if (rowIndex === -1) continue

          // Update stats
          STAT_FIELDS.forEach(f => {
            const colIdx = statIndices[f.key]
            if (colIdx !== undefined) {
              const value = parseFloat(values[colIdx]) || 0
              updatedRows[rowIndex] = { ...updatedRows[rowIndex], [f.key]: value }
              setModifiedRows(prev => new Set(prev).add(updatedRows[rowIndex].id))
            }
          })
        }

        setRows(updatedRows)
        alert(`CSV imported successfully! ${modifiedRows.size} players updated.`)
      } catch (err) {
        alert('Error parsing CSV: ' + err.message)
      }
    }
    reader.readAsText(file)
    
    // Reset input so same file can be imported again
    event.target.value = ''
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

          <Group justify="space-between">
            <SegmentedControl
              value={week}
              onChange={setWeek}
              data={WEEKS.map(w => ({ value: w.key, label: w.label }))}
              style={{ flex: 1 }}
            />
            <Group gap="xs">
              <Button 
                onClick={downloadCSVTemplate}
                variant="light"
                color="blue"
                size="md"
              >
                Download Template
              </Button>
              <Button 
                component="label"
                variant="light"
                color="cyan"
                size="md"
              >
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  style={{ display: 'none' }}
                />
              </Button>
              <Button 
                onClick={saveStats} 
                disabled={modifiedRows.size === 0 || saving}
                loading={saving}
                size="md"
                color="green"
              >
                Save Stats {modifiedRows.size > 0 && `(${modifiedRows.size})`}
              </Button>
            </Group>
          </Group>

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
