import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'
import { useAdminAuth } from '../context/AdminAuth'
import { 
  Container, Title, Card, Button, Table, Stack, Box, Badge, Group, 
  Tabs, Loader, ActionIcon, Grid, Text, Modal, Select, SegmentedControl
} from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'

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
  const [modalOpened, setModalOpened] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState('wildcard')
  const [rankingView, setRankingView] = useState('total') // 'total' or week key
  const { isAuthenticated } = useAdminAuth()
  const nav = useNavigate()

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    setLoading(true)
    
    // Fetch users with their cached weekly scores
    const { data: users } = await supabase
      .from('users')
      .select('id,name,is_locked,wildcard_score,divisional_score,conference_score,superbowl_score')

    const usersList = users || []

    // Calculate total score as sum of all weekly scores
    const ranked = usersList.map(user => ({
      ...user,
      total: (user.wildcard_score || 0) + 
             (user.divisional_score || 0) + 
             (user.conference_score || 0) + 
             (user.superbowl_score || 0)
    }))

    setUsers(ranked)
    setLoading(false)
  }

  // Get sorted users based on ranking view
  function getSortedUsers() {
    const sorted = [...users]
    if (rankingView === 'total') {
      sorted.sort((a, b) => b.total - a.total)
    } else {
      const scoreKey = `${rankingView}_score`
      sorted.sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0))
    }
    return sorted
  }

  function getDisplayScore(user) {
    if (rankingView === 'total') {
      return user.total
    }
    return user[`${rankingView}_score`] || 0
  }

  async function selectUser(u) {
    setSelected(u)
    setModalOpened(true)
    await loadUserStats(u)
  }

  async function loadUserStats(user) {
    const picks = await supabase
      .from('user_picks')
      .select('slot, player_id, players(name), teams(name, eliminated_week)')
      .eq('user_id', user.id)

    // Get stats for ALL weeks for these players
    const stats = await supabase
      .from('player_stats')
      .select('*')
      .in('player_id', picks.data.map(p => p.player_id))

    // Aggregate scores across all weeks and store weekly scores
    const merged = picks.data.map(p => {
      const playerStats = (stats.data || []).filter(s => s.player_id === p.player_id)
      const totalScore = playerStats.reduce((sum, s) => sum + calculateScore(s), 0)
      
      // Store scores by week
      const weeklyScores = {}
      playerStats.forEach(s => {
        weeklyScores[s.week] = calculateScore(s)
      })
      
      return {
        ...p,
        totalScore,
        weeklyScores,
      }
    })

    setRows(merged)
  }

  function getPlayerScore(row) {
    if (rankingView === 'total') {
      return row.totalScore || 0
    }
    return row.weeklyScores?.[rankingView] || 0
  }

  // Reload stats when week changes
  useEffect(() => {
    if (selected && modalOpened) {
      loadUserStats(selected, selectedWeek)
    }
  }, [selectedWeek])

  async function deleteUser(u) {
    if (!confirm(`Are you sure you want to delete ${u.name}? This cannot be undone.`)) return

    await supabase.from('user_picks').delete().eq('user_id', u.id)
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
    <Box bg="gray.1" mih="100vh">
      <Container size="xl" p="md">
        <Card shadow="sm" radius="md" withBorder mb="md">
          <Tabs defaultValue="leaderboard" variant="pills">
            <Tabs.List mb="md">
              <Tabs.Tab value="leaderboard" fz="lg" fw={600}>Leaderboard</Tabs.Tab>
              <Tabs.Tab value="stats" fz="lg" fw={600} onClick={() => nav('/stats')}>Player Stats</Tabs.Tab>
              <Tabs.Tab value="signup" fz="lg" fw={600} onClick={() => nav('/signup')}>Signup</Tabs.Tab>
              <Tabs.Tab value="help" fz="lg" fw={600} onClick={() => nav('/help')}>Help / Rules</Tabs.Tab>
              <Tabs.Tab value="admin" fz="lg" fw={600} onClick={() => nav('/admin')}>Admin</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Card>

        <Stack gap="md">
          <Group justify="space-between">
            <Title order={1} size="h2">NFL Playoff Leaderboard</Title>
            {isAuthenticated && (
              <Group gap="xs">
                <Button size="sm" color="red" variant="light" onClick={() => setGlobalLock(true)}>
                  Lock All
                </Button>
                <Button size="sm" color="green" variant="light" onClick={() => setGlobalLock(false)}>
                  Unlock All
                </Button>
              </Group>
            )}
          </Group>

          <SegmentedControl
            value={rankingView}
            onChange={setRankingView}
            data={[
              { value: 'total', label: 'Total' },
              { value: 'wildcard', label: 'Wild Card' },
              { value: 'divisional', label: 'Divisional' },
              { value: 'conference', label: 'Conference' },
              { value: 'superbowl', label: 'Super Bowl' },
            ]}
            fullWidth
          />

          {loading ? (
            <Group justify="center" p="xl">
              <Loader />
              <Text c="dimmed">Loading leaderboard…</Text>
            </Group>
          ) : (
            <Grid gutter="md" justify="center">
              {/* Leaderboard List */}
              <Grid.Col span={12}>
                <Card shadow="sm" radius="md" withBorder p="md">
                  <Title order={3} size="h3" mb="md">
                    {rankingView === 'total' ? 'Total Rankings' : `${WEEKS.find(w => w.key === rankingView)?.label} Rankings`}
                  </Title>
                  <Stack gap="sm">
                    {getSortedUsers().map((u, i) => (
                      <Card
                        key={u.id}
                        bg={selected?.id === u.id ? 'blue.0' : 'white'}
                        withBorder
                        p="md"
                        radius="md"
                        style={{ 
                          cursor: 'pointer',
                          borderColor: selected?.id === u.id ? 'var(--mantine-color-blue-3)' : undefined 
                        }}
                        onClick={() => selectUser(u)}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                            <Badge size="lg" variant="filled">#{i + 1}</Badge>
                            <Title order={2} size="h2" fw={600} style={{ margin: 0 }}>{u.name}</Title>
                            {u.is_locked && <Text size="md">🔒</Text>}
                          </Group>
                          <Group gap="sm" wrap="nowrap">
                            <Text size="lg" fw={600}>{getDisplayScore(u).toFixed(2)}</Text>
                            {isAuthenticated && (
                              <ActionIcon
                                size="sm"
                                color="red"
                                variant="subtle"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteUser(u)
                                }}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            )}
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          )}
        </Stack>
      </Container>

      {/* User Details Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={<Title order={1} size="h1" fw={700}>{selected?.name}'s Roster</Title>}
        size="xl"
        fullScreen={{ base: true, sm: false }}
        padding={0}
        closeButtonProps={{
          size: 'xl',
          iconSize: 32
        }}
        styles={{
          body: { 
            padding: '0',
            height: '100%'
          },
          content: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          },
          header: {
            padding: '1.5rem',
            borderBottom: '1px solid var(--mantine-color-gray-3)'
          },
          title: { fontSize: '1.75rem' },
          close: {
            width: '48px',
            height: '48px'
          }
        }}
      >
        <Stack gap="0" style={{ height: '100%', flex: 1 }}>
          <Box style={{ flex: 1, overflow: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <Table.Tr>
                  <Table.Th style={{ padding: '1rem', width: '100px' }}><Text size="lg" fw={700}>Slot</Text></Table.Th>
                  <Table.Th style={{ padding: '1rem' }}><Text size="lg" fw={700}>Player</Text></Table.Th>
                  <Table.Th style={{ padding: '1rem', width: '120px' }}><Text size="lg" fw={700}>Team</Text></Table.Th>
                  <Table.Th style={{ textAlign: 'right', padding: '1rem', width: '140px' }}>
                    <Text size="lg" fw={700}>
                      {rankingView === 'total' ? 'Total Score' : `${WEEKS.find(w => w.key === rankingView)?.label} Score`}
                    </Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map(r => {
                  const isEliminated = !!r.teams?.eliminated_week
                  const score = getPlayerScore(r)
                  
                  return (
                    <Table.Tr 
                      key={r.slot}
                      style={{ 
                        backgroundColor: isEliminated ? '#fff0f0' : undefined,
                        opacity: isEliminated ? 0.8 : 1
                      }}
                    >
                      <Table.Td style={{ padding: '1rem', width: '100px' }}>
                        <Badge size="lg" variant="light" style={{ fontSize: '1rem', padding: '0.5rem 0.75rem' }}>
                          {r.slot}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ padding: '1rem' }}>
                        <Title 
                          order={2} 
                          size="h2" 
                          fw={600}
                        >
                          {r.players?.name}
                        </Title>
                      </Table.Td>
                      <Table.Td style={{ padding: '1rem', width: '120px' }}>
                        <Group gap="xs">
                          <Text size="lg" c="dimmed">{r.teams?.name}</Text>
                          {isEliminated && <Badge size="xs" color="red">OUT</Badge>}
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right', padding: '1rem', width: '140px' }}>
                        <Badge size="lg" color={isEliminated ? 'gray' : (score > 0 ? 'green' : 'gray')} style={{ fontSize: '1.1rem', padding: '0.5rem 0.75rem' }}>
                          {score.toFixed(2)}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Box>

          <Group 
            justify="space-between" 
            p="xl" 
            style={{ 
              borderTop: '2px solid var(--mantine-color-gray-3)',
              backgroundColor: 'var(--mantine-color-gray-0)'
            }}
          >
            <Text size="xxl" fw={700}>{rankingView === 'total' ? 'Total:' : `${WEEKS.find(w => w.key === rankingView)?.label}:`}</Text>
            <Badge size="xl" color="blue" style={{ fontSize: '1.5rem', padding: '0.75rem 1.25rem' }}>
              {rows.reduce((sum, r) => sum + getPlayerScore(r), 0).toFixed(2)}
            </Badge>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}