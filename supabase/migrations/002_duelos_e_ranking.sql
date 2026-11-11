-- ===== INICIO DA MIGRACAO 002 (002_duelos_e_ranking.sql) =====
-- Personagem no banco, ranking real e duelo entre jogadores (decisão B: só o servidor escreve).
-- Depende da 001. Aplicar uma vez no Supabase (SQL Editor: colar tudo e rodar).
--
-- Segurança desta etapa (continua a mesma da 001):
--  * O navegador NUNCA escreve em players nem em duels. Só o servidor (service_role) escreve.
--  * Cada jogador só lê a própria linha de players e os próprios duelos.
--  * Os outros jogadores aparecem só pela visão public_players, sem dados privados.

-- 1) Colunas novas em players (placar de duelos e contas do servidor)
alter table public.players
  add column if not exists duels_won        integer not null default 0 check (duels_won >= 0),
  add column if not exists duels_lost       integer not null default 0 check (duels_lost >= 0),
  -- parte do respeito que veio de duelos (soma; pode ser negativa). O resto vem de missões.a
  add column if not exists respect_duels    integer not null default 0,
  -- total de cash que o servidor pagou em duelos (entra no teto de cash do save)
  add column if not exists duel_cash_earned bigint  not null default 0 check (duel_cash_earned >= 0);

-- 2) Histórico de duelos (auditoria e limites: espera entre os mesmos jogadores, duelos por hora)
create table if not exists public.duels (
  id            uuid primary key default gen_random_uuid(),
  attacker_id   uuid        not null references auth.users(id) on delete cascade,
  defender_id   uuid        not null references auth.users(id) on delete cascade,
  winner_id     uuid        not null references auth.users(id) on delete cascade,
  seed          integer     not null,
  rounds        integer     not null,
  cash_won      integer     not null default 0,
  respect_delta integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists duels_attacker_idx on public.duels (attacker_id, created_at desc);
create index if not exists duels_pair_idx     on public.duels (attacker_id, defender_id, created_at desc);

alter table public.duels enable row level security;
alter table public.duels force row level security;

revoke all on public.duels from anon, authenticated;
grant select on public.duels to authenticated;
grant all on public.duels to service_role;

drop policy if exists duels_select_own on public.duels;
create policy duels_select_own
  on public.duels
  for select
  to authenticated
  using (auth.uid() = attacker_id or auth.uid() = defender_id);
-- Propositalmente NÃO há policy de insert/update/delete: o navegador não escreve.

-- 3) Visão pública do ranking e dos rivais: acrescenta placar de duelos e a arma equipada.
-- Colunas novas ficam no FIM para não mexer nas existentes. Continua sem expor o campo "save".
create or replace view public.public_players as
  select id, name, style, level, respect, family_id, appearance, created_at,
         duels_won, duels_lost,
         (save -> 'equipped' ->> 'weaponId') as weapon_id
  from public.players;

revoke all on public.public_players from anon, authenticated;
grant select on public.public_players to authenticated;

-- ===== FIM DA MIGRACAO 002 (002_duelos_e_ranking.sql) =====
