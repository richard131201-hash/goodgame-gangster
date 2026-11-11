-- 0001_players.sql
-- Jogadores reais do Mobster Rise. FONTE DE VERDADE do esquema: este arquivo (git).
-- Aplicar uma vez no Supabase (SQL Editor: colar tudo e rodar). Nunca editar o banco pelo painel.
--
-- Segurança desta etapa:
--  * Cada jogador só LÊ a própria linha (RLS).
--  * Ninguém no navegador (anon/authenticated) consegue INSERT/UPDATE/DELETE em players.
--    Toda escrita passa pelo servidor (chave service_role, que ignora RLS).
--  * Outros jogadores aparecem só pela visão public_players, sem dados privados.

create table if not exists public.players (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text        not null check (char_length(name) between 3 and 24),
  style             text        not null check (style in ('carrasco', 'muralha', 'malandro')),
  level             integer     not null default 1  check (level between 1 and 100),
  respect           integer     not null default 120 check (respect >= 0),
  family_id         text,
  appearance        jsonb       not null,
  -- Estado completo do jogo (etapa 1: o cliente envia; etapa D2e move as regras para o servidor)
  save              jsonb       not null,
  energy_updated_at timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Nome único sem diferenciar maiúscula de minúscula
create unique index if not exists players_name_lower_uidx on public.players (lower(name));
-- Ranking por respeito
create index if not exists players_respect_idx on public.players (respect desc);

-- Segurança de linha (RLS)
alter table public.players enable row level security;
alter table public.players force row level security;

-- Fecha tudo e abre só o necessário
revoke all on public.players from anon, authenticated;
grant select on public.players to authenticated;

drop policy if exists players_select_own on public.players;
create policy players_select_own
  on public.players
  for select
  to authenticated
  using (auth.uid() = id);
-- Propositalmente NÃO há policy de insert/update/delete: o navegador não escreve.

-- Visão pública para ver outros jogadores (ranking). Só dados que podem ser vistos por todos.
create or replace view public.public_players as
  select id, name, style, level, respect, family_id, appearance, created_at
  from public.players;

revoke all on public.public_players from anon, authenticated;
grant select on public.public_players to authenticated;
