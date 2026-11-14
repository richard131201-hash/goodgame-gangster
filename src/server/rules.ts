import { z } from 'zod';
import type { BalanceConfig } from '../engine/schema.js';
import type { FighterInput, FightEvent, StyleId } from '../engine/types.js';
import { simulateFight } from '../engine/fight.js';
import { getWeaponById, WEAPONS_CATALOG, FISTS } from '../engine/weapons.js';
import { SHOP_ITEMS, MAFIA_FAMILIES_LIST } from '../web/gameData.js';
import { buildGearItem, gearProblem } from '../shared/gear.js';
import { ITEM_SLOTS, type ItemSlot } from '../shared/itemRoll.js';
import type { CharacterAppearance } from '../web/paperdoll.js';
import { DUEL, duelBounty } from '../shared/duel.js';
import { goldCap } from '../shared/gold.js';
import { bagOpenOf, validBagOpen, bagOpenCost, bagCapacityFromOpen } from '../shared/bag.js';
import { validateCharacterName, cleanCharacterName } from '../web/authRules.js';
import {
  applyXp,
  calculateXpForLevel,
  combatPointsOf,
  createNewPlayer,
  MAX_LEVEL,
  POINTS_PER_LEVEL,
  STARTING_POINTS_TOTAL,
  type PlayerState,
} from '../shared/player.js';

/**
 * Regras do SERVIDOR (R-SERVIDOR-*, R-DUELO-*). Código puro: não conhece banco nem rede, por isso
 * dá para testar tudo sem internet. O banco e a rede ficam em handlers.ts e em api/game.ts.
 *
 * O que o servidor garante hoje:
 *  - o navegador NUNCA escreve no banco; só o servidor escreve (chave service_role);
 *  - nome único, uma conta = um personagem, e o personagem nasce do zero no servidor;
 *  - o que o navegador manda é conferido por regras de coerência e de ritmo (LIMITS);
 *  - respeito e vitórias/derrotas de duelo são do servidor;
 *  - o duelo é resolvido inteiro no servidor (o navegador só reproduz o replay).
 *
 * O que ainda NÃO é à prova de trapaça: missões, loja e treino ainda são calculadas no navegador
 * (a tarefa D2 move isso para o servidor). Por isso LIMITS é um freio de ritmo, não uma parede.
 */

// ---------------------------------------------------------------------------------------------
// Constantes (valores de partida, a calibrar com jogadores reais)
// ---------------------------------------------------------------------------------------------
export const LIMITS = {
  /** Nível máximo = folga + este valor por minuto de vida do personagem. */
  levelPerMin: 0.5,
  levelSlack: 2,
  /** Missões cumpridas máximas = folga + este valor por minuto de vida do personagem. */
  missionsPerMin: 1,
  missionsSlack: 5,
  /** Respeito vindo de missões: base 0 (todo jogador começa com 0) + isto por missão cumprida + folga (evento de raide etc.). */
  /** Cash: folga + por missão + bônus de nível + o que o servidor pagou em duelos. */
  cashSlack: 20000,
  cashPerMission: 2500,
  /** Ouro não tem fonte no jogo ainda: nunca passa do inicial. */
  /** Itens na mochila (inclui a arma equipada). */
  inventoryMax: 40,
  bagCapacity: 10,
  maxEnergy: 100,
} as const;

export { DUEL, duelBounty };

export const STARTER_WEAPON_IDS = ['colt_1911', 'double_barrel', 'tommy_gun'] as const;
const STYLES: StyleId[] = ['carrasco', 'muralha', 'malandro'];

