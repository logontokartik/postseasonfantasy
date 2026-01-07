-- Players (participants)
create table if not exists players (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp default now()
);

-- Picks (14 slots per participant, one-time lock at UI level; enforce via RLS/unique constraints as desired)
create table if not exists picks (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references players(id) on delete cascade,
  team text not null,
  selected_player text not null,
  position text not null,
  created_at timestamp default now()
);

-- Weekly stats per participant + selected_player + week
-- (So each participant's chosen players can score independently per week)
create table if not exists player_stats (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references players(id) on delete cascade,
  selected_player text not null,
  week text check (week in ('wildcard','divisional','conference','superbowl')),
  catches int default 0,
  pass_yards int default 0,
  rush_rec_yards int default 0,
  tds int default 0,
  turnovers int default 0,
  two_pt int default 0,
  misc_td int default 0,
  return_yards int default 0,
  updated_at timestamp default now()
);

-- Helpful indexes
create index if not exists idx_picks_player on picks(player_id);
create index if not exists idx_stats_player_week on player_stats(player_id, week);

-- OPTIONAL: prevent duplicate slot/position per participant
-- create unique index if not exists uniq_player_position on picks(player_id, position);

-- Enable realtime in Supabase UI for table `player_stats` (and optionally players)
