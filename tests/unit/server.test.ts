import { describe, it, expect } from 'vitest';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { validateConfig } from '../../src/engine/schema.js';
import { handleOp, type Db, type Ctx, type DuelLogRow } from '../../src/server/handlers.js';
import { DUEL, LIMITS, maxLevelForAge, STARTER_WEAPON_IDS, type DbPlayerRow } from '../../src/server/rules.js';
import { goldCap } from '../../src/shared/gold.js';
import { defaultAppearance } from '../../src/web/characterOptions.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const config = validateConfig(balanceJson);
const T0 = Date.parse('2026-11-11T12:00:00Z');
const MIN = 60 * 1000;

/** Banco de mentira, em memória, com as mesmas regras de nome único do banco de verdade. */
class FakeDb implements Db {
  rows = new Map<string, DbPlayerRow>();
  duels: (DuelLogRow & { ms: number })[] = [];
  clock = T0;

  async getPlayer(id: string) {
    const r = this.rows.get(id);
    return r ? structuredClone(r) : null;
  }
  async insertPlayer(row: Parameters<Db['insertPlayer']>[0]) {
    if (this.rows.has(row.id)) return { ok: false as const, error: 'ja_existe' as const };
    for (const r of this.rows.values()) {
      if (r.name.toLowerCase() === row.name.toLowerCase()) return { ok: false as const, error: 'nome_em_uso' as const };
    }
    const full: DbPlayerRow = {
      ...row,
      duels_won: 0,
      duels_lost: 0,
      duel_cash_earned: 0,
      created_at: new Date(this.clock).toISOString(),
      updated_at: new Date(this.clock).toISOString(),
    };
    this.rows.set(row.id, full);
    return { ok: true as const, row: structuredClone(full) };
  }
  async updatePlayer(id: string, fields: Partial<DbPlayerRow>) {
    const r = this.rows.get(id)!;
    Object.assign(r, structuredClone(fields));
  }
  async lastDuelBy(a: string) {
    const l = this.duels.filter(x => x.attacker_id === a).map(x => x.ms);
    return l.length ? Math.max(...l) : null;
  }
  async insertDuel(row: Omit<DuelLogRow, 'created_at'>) {
    this.duels.push({ ...row, created_at: new Date(this.clock).toISOString(), ms: this.clock });
  }
}

const ctxFor = (db: FakeDb, userId: string, now = db.clock, seed = 12345): Ctx => ({
  db,
  userId,
  now,
  config,
  randomSeed: () => seed,
});

const character = (name: string, style = 'carrasco', weapon = 'colt_1911') => ({
  name,
  style,
  weapon,
  appearance: (({ name: _n, ...rest }) => rest)(defaultAppearance()),
});

async function createPlayer(db: FakeDb, id: string, name: string, style = 'carrasco') {
  const r = await handleOp(ctxFor(db, id), { op: 'create', character: character(name, style) });
  expect(r.status).toBe(200);
  return r;
}

describe('servidor: criar personagem (R-SERVIDOR-1, R-SERVIDOR-2)', () => {
  it('conta sem personagem: "me" diz que não existe', async () => {
    const db = new FakeDb();
    const r = await handleOp(ctxFor(db, 'u1'), { op: 'me' });
    expect(r.body).toMatchObject({ ok: true, exists: false });
  });

  it('cria o personagem do zero no servidor e "me" devolve o save', async () => {
    const db = new FakeDb();
    await createPlayer(db, 'u1', 'Don Rocco');
    const me = await handleOp(ctxFor(db, 'u1'), { op: 'me' });
    expect(me.body.exists).toBe(true);
    const save = me.body.save as { level: number; name: string; cash: number; respect: number };
    expect(save).toMatchObject({ level: 1, name: 'Don Rocco', cash: 500, respect: 0 });
    expect(db.rows.get('u1')?.name).toBe('Don Rocco');
  });

  it('nome único, sem diferenciar maiúscula de minúscula', async () => {
    const db = new FakeDb();
    await createPlayer(db, 'u1', 'Don Rocco');
    const r = await handleOp(ctxFor(db, 'u2'), { op: 'create', character: character('DON ROCCO') });
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('nome_em_uso');
  });

  it('uma conta tem um personagem só', async () => {
    const db = new FakeDb();
    await createPlayer(db, 'u1', 'Don Rocco');
    const r = await handleOp(ctxFor(db, 'u1'), { op: 'create', character: character('Outro Nome') });
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('ja_existe');
  });

  it('recusa nome ruim, classe inventada, arma que não é inicial e cor inválida', async () => {
    const db = new FakeDb();
    const bad = [
      character('ab'),
      character('Don Rocco', 'deus'),
      character('Don Rocco', 'carrasco', 'bazuca'),
      { ...character('Don Rocco'), appearance: { ...character('x').appearance, skinTone: 'vermelho' } },
      { name: 'Don Rocco' },
    ];
    for (const c of bad) {
      const r = await handleOp(ctxFor(db, 'u1'), { op: 'create', character: c });
      expect(r.status).toBe(422);
    }
    expect(db.rows.size).toBe(0);
  });

  it('as armas iniciais do servidor são as mesmas da tela de criação', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'web', 'onboarding.ts'), 'utf8');
    const ids = [...src.matchAll(/\{ id: '([a-z_0-9]+)', label: '/g)].map(m => m[1]);
    for (const id of STARTER_WEAPON_IDS) expect(ids).toContain(id);
  });
});