// ---------------------------------------------------------------------------------------------
// Linha do banco (tabela players)
// ---------------------------------------------------------------------------------------------
export interface DbPlayerRow {
  id: string;
  name: string;
  style: StyleId;
  level: number;
  respect: number;
  family_id: string | null;
  appearance: CharacterAppearance;
  save: PlayerState;
  duels_won: number;
  duels_lost: number;
  /** Parte do respeito que veio de duelos (soma, pode ser negativa). O resto vem de missões. */
  respect_duels: number;
  /** Total de cash que o servidor pagou em duelos (entra no teto de cash). */
  duel_cash_earned: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------------------------
// Criação do personagem
// ---------------------------------------------------------------------------------------------
const HEX = /^#[0-9a-fA-F]{6}$/;
const GENDERS = ['male', 'female'];
const HAIR = ['slick', 'pompadour', 'messy', 'buzz', 'bob', 'wavy', 'bald', 'side_part', 'curly', 'updo'];
const FACIAL = ['none', 'mustache', 'goatee', 'stubble', 'beard', 'handlebar', 'vandyke'];
const CLOTHING = ['pinstripe_suit', 'trenchcoat', 'vest_suspenders', 'leather_jacket', 'classic_suit', 'turtleneck', 'flapper_dress'];
const ACCESSORY = ['none', 'fedora', 'sunglasses', 'cigar', 'scar', 'gold_chain', 'eyepatch', 'monocle', 'earring', 'flower'];
const HAT = ['none', 'fedora', 'flat_cap', 'bowler'];
const BACKGROUND = ['alley', 'bar', 'bank', 'dock'];

const oneOf = (list: string[]) => z.string().refine(v => list.includes(v), 'opção inválida');
const hex = z.string().regex(HEX, 'cor inválida');

const appearanceSchema = z.object({
  gender: oneOf(GENDERS),
  skinTone: hex,
  hairStyle: oneOf(HAIR),
  hairColor: hex,
  eyeColor: hex,
  facialHair: oneOf(FACIAL),
  facialHairColor: hex,
  clothing: oneOf(CLOTHING),
  clothingColor: hex,
  clothingSecondaryColor: hex,
  accessory: oneOf(ACCESSORY),
  hat: oneOf(HAT).optional(),
  cardBackground: oneOf(BACKGROUND),
});

const createSchema = z.object({
  name: z.string(),
  style: oneOf(STYLES),
  weapon: oneOf([...STARTER_WEAPON_IDS]),
  appearance: appearanceSchema,
});

export type CreateResult =
  | { ok: true; player: PlayerState }
  | { ok: false; error: 'invalido'; message: string };

/** Monta o personagem novo a partir do que o jogador escolheu. Sempre nasce do zero. */
export function buildNewPlayer(input: unknown, now: number): CreateResult {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalido', message: 'Dados do personagem inválidos.' };
  const name = cleanCharacterName(parsed.data.name);
  const nameProblem = validateCharacterName(name);
  if (nameProblem) return { ok: false, error: 'invalido', message: nameProblem };

  const appearance = { ...parsed.data.appearance, name } as CharacterAppearance;
  const player = createNewPlayer(name, parsed.data.style as StyleId, appearance, parsed.data.weapon);
  player.lastEnergyAt = now;
  return { ok: true, player };
}

/** Colunas da tabela a partir do save (o save é a verdade; as colunas servem ao ranking). */
export function rowColumns(p: PlayerState, extra: { respect_duels: number }) {
  return {
    name: p.name,
    style: p.style,
    level: p.level,
    respect: p.respect,
    family_id: p.familyId,
    appearance: p.appearance,
    save: p,
    respect_duels: extra.respect_duels,
  };
}

// ---------------------------------------------------------------------------------------------
// Conferência do save enviado pelo navegador
// ---------------------------------------------------------------------------------------------
const num = z.number().finite();
const int = z.number().int().finite();
const nonNeg = int.min(0).max(1_000_000_000);
const pointsSchema = z.object({
  attack: int.min(0).max(1_000_000),
  life: int.min(0).max(1_000_000),
  astucia: int.min(0).max(1_000_000),
  tenacidade: int.min(0).max(1_000_000),
});
const idOrNull = z.string().max(64).nullable();

const saveSchema = z.object({
  level: int.min(1).max(MAX_LEVEL),
  xp: nonNeg,
  cash: nonNeg,
  gold: nonNeg,
  energy: int.min(0).max(LIMITS.maxEnergy),
  lastEnergyAt: num.optional(),
  bagCapacity: int.optional(),
  bagOpen: z.array(int).max(10).optional(),
  respect: int.min(0).max(1_000_000),
  points: pointsSchema,
  trainedPoints: pointsSchema,
  freePoints: int.min(0).max(1_000_000),
  equipped: z.object({
    weaponId: idOrNull,
    // itens dos 8 slots: slot -> id do item na mochila (R-ITEM-2)
    gear: z.record(z.string(), z.string().max(64)).optional(),
    consumables: z.array(idOrNull).max(3),
  }),
  shopSerial: int.min(0).max(1_000_000).optional(),
  inventory: z
    .array(
      z.object({
        id: z.string().max(64),
        slot: z.number().int().min(0).max(LIMITS.inventoryMax).optional(),
        gear: z.object({ slot: z.string().max(16), level: int, points: pointsSchema, variant: int }).optional(),
      }),
    )
    .max(LIMITS.inventoryMax),
  familyId: idOrNull,
  statsRecord: z.object({
    missionsCompleted: nonNeg,
    totalDamageDealt: nonNeg,
    highestCrit: nonNeg,
  }),
});

export type SaveResult =
  | { ok: true; save: PlayerState }
  | { ok: false; reason: string };

const sum = (p: { attack: number; life: number; astucia: number; tenacidade: number }) =>
  p.attack + p.life + p.astucia + p.tenacidade;

/** Idade do personagem em minutos (nunca negativa). */
export function ageMinutes(createdAtIso: string, now: number): number {
  return Math.max(0, (now - Date.parse(createdAtIso)) / 60000);
}

/** Maior nível que um personagem com essa idade pode ter pelo ritmo do jogo. */
export function maxLevelForAge(ageMin: number): number {
  return Math.min(MAX_LEVEL, Math.floor(LIMITS.levelSlack + LIMITS.levelPerMin * ageMin) + 1);
}

/**
 * Confere o save que o navegador mandou e devolve o save que o servidor aceita.
 * Parte do save do servidor (`db.save`) e só troca o que o navegador pode mudar.
 * Nome, classe, aparência e vitórias/derrotas de duelo NUNCA vêm do navegador.
 */
export function validateSave(db: DbPlayerRow, raw: unknown, now: number): SaveResult {
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: 'save com formato inválido' };
  const n = parsed.data;
  const age = ageMinutes(db.created_at, now);

