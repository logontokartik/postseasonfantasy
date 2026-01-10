import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'
import { useAdminAuth } from '../context/AdminAuth'
import { 
  Container, Title, Card, Button, Table, Stack, Box, Badge, Group, 
  Tabs, Loader, ActionIcon, Grid, Text, Modal, Select
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

    ranked.sort((a, b) => b.total - a.total)
    setUsers(ranked)
    setLoading(false)
  }

  async function selectUser(u) {
    setSelected(u)
    setModalOpened(true)
    await loadUserStats(u, selectedWeek)
  }

  async function loadUserStats(user, week) {
    const picks = await supabase
      .from('user_picks')
      .select('slot, player_id, players(name), teams(name)')
      .eq('user_id', user.id)

    const stats = await supabase
      .from('player_stats')
      .select('*')
      .eq('week', week)
      .in('player_id', picks.data.map(p => p.player_id))

    const merged = picks.data.map(p => ({
      ...p,
      stats: stats.data.find(s => s.player_id === p.player_id) || {},
    }))

    setRows(merged)
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
                  <Title order={3} size="h3" mb="md">Rankings</Title>
                  <Stack gap="sm">
                    {users.map((u, i) => (
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
                            <Text size="lg" fw={600}>{u.total.toFixed(1)}</Text>
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
        title={<Text size="xxl" fw={700}>{selected?.name}'s Roster</Text>}
        size="xl"
        fullScreen={{ base: true, sm: false }}
        padding={0}
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
          title: { fontSize: '1.75rem' }
        }}
      >
        <Stack gap="0" style={{ height: '100%', flex: 1 }}>
          <Box p="xl" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
            <Select
              label={<Text size="xl" fw={600}>Select Week</Text>}
              value={selectedWeek}
              onChange={setSelectedWeek}
              size="xl"
              styles={{
                input: { fontSize: '1.25rem', padding: '1rem' },
                label: { fontSize: '1.25rem', marginBottom: '0.5rem' }
              }}
              data={[
                { value: 'wildcard', label: 'Wild Card' },
                { value: 'divisional', label: 'Divisional' },
                { value: 'conference', label: 'Conference' },
                { value: 'superbowl', label: 'Super Bowl' }
              ]}
            />
          </Box>

          <Box style={{ flex: 1, overflow: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <Table.Tr>
                  <Table.Th style={{ padding: '1rem', width: '120px' }}><Text size="lg" fw={700}>Slot</Text></Table.Th>
                  <Table.Th style={{ padding: '1rem' }}><Text size="lg" fw={700}>Player</Text></Table.Th>
                  <Table.Th style={{ padding: '1rem', width: '120px' }}><Text size="lg" fw={700}>Team</Text></Table.Th>
                  <Table.Th style={{ textAlign: 'right', padding: '1rem', width: '100px' }}><Text size="lg" fw={700}>Score</Text></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map(r => {
                  const score = r.stats ? calculateScore(r.stats) : 0
                  return (
                    <Table.Tr key={r.slot}>
                      <Table.Td style={{ padding: '1rem', width: '120px' }}>
                        <Badge size="lg" variant="light" style={{ fontSize: '1rem', padding: '0.5rem 0.75rem' }}>
                          {r.slot}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ padding: '1rem' }}>
                        <Title order={2} size="h2" fw={600}>{r.players?.name}</Title>
                      </Table.Td>
                      <Table.Td style={{ padding: '1rem', width: '120px' }}>
                        <Text size="lg" c="dimmed">{r.teams?.name}</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right', padding: '1rem', width: '100px' }}>
                        <Badge size="lg" color={score > 0 ? 'green' : 'gray'} style={{ fontSize: '1.1rem', padding: '0.5rem 0.75rem' }}>
                          {score.toFixed(1)}
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
              background: 'var(--mantine-color-blue-0)', 
              borderTop: '2px solid var(--mantine-color-blue-3)',
              minHeight: '80px'
            }}
          >
            <Text size="xxl" fw={700}>Total:</Text>
            <Badge size="xl" color="blue" style={{ fontSize: '1.5rem', padding: '0.75rem 1.25rem' }}>
              {rows.reduce((sum, r) => sum + (r.stats ? calculateScore(r.stats) : 0), 0).toFixed(1)}
            </Badge>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}