describe('servidor: conferir o save (R-SERVIDOR-3)', () => {
  const setup = async () => {
    const db = new FakeDb();
    await createPlayer(db, 'u1', 'Don Rocco');
    return db;
  };
  const saveOf = (db: FakeDb) => structuredClone(db.rows.get('u1')!.save);
  const send = (db: FakeDb, save: unknown, now = db.clock + 30 * MIN) =>
    handleOp(ctxFor(db, 'u1', now), { op: 'save', save });

  it('aceita o save sem mudança e com mudança honesta (compra e equipar)', async () => {
    const db = await setup();
    const s = saveOf(db);
    s.cash -= 120;
    const r = await send(db, s);
    expect(r.status).toBe(200);
    expect(db.rows.get('u1')!.save.cash).toBe(380);
  });

  it('nível acima do ritmo possível é recusado; dentro do ritmo é aceito', async () => {
    const db = await setup();
    const s = saveOf(db);
    s.level = 60;
    s.points.attack += 4 * 59;
    s.freePoints = 0;
    const r = await send(db, s);
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('save_recusado');
    expect(maxLevelForAge(30)).toBeGreaterThanOrEqual(10);
    expect(maxLevelForAge(0)).toBeLessThan(5);
  });

  it('pontos que não fecham com o nível são recusados', async () => {
    const db = await setup();
    const s = saveOf(db);
    s.points.attack += 5;
    expect((await send(db, s)).status).toBe(422);
  });

  it('cash inflado é recusado', async () => {
    const db = await setup();
    const s = saveOf(db);
    s.cash = 99_999_999;
    expect((await send(db, s)).status).toBe(422);
  });

  it('ouro acima do inicial é recusado', async () => {
    const db = await setup();
    const s = saveOf(db);
    s.gold = goldCap(1, 0) + 1;
    expect((await send(db, s)).status).toBe(422);
  });

  it('a posição de cada item na Mala (slot) é guardada; posição inválida é recusada (R-MALA-4)', async () => {
    const db = await setup();
    const s = saveOf(db);
    const comPosicao = s.inventory.map((it: { id: string }, i: number) => ({ ...it, slot: 7 - i }));
    const ok = await send(db, { ...s, inventory: comPosicao });
    expect(ok.status).toBe(200);
    const guardado = db.rows.get('u1')!.save.inventory as unknown as { slot?: number }[];
    expect(guardado.map(i => i.slot)).toEqual(comPosicao.map((i: { slot: number }) => i.slot));

    for (const ruim of [-1, 999, 2.5, 'x']) {
      const r = await send(db, { ...s, inventory: s.inventory.map((it: object) => ({ ...it, slot: ruim })) });
      expect(r.status).toBe(422);
    }
  });

  it('item que não existe e arma equipada fora da mochila são recusados', async () => {
    const db = await setup();
    const s = saveOf(db);
    s.inventory.push({ id: 'item_inventado' } as never);
    expect((await send(db, s)).status).toBe(422);

    const s2 = saveOf(db);
    s2.equipped.weaponId = 'tommy_gun';
    expect((await send(db, s2)).status).toBe(422);
  });

  it('o servidor usa os dados do catálogo, não os que o navegador manda no item', async () => {
    const db = await setup();
    const s = saveOf(db);
    (s.inventory[0] as { priceCash: number; statsBonus?: unknown }).priceCash = 1;
    (s.inventory[0] as { statsBonus?: unknown }).statsBonus = { attack: 99999 };
    const r = await send(db, s);
    expect(r.status).toBe(200);
    const kept = db.rows.get('u1')!.save.inventory[0] as { priceCash: number; statsBonus?: unknown };
    expect(kept.priceCash).toBeGreaterThan(1);
    expect(kept.statsBonus).not.toEqual({ attack: 99999 }); // fica o valor do catálogo
  });

  it('nome, classe, aparência e placar de duelos nunca vêm do navegador', async () => {
    const db = await setup();
    const s = saveOf(db) as unknown as Record<string, unknown> & { statsRecord: Record<string, number> };
    s.name = 'Hacker';
    s.style = 'muralha';
    s.appearance = { name: 'Hacker' };
    s.statsRecord.duelsWon = 500;
    const r = await send(db, s);
    expect(r.status).toBe(200);
    const row = db.rows.get('u1')!;
    expect(row.name).toBe('Don Rocco');
    expect(row.style).toBe('carrasco');
    expect(row.save.statsRecord.duelsWon).toBe(0);
  });

  it('o navegador não consegue diminuir o respeito nem inflá-lo além das missões', async () => {
    const db = await setup();
    const row = db.rows.get('u1')!;
    row.respect = 50;
    row.save.respect = 50;
    row.respect_duels = 50; // veio de duelo
    const low = saveOf(db);
    low.respect = 0;
    await send(db, low);
    expect(db.rows.get('u1')!.respect).toBe(50);

    const high = saveOf(db);
    high.respect = 50_000;
    expect((await send(db, high)).status).toBe(422);
  });

  it('Respeito só vem de duelo: nem 1 ponto de missão é aceito (R-RESPEITO-1)', async () => {
    const db = await setup();
    const s = saveOf(db);
    s.respect = 1;
    const r = await send(db, s);
    expect(r.status).toBe(422);
    expect(db.rows.get('u1')!.respect).toBe(0);
  });

  it('save recusado devolve o save do servidor para o navegador voltar ao válido', async () => {
    const db = await setup();
    const s = saveOf(db);
    s.cash = 99_999_999;
    const r = await send(db, s);
    expect((r.body.save as { cash: number }).cash).toBe(500);
  });

  it('lixo no lugar do save é recusado sem derrubar o servidor', async () => {
    const db = await setup();
    for (const junk of [null, 'texto', 42, [], { level: 'x' }]) {
      const r = await send(db, junk);
      expect(r.status).toBe(422);
    }
  });
});

