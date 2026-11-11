import type { StyleId, Points } from '../engine/types.js';
import type { CharacterAppearance } from '../web/paperdoll.js';
import { SHOP_ITEMS, type GameItem } from '../web/gameData.js';

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
  /** Capacidade da mochila. Ausente em saves antigos = 10 (R-MOCHILA-1). */
  bagCapacity?: number;
  respect: number;

  points: Points; // Total base + level points
  trainedPoints: Points; // Points trained with cash
  freePoints: number; // Available to distribute on level up

  equipped: {
    /** Arma no espaço da arma. null = desarmado (luta com os punhos). */
    weaponId: string | null;
    armorId: string | null;
    accessoryId: string | null;
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
    gold: 25,
    energy: 100,
    maxEnergy: 100,
    respect: 120,
    points: initialPoints,
    trainedPoints: { attack: 0, life: 0, astucia: 0, tenacidade: 0 },
    freePoints: 0,
    equipped: {
      weaponId: startingWeaponId,
      armorId: null,
      accessoryId: null,
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
 * Soma XP ao jogador e sobe de nível quantas vezes couber (4 pontos livres, energia cheia e
 * bônus de cash por nível). Retorna true se subiu de nível. Não salva nem avisa ninguém.
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
    p.xpToNextLevel = calculateXpForLevel(p.level);
    leveledUp = true;
  }
  return leveledUp;
}

/** Pontos efetivos de combate: os do personagem mais os bônus da armadura e do acessório equipados. */
export function combatPointsOf(p: Pick<PlayerState, 'points' | 'equipped'>): Points {
  const pts: Points = { ...p.points };
  for (const itemId of [p.equipped.armorId, p.equipped.accessoryId]) {
    if (!itemId) continue;
    const bonus = SHOP_ITEMS.find(i => i.id === itemId)?.statsBonus;
    if (!bonus) continue;
    if (bonus.attack) pts.attack += bonus.attack;
    if (bonus.life) pts.life += bonus.life;
    if (bonus.astucia) pts.astucia += bonus.astucia;
    if (bonus.tenacidade) pts.tenacidade += bonus.tenacidade;
  }
  return pts;
}
