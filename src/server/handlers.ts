import type { BalanceConfig } from '../engine/schema.js';
import {
  buildNewPlayer,
  duelBlockReason,
  resolveDuel,
  rowColumns,
  validateSave,
  DUEL,
  type DbPlayerRow,
  type DuelOutcome,
} from './rules.js';
import type { PlayerState } from '../shared/player.js';

/**
 * Operações do servidor (uma por "op"). Falam com o banco só por esta interface `Db`:
 * em produção ela é implementada com o Supabase (supabaseDb.ts); nos testes, com uma memória.
 */
export interface DuelLogRow {
  attacker_id: string;
  defender_id: string;
  winner_id: string;
  seed: number;
  rounds: number;
  cash_won: number;
  respect_delta: number;
  created_at: string;
}

export interface Db {
  getPlayer(id: string): Promise<DbPlayerRow | null>;
  /** Cria a linha. Retorna 'nome_em_uso' se o nome já existe (sem diferenciar maiúscula), 'ja_existe' se a conta já tem personagem. */
  insertPlayer(row: Omit<DbPlayerRow, 'created_at' | 'updated_at' | 'duels_won' | 'duels_lost' | 'duel_cash_earned'>): Promise<
    { ok: true; row: DbPlayerRow } | { ok: false; error: 'nome_em_uso' | 'ja_existe' }
  >;
  updatePlayer(id: string, fields: Partial<DbPlayerRow>): Promise<void>;
  lastDuelBetween(attackerId: string, defenderId: string): Promise<number | null>;
  countDuelsSince(attackerId: string, sinceMs: number): Promise<number>;
  insertDuel(row: Omit<DuelLogRow, 'created_at'>): Promise<void>;
}

export interface Ctx {
  db: Db;
  userId: string;
  now: number;
  config: BalanceConfig;
  /** Sorteio da semente do duelo (injetável para teste). */
  randomSeed: () => number;
}

export type ApiBody = { op?: string; [k: string]: unknown };
export interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
}

const reply = (status: number, body: Record<string, unknown>): ApiResponse => ({ status, body });
const fail = (status: number, error: string, message: string) => reply(status, { ok: false, error, message });

/** Resposta pública do jogador: o save completo só vai para o dono. */
function mine(row: DbPlayerRow) {
  return { save: row.save, duelsWon: row.duels_won, duelsLost: row.duels_lost };
}

// ---------------------------------------------------------------------------------------------
export async function opMe(ctx: Ctx): Promise<ApiResponse> {
  const row = await ctx.db.getPlayer(ctx.userId);
  if (!row) return reply(200, { ok: true, exists: false });
  return reply(200, { ok: true, exists: true, ...mine(row) });
}

export async function opCreate(ctx: Ctx, body: ApiBody): Promise<ApiResponse> {
  const built = buildNewPlayer(body.character, ctx.now);
  if (!built.ok) return fail(422, built.error, built.message);
  const p = built.player;
  const res = await ctx.db.insertPlayer({ id: ctx.userId, ...rowColumns(p, { respect_duels: 0 }) });
  if (!res.ok) {
    if (res.error === 'nome_em_uso') return fail(409, 'nome_em_uso', 'Esse nome já está em uso. Escolha outro.');
    return fail(409, 'ja_existe', 'Esta conta já tem um personagem.');
  }
  return reply(200, { ok: true, ...mine(res.row) });
}

export async function opSave(ctx: Ctx, body: ApiBody): Promise<ApiResponse> {
  const row = await ctx.db.getPlayer(ctx.userId);
  if (!row) return fail(404, 'sem_personagem', 'Esta conta ainda não tem personagem.');
  const checked = validateSave(row, body.save, ctx.now);
  if (!checked.ok) {
    // Recusado: devolve o save do servidor para o navegador voltar ao que é válido.
    return reply(422, { ok: false, error: 'save_recusado', message: `O servidor recusou o progresso: ${checked.reason}.`, ...mine(row) });
  }
  const fields = rowColumns(checked.save, { respect_duels: row.respect_duels });
  await ctx.db.updatePlayer(ctx.userId, { ...fields, updated_at: new Date(ctx.now).toISOString() });
  return reply(200, { ok: true, save: checked.save, duelsWon: row.duels_won, duelsLost: row.duels_lost });
}