  // Nível, XP e pontos precisam fechar a conta
  if (n.level < db.save.level) return { ok: false, reason: 'o nível não pode diminuir' };
  if (n.level > maxLevelForAge(age)) return { ok: false, reason: 'nível acima do ritmo possível do jogo' };
  if (n.xp >= calculateXpForLevel(n.level) && n.level < MAX_LEVEL) return { ok: false, reason: 'XP incoerente com o nível' };
  const trained = sum(n.trainedPoints);
  const expectedPoints = STARTING_POINTS_TOTAL + POINTS_PER_LEVEL * (n.level - 1) + trained;
  if (sum(n.points) + n.freePoints !== expectedPoints) return { ok: false, reason: 'pontos de atributo incoerentes com o nível' };
  for (const k of ['attack', 'life', 'astucia', 'tenacidade'] as const) {
    if (n.points[k] < n.trainedPoints[k]) return { ok: false, reason: 'pontos treinados incoerentes' };
  }

  // Missões e respeito
  const missions = n.statsRecord.missionsCompleted;
  if (missions < db.save.statsRecord.missionsCompleted) return { ok: false, reason: 'missões cumpridas não podem diminuir' };
  if (missions > LIMITS.missionsSlack + LIMITS.missionsPerMin * age) return { ok: false, reason: 'missões acima do ritmo possível' };
  const respect = Math.max(n.respect, db.respect); // o navegador nunca diminui o respeito
  const missionRespect = respect - db.respect_duels;
  if (missionRespect > 0) {
    // Respeito só vem de duelos (e o servidor soma esses). Qualquer Respeito fora dos duelos é inventado.
    return { ok: false, reason: 'respeito que não veio de duelo' };
  }

  // Dinheiro
  // goldGrant: ouro concedido pelo fundador, gravado só no banco (o navegador não consegue enviar esse campo)
  const goldGrant = Math.max(0, Math.floor(Number(db.save.goldGrant ?? 0)) || 0);
  if (n.gold > goldCap(n.level, missions) + goldGrant) return { ok: false, reason: 'ouro acima do possível' };
  const cashCap =
    LIMITS.cashSlack +
    LIMITS.cashPerMission * (missions + 1) +
    (150 * n.level * (n.level + 1)) / 2 +
    db.duel_cash_earned;
  if (n.cash > cashCap) return { ok: false, reason: 'cash acima do que o jogo pode ter dado' };