describe('servidor: duelo entre jogadores (R-DUELO-1 a R-DUELO-5)', () => {
  /** Dois jogadores; o atacante é bem mais forte, então ganha sempre (resultado estável). */
  const setup = async () => {
    const db = new FakeDb();
    await createPlayer(db, 'atk', 'Atacante');
    await createPlayer(db, 'def', 'Defensor', 'muralha');
    return db;
  };
  const strengthen = (db: FakeDb, id: string, extraPoints: number) => {
    const r = db.rows.get(id)!;
    r.save.points.attack += extraPoints;
    r.save.points.life += extraPoints;
    r.save.trainedPoints.attack += extraPoints;
    r.save.trainedPoints.life += extraPoints;
  };
  const duel = (db: FakeDb, now = db.clock) => handleOp(ctxFor(db, 'atk', now), { op: 'duel', opponentId: 'def' });

  it('o servidor luta, e o atacante forte vence e recebe cash, respeito e XP', async () => {
    const db = await setup();
    strengthen(db, 'atk', 400);
    const before = structuredClone(db.rows.get('atk')!);
    const r = await duel(db);
    expect(r.status).toBe(200);
    expect(r.body.won).toBe(true);
    expect((r.body.events as unknown[]).length).toBeGreaterThan(0);
    const rewards = r.body.rewards as { cash: number; respect: number; xp: number };
    expect(rewards).toMatchObject({ cash: DUEL.bountyBase + DUEL.bountyPerLevel * 1, respect: DUEL.respectWin, xp: DUEL.xpWin });
    const after = db.rows.get('atk')!;
    expect(after.save.cash).toBe(before.save.cash + rewards.cash);
    expect(after.respect).toBe(before.respect + DUEL.respectWin);
    expect(after.respect_duels).toBe(DUEL.respectWin);
    expect(after.duels_won).toBe(1);
    expect(after.duel_cash_earned).toBe(rewards.cash);
    expect(db.duels).toHaveLength(1);
    expect(db.duels[0].winner_id).toBe('atk');
  });

  it('quem é desafiado não perde respeito nem cash; só o placar muda', async () => {
    const db = await setup();
    strengthen(db, 'atk', 400);
    const before = structuredClone(db.rows.get('def')!);
    await duel(db);
    const after = db.rows.get('def')!;
    expect(after.respect).toBe(before.respect);
    expect(after.save.cash).toBe(before.save.cash);
    expect(after.duels_lost).toBe(1);
    expect(after.duels_won).toBe(0);
  });

  it('atacante fraco perde 10 de respeito, sem ganhar nada', async () => {
    const db = await setup();
    strengthen(db, 'def', 400);
    db.rows.get('atk')!.respect = 50;
    db.rows.get('atk')!.save.respect = 50;
    const r = await duel(db);
    expect(r.body.won).toBe(false);
    expect(r.body.rewards).toMatchObject({ cash: 0, respect: -DUEL.respectLoss, xp: 0 });
    const a = db.rows.get('atk')!;
    expect(a.respect).toBe(50 - DUEL.respectLoss);
    expect(a.duels_lost).toBe(1);
    expect(db.rows.get('def')!.duels_won).toBe(1);
  });

  it('o respeito nunca fica negativo', async () => {
    const db = await setup();
    strengthen(db, 'def', 400);
    const a = db.rows.get('atk')!;
    a.respect = 4;
    a.save.respect = 4;
    await duel(db);
    expect(db.rows.get('atk')!.respect).toBe(0);
  });

  it('duelo não gasta energia (decisão do fundador)', async () => {
    const db = await setup();
    strengthen(db, 'atk', 400);
    const e = db.rows.get('atk')!.save.energy;
    await duel(db);
    expect(db.rows.get('atk')!.save.energy).toBe(e);
  });

  it('a mesma semente dá sempre o mesmo duelo', async () => {
    const a = await setup();
    const b = await setup();
    const ra = await handleOp(ctxFor(a, 'atk', a.clock, 777), { op: 'duel', opponentId: 'def' });
    const rb = await handleOp(ctxFor(b, 'atk', b.clock, 777), { op: 'duel', opponentId: 'def' });
    expect(ra.body.events).toEqual(rb.body.events);
    expect(ra.body.won).toBe(rb.body.won);
  });

  it('não dá para duelar contra si mesmo nem contra quem não existe', async () => {
    const db = await setup();
    const self = await handleOp(ctxFor(db, 'atk'), { op: 'duel', opponentId: 'atk' });
    expect(self.status).toBe(429);
    expect(self.body.error).toBe('si_mesmo');
    const ghost = await handleOp(ctxFor(db, 'atk'), { op: 'duel', opponentId: 'fantasma' });
    expect(ghost.status).toBe(404);
  });

  it('duela com qualquer nível, sem faixa (decisão do fundador, R-DUELO-4)', async () => {
    const db = await setup();
    db.rows.get('def')!.level = 80;
    db.rows.get('def')!.save.level = 80;
    const r = await duel(db);
    expect(r.status).toBe(200);
    expect(db.duels).toHaveLength(1);
  });

  it('um duelo grátis a cada 10 min, contra qualquer rival; depois da espera libera (R-DUELO-4)', async () => {
    const db = await setup();
    await createPlayer(db, 'def2', 'Outro Rival', 'malandro');
    strengthen(db, 'atk', 400);
    expect((await duel(db)).status).toBe(200);
    const early = await duel(db, db.clock + 5 * MIN);
    expect(early.status).toBe(429);
    expect(early.body.error).toBe('espera');
    expect(early.body.costGold).toBe(DUEL.skipCooldownGold);
    expect(early.body.remainingMs).toBe(5 * MIN);
    // a espera vale para QUALQUER rival, não só o mesmo
    const other = await handleOp(ctxFor(db, 'atk', db.clock + 5 * MIN), { op: 'duel', opponentId: 'def2' });
    expect(other.status).toBe(429);
    expect(db.duels).toHaveLength(1);
    const later = await duel(db, db.clock + DUEL.cooldownMs + 1);
    expect(later.status).toBe(200);
  });

  it('125 de ouro liberam duelar antes da espera; sem ouro recusa e não cobra nada (R-DUELO-4)', async () => {
    const db = await setup();
    strengthen(db, 'atk', 400);
    expect((await duel(db)).status).toBe(200);
    const t = db.clock + 5 * MIN;
    const pay = (now: number) => handleOp(ctxFor(db, 'atk', now), { op: 'duel', opponentId: 'def', payGold: true });

    // só tem 25 de ouro (inicial): recusa
    const poor = await pay(t);
    expect(poor.status).toBe(422);
    expect(poor.body.error).toBe('sem_ouro');
    expect(db.rows.get('atk')!.save.gold).toBe(25);
    expect(db.duels).toHaveLength(1);

    // com 200 de ouro: paga 125 e duela
    db.rows.get('atk')!.save.gold = 200;
    const ok = await pay(t);
    expect(ok.status).toBe(200);
    expect(ok.body.goldSpent).toBe(DUEL.skipCooldownGold);
    // o duelo pago pode render XP e subir de nível (+125 de ouro, R-OURO-1)
    const subiu = (ok.body.rewards as { leveledUp: boolean }).leveledUp ? 125 : 0;
    expect(db.rows.get('atk')!.save.gold).toBe(200 - DUEL.skipCooldownGold + subiu);
    expect((ok.body.save as { gold: number }).gold).toBe(75 + subiu);
    expect(db.duels).toHaveLength(2);
  });

  it('com a espera acabada, payGold não cobra nada', async () => {
    const db = await setup();
    strengthen(db, 'atk', 400);
    db.rows.get('atk')!.save.gold = 200;
    const r = await handleOp(ctxFor(db, 'atk'), { op: 'duel', opponentId: 'def', payGold: true });
    expect(r.status).toBe(200);
    expect(r.body.goldSpent).toBe(0);
    expect(db.rows.get('atk')!.save.gold).toBe(200);
  });

  it('não há limite de duelos por hora: muitos duelos antigos não bloqueiam', async () => {
    const db = await setup();
    strengthen(db, 'atk', 400);
    for (let i = 0; i < 100; i++) {
      db.duels.push({
        attacker_id: 'atk', defender_id: `outro${i}`, winner_id: 'atk', seed: 1, rounds: 1,
        cash_won: 0, respect_delta: 0, created_at: '', ms: db.clock - 11 * MIN,
      });
    }
    expect((await duel(db)).status).toBe(200);
  });

  it('todo jogador começa com 0 de Respeito (R-RANKING-2)', async () => {
    const db = await setup();
    expect(db.rows.get('atk')!.respect).toBe(0);
    expect(db.rows.get('atk')!.save.respect).toBe(0);
  });

  it('o respeito de duelo não conta como respeito de missão na conferência do save', async () => {
    const db = await setup();
    strengthen(db, 'atk', 400);
    await duel(db);
    const row = db.rows.get('atk')!;
    const r = await handleOp(ctxFor(db, 'atk', db.clock + 30 * MIN), { op: 'save', save: structuredClone(row.save) });
    expect(r.status).toBe(200);
    expect(db.rows.get('atk')!.respect).toBe(row.respect);
  });
});

describe('servidor: requisição', () => {
  it('operação desconhecida é recusada', async () => {
    const db = new FakeDb();
    const r = await handleOp(ctxFor(db, 'u1'), { op: 'apagar_tudo' });
    expect(r.status).toBe(400);
  });

  it('erro do banco vira resposta genérica, sem detalhe interno', async () => {
    const db = new FakeDb();
    db.getPlayer = async () => {
      throw new Error('segredo interno: senha=123');
    };
    const r = await handleOp(ctxFor(db, 'u1'), { op: 'me' });
    expect(r.status).toBe(500);
    expect(JSON.stringify(r.body)).not.toContain('segredo');
  });
});
