
create table teams(id uuid primary key default gen_random_uuid(),name text,conference text,seed int);
create table players(id uuid primary key default gen_random_uuid(),team_id uuid,name text,position text);
create table users(id uuid primary key default gen_random_uuid(),name text);
create table user_picks(id uuid primary key default gen_random_uuid(),user_id uuid,slot text,player_id uuid,team_id uuid);
create table player_stats(id uuid primary key default gen_random_uuid(),player_id uuid,week text,catches int default 0,pass_yards int default 0,rush_rec_yards int default 0,tds int default 0,turnovers int default 0,two_pt int default 0,misc_td int default 0,return_yards int default 0);
