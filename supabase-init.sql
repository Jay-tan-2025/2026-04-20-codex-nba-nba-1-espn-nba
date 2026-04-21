create extension if not exists pgcrypto;

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  player_name text not null,
  event_id text not null,
  stat_type text not null check (stat_type in ('points', 'rebounds', 'assists')),
  predicted_value numeric not null,
  actual_value numeric,
  accuracy_score integer,
  note text default '',
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists predictions_created_at_idx on public.predictions (created_at desc);
