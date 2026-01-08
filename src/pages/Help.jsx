import { Link } from 'react-router-dom'
import { Tabs, Container, Title, Text, Card, List, ThemeIcon, Group, Badge, SimpleGrid, Box } from '@mantine/core'

export default function Help() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Container size="lg">
        <div className="flex items-center justify-between mb-8">
          <Title order={1} className="text-gray-900">NFL Playoff Pool Rules</Title>
          <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-semibold no-underline">
            &larr; Back to Signup
          </Link>
        </div>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Tabs defaultValue="general" color="blue" variant="pills" radius="md">
            <Tabs.List mb="xl">
              <Tabs.Tab value="general" fz="xl" fw={600}>General Info</Tabs.Tab>
              <Tabs.Tab value="roster" fz="xl" fw={600}>Roster Rules</Tabs.Tab>
              <Tabs.Tab value="scoring" fz="xl" fw={600}>Scoring Rules</Tabs.Tab>
            </Tabs.List>

            {/* GENERAL TAB */}
            <Tabs.Panel value="general">
              <Box p="xl">
                <Title order={2} size="h3" mb="md" c="blue.8">Overview</Title>
                <Text size="xl" className="text-gray-700 leading-relaxed">
                  Welcome to the NFL Playoff Pool! The goal is to build the best possible roster of players from the NFL playoff teams. 
                  Points accumulate throughout the entire playoffs, so choosing players who will advance deep into the postseason is key.
                </Text>
                
                <Title order={2} size="h2" mt="xl" mb="md" c="blue.8">How to Win</Title>
                <List spacing="md" size="xl" center icon={
                  <ThemeIcon color="blue" size={28} radius="xl">
                    <span className="text-white font-bold text-base">✓</span>
                  </ThemeIcon>
                }>
                  <List.Item>Pick a balanced team that will survive multiple rounds.</List.Item>
                  <List.Item>Score points for every yard, touchdown, and defensive play.</List.Item>
                  <List.Item>Track your progress on the live Leaderboard.</List.Item>
                </List>
              </Box>
            </Tabs.Panel>

            {/* ROSTER TAB */}
            <Tabs.Panel value="roster">
              <Box p="xl">
                <Title order={2} size="h3" mb="xl" c="blue.8">Building Your Squad</Title>
                
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                  <div>
                    <Text fw={700} size="xl" mb="md">The Golden Rules</Text>
                    <List spacing="md" size="lg" type="ordered">
                      <List.Item>You must pick exactly <strong>14 players</strong>.</List.Item>
                      <List.Item>You must select <strong>ONE player from EACH of the 14 playoff teams</strong>.</List.Item>
                      <List.Item>Once a team is eliminated, their player stops scoring points.</List.Item>
                    </List>
                  </div>

                  <div>
                    <Text fw={700} size="xl" mb="md">Required Positions</Text>
                    <Card withBorder padding="md" radius="md" className="bg-gray-50">
                      <List spacing="sm" size="md" center>
                        <List.Item icon={<Badge color="cyan">2</Badge>}>Quarterbacks (QB)</List.Item>
                        <List.Item icon={<Badge color="cyan">2</Badge>}>Running Backs (RB)</List.Item>
                        <List.Item icon={<Badge color="cyan">2</Badge>}>Wide Receivers (WR)</List.Item>
                        <List.Item icon={<Badge color="cyan">2</Badge>}>Tight Ends (TE)</List.Item>
                        <List.Item icon={<Badge color="orange">2</Badge>}>Flex (QB / RB / WR / TE)</List.Item>
                        <List.Item icon={<Badge color="grape">2</Badge>}>Kickers (K)</List.Item>
                        <List.Item icon={<Badge color="red">2</Badge>}>Defenses (DEF)</List.Item>
                      </List>
                    </Card>
                  </div>
                </SimpleGrid>
              </Box>
            </Tabs.Panel>

            {/* SCORING TAB */}
            <Tabs.Panel value="scoring">
              <Box p="xl">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  
                  {/* Offense */}
                  <Card shadow="xs" padding="lg" radius="md" withBorder className="border-l-4 border-l-blue-500">
                    <Group justify="space-between" mb="sm">
                      <Text fw={700} size="xl" c="blue.8">Offense</Text>
                    </Group>
                    <List spacing="sm" size="md">
                      <List.Item><strong>6 pts</strong> - Touchdown (Rush/Rec/Pass)</List.Item>
                      <List.Item><strong>6 pts</strong> - Misc TD</List.Item>
                      <List.Item><strong>2 pts</strong> - 2-Point Conversion</List.Item>
                      <List.Item><strong>1 pt</strong> - Reception</List.Item>
                      <List.Item><strong>1 pt</strong> - Every 10 Rush/Rec Yards</List.Item>
                      <List.Item><strong>1 pt</strong> - Every 25 Pass Yards</List.Item>
                      <List.Item className="text-red-600"><strong>-2 pts</strong> - Turnover (INT / Fumble)</List.Item>
                    </List>
                  </Card>

                  {/* Kicking */}
                  <Card shadow="xs" padding="lg" radius="md" withBorder className="border-l-4 border-l-green-500">
                    <Group justify="space-between" mb="sm">
                      <Text fw={700} size="xl" c="green.8">Kicking</Text>
                    </Group>
                    <List spacing="sm" size="md">
                      <List.Item><strong>0.1 pt / yard</strong> - Field Goal</List.Item>
                      <Text size="xs" c="dimmed" className="ml-6">Example: 35 yards = 3.5 pts</Text>
                    </List>
                  </Card>

                  {/* Defense */}
                  <Card shadow="xs" padding="lg" radius="md" withBorder className="border-l-4 border-l-purple-500">
                    <Group justify="space-between" mb="sm">
                      <Text fw={700} size="xl" c="grape.8">Defense / ST</Text>
                    </Group>
                    <List spacing="sm" size="md">
                      <List.Item><strong>6 pts</strong> - Touchdown</List.Item>
                      <List.Item><strong>2 pts</strong> - Safety</List.Item>
                      <List.Item><strong>2 pts</strong> - Turnover (INT / Fumble)</List.Item>
                      <List.Item><strong>1 pt</strong> - Sack</List.Item>
                      <List.Item><strong>1 pt</strong> - Every 20 Return Yards</List.Item>
                    </List>
                  </Card>

                  {/* Points Allowed */}
                  <Card shadow="xs" padding="lg" radius="md" withBorder className="border-l-4 border-l-red-500">
                    <Group justify="space-between" mb="sm">
                      <Text fw={700} size="xl" c="red.8">Points Allowed</Text>
                    </Group>
                    <List spacing="sm" size="md">
                      <List.Item><strong>15 pts</strong> - 0 points allowed</List.Item>
                      <List.Item><strong>10 pts</strong> - 1-6 points allowed</List.Item>
                      <List.Item><strong>7 pts</strong> - 7-13 points allowed</List.Item>
                      <List.Item><strong>3 pts</strong> - 14-25 points allowed</List.Item>
                      <List.Item><strong>-1 pt</strong> - 26-35 points allowed</List.Item>
                      <List.Item><strong>0 pts</strong> - 36+ points allowed</List.Item>
                    </List>
                  </Card>

                </SimpleGrid>
                <Text size="sm" c="dimmed" fs="italic" mt="xl" ta="center">
                  * Total score for a player in a week cannot be less than 0.
                </Text>
              </Box>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Container>
    </div>
  )
}