  // Mochila: itens do catálogo (o servidor usa os dados do catálogo, nunca os do navegador) ou itens dos 8 slots,
  // que o servidor refaz a partir de slot, nível, pontos e aparência depois de conferir a coerência (R-ITEM-2).
  const inventory = [];
  // Só os itens dos 8 slots têm id único (cada um é um item diferente). Itens do catálogo (armas, consumáveis)
  // podem se repetir na Mala: dois uísques têm o mesmo id (defeito corrigido em 2026-11-12: o servidor recusava o save).
  const seenGearIds = new Set<string>();
  for (const it of n.inventory) {
    if (it.gear) {
      if (seenGearIds.has(it.id)) return { ok: false, reason: `item repetido (${it.id})` };
      seenGearIds.add(it.id);
    }
    let item;
    if (it.gear) {
      if (!/^g_[a-z]+_[a-z0-9_]+$/.test(it.id)) return { ok: false, reason: 'id de item inválido' };
      const g = { ...it.gear, slot: it.gear.slot as ItemSlot };
      const problem = gearProblem(g, n.level);
      if (problem) return { ok: false, reason: problem };
      item = buildGearItem(it.id, g);
    } else {
      item = SHOP_ITEMS.find(i => i.id === it.id);
      if (!item) return { ok: false, reason: `item desconhecido (${it.id})` };
    }
    inventory.push(it.slot === undefined ? { ...item } : { ...item, slot: it.slot });
  }
  const shopSerial = n.shopSerial ?? 0;
  if (shopSerial < (db.save.shopSerial ?? 0)) return { ok: false, reason: 'o contador da loja não pode diminuir' };
  // Slots da Mala (R-MALA-12): comprados um a um, a fileira de baixo só depois da de cima completa, e nunca diminuem
  const previousOpen = bagOpenOf(db.save);
  const bagOpen = n.bagOpen ?? bagOpenOf({ bagCapacity: n.bagCapacity ?? LIMITS.bagCapacity });
  if (!validBagOpen(bagOpen)) return { ok: false, reason: 'capacidade da mochila inválida' };
  const bagCapacity = bagCapacityFromOpen(bagOpen);
  if (n.bagCapacity !== undefined && n.bagCapacity !== bagCapacity) return { ok: false, reason: 'capacidade da mochila inválida' };
  if (!previousOpen.every(slot => bagOpen.includes(slot))) return { ok: false, reason: 'a mochila não pode diminuir' };
  // quem comprou slots pagou em ouro: o ouro que sobrou mais o preço dos slots novos não pode passar do que era possível ter
  const bagCost = bagOpenCost(previousOpen, bagOpen);
  if (bagCost > 0 && n.gold + bagCost > goldCap(n.level, missions) + goldGrant) return { ok: false, reason: 'mala maior sem ouro para pagar' };

  // Equipamento: precisa existir e estar na mochila
  const { weaponId } = n.equipped;
  if (weaponId) {
    if (!WEAPONS_CATALOG.some(w => w.id === weaponId)) return { ok: false, reason: 'arma equipada desconhecida' };
    if (!inventory.some(i => i.weaponRefId === weaponId)) return { ok: false, reason: 'arma equipada não está na mochila' };
  }
  const gear: Partial<Record<ItemSlot, string>> = {};
  for (const [slot, id] of Object.entries(n.equipped.gear ?? {})) {
    if (!(ITEM_SLOTS as readonly string[]).includes(slot)) return { ok: false, reason: 'slot de equipamento desconhecido' };
    const found = inventory.find(i => i.id === id);
    if (!found || found.gear?.slot !== slot) return { ok: false, reason: 'equipamento não está na mochila ou é de outro slot' };
    gear[slot as ItemSlot] = id;
  }
  if (n.familyId && !MAFIA_FAMILIES_LIST.some(f => f.id === n.familyId)) return { ok: false, reason: 'família desconhecida' };

