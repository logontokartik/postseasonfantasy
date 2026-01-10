import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { calculateScore } from '../utils/scoring'
import { 
  Container, Title, Card, Button, Table, Stack, Box, Badge, Group, 
  Tabs, Loader, ActionIcon, Grid, Text
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
  const nav = useNavigate()

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    setLoading(true)
    const ures = await supabase.from('users').select('id,name,is_locked')
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
    setLoading(false)
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
            <Group gap="xs">
              <Button size="sm" color="red" variant="light" onClick={() => setGlobalLock(true)}>
                Lock All
              </Button>
              <Button size="sm" color="green" variant="light" onClick={() => setGlobalLock(false)}>
                Unlock All
              </Button>
            </Group>
          </Group>

          {loading ? (
            <Group justify="center" p="xl">
              <Loader />
              <Text c="dimmed">Loading leaderboard…</Text>
            </Group>
          ) : (
            <Grid gutter="md">
              {/* Leaderboard List */}
              <Grid.Col span={{ base: 12, lg: 3 }}>
                <Card shadow="sm" radius="md" withBorder p="md">
                  <Title order={3} size="h4" mb="md">Rankings</Title>
                  <Stack gap="xs">
                    {users.map((u, i) => (
                      <Card
                        key={u.id}
                        bg={selected?.id === u.id ? 'blue.0' : 'white'}
                        withBorder
                        p="sm"
                        radius="md"
                        style={{ 
                          cursor: 'pointer',
                          borderColor: selected?.id === u.id ? 'var(--mantine-color-blue-3)' : undefined 
                        }}
                        onClick={() => selectUser(u)}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                            <Badge size="sm" variant="filled">#{i + 1}</Badge>
                            <Text size="sm" fw={selected?.id === u.id ? 700 : 500} truncate>
                              {u.name}
                            </Text>
                            {u.is_locked && <Text size="xs">🔒</Text>}
                          </Group>
                          <Group gap="xs" wrap="nowrap">
                            <Text size="sm" fw={600}>{u.total.toFixed(1)}</Text>
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
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Week Breakdown */}
              <Grid.Col span={{ base: 12, lg: 9 }}>
                {!selected ? (
                  <Card shadow="sm" radius="md" withBorder p="xl">
                    <Text c="dimmed" ta="center">Select a user to view their weekly breakdown</Text>
                  </Card>
                ) : (
                  <Card shadow="sm" radius="md" withBorder p="md">
                    <Title order={3} size="h4" mb="md">
                      {selected.name}'s Breakdown
                    </Title>
                    <Grid gutter="md">
                      {WEEKS.map(w => (
                        <Grid.Col key={w.key} span={{ base: 12, sm: 6, md: 3 }}>
                          <Card bg="gray.0" withBorder p="md" radius="md">
                            <Group justify="space-between" mb="sm">
                              <Text fw={700} size="sm">{w.label}</Text>
                              <Badge>{weekTotal(w.key).toFixed(1)}</Badge>
                            </Group>
                            <Stack gap="xs">
                              {rows.map(r => {
                                const ps = r.stats.find(x => x.week === w.key)
                                const score = ps ? calculateScore(ps) : 0

                                return (
                                  <Box key={r.slot + w.key}>
                                    <Group justify="space-between" wrap="nowrap">
                                      <Box style={{ minWidth: 0, flex: 1 }}>
                                        <Text size="xs" truncate>{r.players.name}</Text>
                                        <Text size="xs" c="dimmed" truncate>{r.teams.name}</Text>
                                      </Box>
                                      <Text size="xs" fw={600}>{score.toFixed(1)}</Text>
                                    </Group>
                                  </Box>
                                )
                              })}
                            </Stack>
                          </Card>
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Card>
                )}
              </Grid.Col>
            </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  )
}