import type { StyleId, Points } from '../engine/types.js';
import type { CharacterAppearance } from '../web/paperdoll.js';
import { SHOP_ITEMS, type GameItem } from '../web/gameData.js';
import { GOLD } from './gold.js';
import type { ItemSlot } from './itemRoll.js';

/**
 * Modelo do jogador e contas puras (sem tela, sem navegador).
 * Roda igual no jogo (navegador) e no servidor (Vercel), por isso a regra é uma só.
 */
export interface PlayerStatsRecord {
  duelsWon: number;
  duelsLost: number;
  missionsCompleted: number;
  totalDamageDealt: number;
  highestCrit: number;
}

export interface PlayerState {
  hasCreatedCharacter: boolean;
  name: string;
  style: StyleId;
  level: number;
  xp: number;
  xpToNextLevel: number;
  cash: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  /** Marca de tempo (ms) da última regeneração de energia. Ausente em saves antigos. */
  lastEnergyAt?: number;
  /** Sobe a cada compra de item da loja e muda o estoque (R-ITEM-2). Ausente = 0. */
  shopSerial?: number;
  /** Capacidade da mochila. Ausente em saves antigos = 10 (R-MOCHILA-1). */
  bagCapacity?: number;
  /** Slots da Mala comprados (posições 10 a 19), um a um (R-MALA-12). Ausente em saves antigos: vale a capacidade. */
  bagOpen?: number[];
  respect: number;

  points: Points; // Total base + level points
  trainedPoints: Points; // Points trained with cash
  freePoints: number; // Available to distribute on level up

  equipped: {
    /** Arma no espaço da arma. null = desarmado (luta com os punhos). */
    weaponId: string | null;
    /** Item equipado em cada um dos 8 slots do perfil (id do item na Mala) (R-ITEM-2). */
    gear: Partial<Record<ItemSlot, string>>;
    consumables: (string | null)[];
  };

  inventory: GameItem[];
  appearance: CharacterAppearance;
  familyId: string | null;
  statsRecord: PlayerStatsRecord;
}

/** Pontos de atributo com que todo personagem nasce (soma fixa). */
export const STARTING_POINTS_TOTAL = 40;
/** Pontos livres ganhos por nível. */
export const POINTS_PER_LEVEL = 4;
export const MAX_LEVEL = 100;

export function calculateXpForLevel(lvl: number): number {
  return Math.round(100 * Math.pow(1.24, lvl - 1));
}

/**
 * Calculates training cost in Cash according to GAME_DESIGN.md:
 * - Astucia and Tenacidade cost 1/5 of Attack and Life.
 * - Cost scales with already trained points and character level.
 */
export function getStatTrainingCost(column: keyof Points, trainedCount: number, level: number): number {
  const isCheap = column === 'astucia' || column === 'tenacidade';
  const baseCost = isCheap ? 20 : 100;
  return Math.round(baseCost * (1 + trainedCount * 0.15) * (1 + (level - 1) * 0.06));
}

export function createNewPlayer(
  name: string,
  style: StyleId,
  appearance: CharacterAppearance,
  startingWeaponId: string = 'colt_1911'
): PlayerState {
  // 40 initial points (8-12 each)
  const initialPoints: Points = {
    attack: style === 'carrasco' ? 12 : style === 'muralha' ? 8 : 10,
    life: style === 'muralha' ? 12 : style === 'carrasco' ? 8 : 10,
    astucia: style === 'malandro' ? 12 : 10,
    tenacidade: 40 - (
      (style === 'carrasco' ? 12 : style === 'muralha' ? 8 : 10) +
      (style === 'muralha' ? 12 : style === 'carrasco' ? 8 : 10) +
      (style === 'malandro' ? 12 : 10)
    ),
  };

  const starterWeaponItem = SHOP_ITEMS.find(i => i.weaponRefId === startingWeaponId) || SHOP_ITEMS[0];
  const starterWhisky = SHOP_ITEMS.find(i => i.id === 'cons_whisky');

  return {
    hasCreatedCharacter: true,
    name,
    style,
    level: 1,
    xp: 0,
    xpToNextLevel: calculateXpForLevel(1),
    cash: 500,
    gold: GOLD.start,
    energy: 100,
    maxEnergy: 100,
    respect: 0,
    points: initialPoints,
    trainedPoints: { attack: 0, life: 0, astucia: 0, tenacidade: 0 },
    freePoints: 0,
    equipped: {
      weaponId: startingWeaponId,
      gear: {},
      consumables: [null, null, null],
    },
    inventory: [
      starterWeaponItem,
      ...(starterWhisky ? [starterWhisky] : []),
    ],
    appearance,
    familyId: null,
    statsRecord: {
      duelsWon: 0,
      duelsLost: 0,
      missionsCompleted: 0,
      totalDamageDealt: 0,
      highestCrit: 0,
    },
  };
}

/**
 * Soma XP ao jogador e sobe de nível quantas vezes couber (4 pontos livres, energia cheia,
 * bônus de cash e 125 de ouro por nível). Retorna true se subiu de nível. Não salva nem avisa ninguém.
 */
export function applyXp(p: PlayerState, amount: number): boolean {
  p.xp += amount;
  let leveledUp = false;
  while (p.xp >= p.xpToNextLevel && p.level < MAX_LEVEL) {
    p.xp -= p.xpToNextLevel;
    p.level += 1;
    p.freePoints += POINTS_PER_LEVEL;
    p.energy = p.maxEnergy; // Refill energy on level up
    p.cash += p.level * 150; // Level up cash bonus
    p.gold += GOLD.perLevel; // 125 de ouro por nível (R-OURO-1)
    p.xpToNextLevel = calculateXpForLevel(p.level);
    leveledUp = true;
  }
  return leveledUp;
}

/** Pontos efetivos de combate: os do personagem mais os pontos dos itens dos 8 slots que estão equipados. */
export function combatPointsOf(p: Pick<PlayerState, 'points' | 'equipped' | 'inventory'>): Points {
  const pts: Points = { ...p.points };
  for (const itemId of Object.values(p.equipped.gear ?? {})) {
    if (!itemId) continue;
    const bonus = p.inventory.find(i => i.id === itemId && i.type === 'gear')?.statsBonus;
    if (!bonus) continue;
    if (bonus.attack) pts.attack += bonus.attack;
    if (bonus.life) pts.life += bonus.life;
    if (bonus.astucia) pts.astucia += bonus.astucia;
    if (bonus.tenacidade) pts.tenacidade += bonus.tenacidade;
  }
  return pts;
}