  const save: PlayerState = {
    ...db.save,
    level: n.level,
    xp: n.xp,
    xpToNextLevel: calculateXpForLevel(n.level),
    cash: n.cash,
    gold: n.gold,
    energy: n.energy,
    maxEnergy: LIMITS.maxEnergy,
    lastEnergyAt: n.lastEnergyAt,
    bagCapacity,
    bagOpen,
    respect,
    points: n.points,
    trainedPoints: n.trainedPoints,
    freePoints: n.freePoints,
    shopSerial,
    equipped: {
      weaponId: weaponId ?? null,
      gear,
      consumables: [...n.equipped.consumables, null, null, null].slice(0, 3),
    },
    inventory,
    familyId: n.familyId,
    statsRecord: {
      duelsWon: db.save.statsRecord.duelsWon, // do servidor
      duelsLost: db.save.statsRecord.duelsLost, // do servidor
      missionsCompleted: missions,
      totalDamageDealt: n.statsRecord.totalDamageDealt,
      highestCrit: n.statsRecord.highestCrit,
    },
  };
  return { ok: true, save };
}

// ---------------------------------------------------------------------------------------------
// Duelo
// ---------------------------------------------------------------------------------------------
/** A luta de um jogador: classe, nível, pontos (com bônus de armadura/acessório) e a arma equipada. */
export function combatInputOf(p: PlayerState): FighterInput {
  const weapon = p.equipped.weaponId ? getWeaponById(p.equipped.weaponId) : FISTS;
  return { style: p.style, level: p.level, points: combatPointsOf(p), weapon };
}

/** Por que o duelo não pode acontecer, qualquer que seja a espera (ou null se pode). */
export function duelBlockReason(attacker: DbPlayerRow, defender: DbPlayerRow): 'si_mesmo' | null {
  return attacker.id === defender.id ? 'si_mesmo' : null;
}

/** Quanto falta (ms) para o próximo duelo grátis do atacante; 0 se já pode. Vale para qualquer rival. */
export function duelCooldownLeftMs(lastDuelAt: number | null, now: number): number {
  if (lastDuelAt === null) return 0;
  return Math.max(0, DUEL.cooldownMs - (now - lastDuelAt));
}

export interface DuelOutcome {
  won: boolean;
  seed: number;
  rounds: number;
  firstAttacker: 'A' | 'B';
  events: FightEvent[];
  attackerInput: FighterInput;
  defenderInput: FighterInput;
  rewards: { cash: number; respect: number; xp: number; leveledUp: boolean };
  /** Save novo do atacante (com as recompensas) e do defensor (só o placar muda). */
  attackerSave: PlayerState;
  defenderSave: PlayerState;
  attackerRespectDuelsDelta: number;
}

/**
 * Resolve o duelo inteiro: luta com o motor, paga recompensas ao atacante e atualiza o placar.
 * O atacante é sempre o lado A. Quem é desafiado não perde respeito nem nada (R-DUELO-3).
 */
export function resolveDuel(
  attacker: DbPlayerRow,
  defender: DbPlayerRow,
  seed: number,
  config: BalanceConfig,
): DuelOutcome {
  const attackerInput = combatInputOf(attacker.save);
  const defenderInput = combatInputOf(defender.save);
  const fight = simulateFight(attackerInput, defenderInput, config, seed, { withEvents: true });
  const won = fight.winner === 'A';

  const aSave: PlayerState = structuredClone(attacker.save);
  const dSave: PlayerState = structuredClone(defender.save);
  let cash = 0;
  let xp = 0;
  let leveledUp = false;
  let respectDelta: number;

  if (won) {
    cash = duelBounty(defender.level);
    xp = DUEL.xpWin;
    aSave.cash += cash;
    leveledUp = applyXp(aSave, xp);
    respectDelta = DUEL.respectWin;
    aSave.statsRecord.duelsWon += 1;
    dSave.statsRecord.duelsLost += 1;
  } else {
    respectDelta = -Math.min(DUEL.respectLoss, aSave.respect); // respeito nunca fica negativo
    aSave.statsRecord.duelsLost += 1;
    dSave.statsRecord.duelsWon += 1;
  }
  aSave.respect += respectDelta;

  return {
    won,
    seed,
    rounds: fight.rounds,
    firstAttacker: fight.firstAttacker,
    events: fight.events ?? [],
    attackerInput,
    defenderInput,
    rewards: { cash, respect: respectDelta, xp, leveledUp },
    attackerSave: aSave,
    defenderSave: dSave,
    attackerRespectDuelsDelta: respectDelta,
  };
}