export async function opDuel(ctx: Ctx, body: ApiBody): Promise<ApiResponse> {
  const defenderId = typeof body.opponentId === 'string' ? body.opponentId : '';
  if (!defenderId) return fail(422, 'invalido', 'Escolha um rival.');

  const attacker = await ctx.db.getPlayer(ctx.userId);
  if (!attacker) return fail(404, 'sem_personagem', 'Esta conta ainda não tem personagem.');
  const defender = await ctx.db.getPlayer(defenderId);
  if (!defender) return fail(404, 'rival_nao_existe', 'Esse rival não existe mais.');

  const lastPair = await ctx.db.lastDuelBetween(attacker.id, defender.id);
  const lastHour = await ctx.db.countDuelsSince(attacker.id, ctx.now - 60 * 60 * 1000);
  const block = duelBlockReason(attacker, defender, { now: ctx.now, lastPairDuelAt: lastPair, duelsLastHour: lastHour });
  if (block) {
    const msg: Record<string, string> = {
      si_mesmo: 'Você não pode duelar contra você mesmo.',
      nivel: `Só dá para duelar com jogadores até ${DUEL.levelRange} níveis de diferença.`,
      espera: `Você já desafiou esse rival há pouco. Espere ${Math.round(DUEL.pairCooldownMs / 60000)} minutos ou escolha outro.`,
      limite_hora: `Limite de ${DUEL.maxPerHour} duelos por hora atingido. Tente mais tarde.`,
    };
    return fail(429, block, msg[block]);
  }

  const out: DuelOutcome = resolveDuel(attacker, defender, ctx.randomSeed(), ctx.config);

  const nowIso = new Date(ctx.now).toISOString();
  await ctx.db.updatePlayer(attacker.id, {
    ...rowColumns(out.attackerSave, { respect_duels: attacker.respect_duels + out.attackerRespectDuelsDelta }),
    duels_won: out.attackerSave.statsRecord.duelsWon,
    duels_lost: out.attackerSave.statsRecord.duelsLost,
    duel_cash_earned: attacker.duel_cash_earned + out.rewards.cash,
    updated_at: nowIso,
  });
  await ctx.db.updatePlayer(defender.id, {
    save: out.defenderSave as PlayerState,
    duels_won: out.defenderSave.statsRecord.duelsWon,
    duels_lost: out.defenderSave.statsRecord.duelsLost,
  });
  await ctx.db.insertDuel({
    attacker_id: attacker.id,
    defender_id: defender.id,
    winner_id: out.won ? attacker.id : defender.id,
    seed: out.seed,
    rounds: out.rounds,
    cash_won: out.rewards.cash,
    respect_delta: out.rewards.respect,
  });

  return reply(200, {
    ok: true,
    won: out.won,
    seed: out.seed,
    rounds: out.rounds,
    firstAttacker: out.firstAttacker,
    events: out.events,
    attacker: { input: out.attackerInput, appearance: attacker.appearance },
    defender: {
      id: defender.id,
      name: defender.name,
      style: defender.style,
      level: defender.level,
      weaponId: defender.save.equipped.weaponId,
      input: out.defenderInput,
      appearance: defender.appearance,
    },
    rewards: out.rewards,
    save: out.attackerSave,
    duelsWon: out.attackerSave.statsRecord.duelsWon,
    duelsLost: out.attackerSave.statsRecord.duelsLost,
  });
}

/** Roteia o corpo da requisição para a operação certa. */
export async function handleOp(ctx: Ctx, body: ApiBody): Promise<ApiResponse> {
  try {
    switch (body.op) {
      case 'me':
        return await opMe(ctx);
      case 'create':
        return await opCreate(ctx, body);
      case 'save':
        return await opSave(ctx, body);
      case 'duel':
        return await opDuel(ctx, body);
      default:
        return fail(400, 'op_invalida', 'Operação desconhecida.');
    }
  } catch (e) {
    // Nunca devolve detalhe interno ao navegador.
    console.error('erro no servidor:', e instanceof Error ? e.message : 'desconhecido');
    return fail(500, 'erro_interno', 'Erro no servidor. Tente de novo em instantes.');
  }
}
