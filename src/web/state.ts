import type { StyleId, Points } from '../engine/types.js';
import type { CharacterAppearance } from './paperdoll.js';
import { DEFAULT_CARRASCO, DEFAULT_MURALHA, DEFAULT_MALANDRO } from './paperdoll.js';
import { SHOP_ITEMS, type GameItem } from './gameData.js';

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
  respect: number;

  points: Points; // Total base + level points
  trainedPoints: Points; // Points trained with cash
  freePoints: number; // Available to distribute on level up

  equipped: {
    weaponId: string;
    armorId: string | null;
    accessoryId: string | null;
    consumables: (string | null)[];
  };

  inventory: GameItem[];
  appearance: CharacterAppearance;
  familyId: string | null;
  statsRecord: PlayerStatsRecord;
}

const STORAGE_KEY = 'gangster_rpg_save_v1';

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

export class GameStateManager {
  private player: PlayerState;
  private listeners: (() => void)[] = [];

  constructor() {
    this.player = this.loadFromStorage();
  }

  getPlayer(): PlayerState {
    return this.player;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.saveToStorage();
    this.listeners.forEach(fn => fn());
  }

  private loadFromStorage(): PlayerState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.hasCreatedCharacter) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Falha ao carregar save local, gerando inicial:', e);
    }

    // Default placeholder awaiting character creation
    return {
      hasCreatedCharacter: false,
      name: 'Vincenzo "O Carrasco"',
      style: 'carrasco',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      cash: 500,
      gold: 25,
      energy: 100,
      maxEnergy: 100,
      respect: 100,
      points: { attack: 12, life: 8, astucia: 10, tenacidade: 10 },
      trainedPoints: { attack: 0, life: 0, astucia: 0, tenacidade: 0 },
      freePoints: 0,
      equipped: {
        weaponId: 'colt_1911',
        armorId: null,
        accessoryId: null,
        consumables: [null, null, null],
      },
      inventory: [],
      appearance: { ...DEFAULT_CARRASCO },
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

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.player));
    } catch (e) {
      console.error('Falha ao persistir save local:', e);
    }
  }

  resetAllProgress() {
    localStorage.removeItem(STORAGE_KEY);
    this.player = this.loadFromStorage();
    this.notify();
  }

  // ==========================================
  // PROGRESSION & STATS
  // ==========================================
  addXp(amount: number): boolean {
    this.player.xp += amount;
    let leveledUp = false;

    while (this.player.xp >= this.player.xpToNextLevel && this.player.level < 100) {
      this.player.xp -= this.player.xpToNextLevel;
      this.player.level += 1;
      this.player.freePoints += 4; // 4 free points per level
      this.player.energy = this.player.maxEnergy; // Refill energy on level up
      this.player.cash += this.player.level * 150; // Level up cash bonus
      this.player.xpToNextLevel = calculateXpForLevel(this.player.level);
      leveledUp = true;
    }

    this.notify();
    return leveledUp;
  }

  addCash(amount: number) {
    this.player.cash += amount;
    this.notify();
  }

  spendCash(amount: number): boolean {
    if (this.player.cash < amount) return false;
    this.player.cash -= amount;
    this.notify();
    return true;
  }

  addGold(amount: number) {
    this.player.gold += amount;
    this.notify();
  }

  spendGold(amount: number): boolean {
    if (this.player.gold < amount) return false;
    this.player.gold -= amount;
    this.notify();
    return true;
  }

  addEnergy(amount: number) {
    this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + amount);
    this.notify();
  }

  consumeEnergy(amount: number): boolean {
    if (this.player.energy < amount) return false;
    this.player.energy -= amount;
    this.notify();
    return true;
  }

  addRespect(amount: number) {
    this.player.respect += amount;
    this.notify();
  }

  distributeFreePoint(column: keyof Points): boolean {
    if (this.player.freePoints <= 0) return false;
    this.player.freePoints -= 1;
    this.player.points[column] += 1;
    this.notify();
    return true;
  }

  trainStatWithCash(column: keyof Points): boolean {
    const cost = getStatTrainingCost(column, this.player.trainedPoints[column], this.player.level);
    if (!this.spendCash(cost)) return false;

    this.player.trainedPoints[column] += 1;
    this.player.points[column] += 1;
    this.notify();
    return true;
  }

  // ==========================================
  // INVENTORY & EQUIPMENT
  // ==========================================
  buyItem(item: GameItem): boolean {
    if (this.player.level < item.levelReq) return false;
    if (item.priceGold > 0) {
      if (!this.spendGold(item.priceGold)) return false;
    }
    if (item.priceCash > 0) {
      if (!this.spendCash(item.priceCash)) return false;
    }

    this.player.inventory.push({ ...item });

    // Auto-equip if weapon and no weapon equipped
    if (item.type === 'weapon' && item.weaponRefId) {
      this.player.equipped.weaponId = item.weaponRefId;
    } else if (item.type === 'armor' && !this.player.equipped.armorId) {
      this.player.equipped.armorId = item.id;
    } else if (item.type === 'accessory' && !this.player.equipped.accessoryId) {
      this.player.equipped.accessoryId = item.id;
    }

    this.notify();
    return true;
  }

  sellItem(index: number): boolean {
    if (index < 0 || index >= this.player.inventory.length) return false;
    const item = this.player.inventory[index];

    // Un-equip if equipped
    if (item.type === 'weapon' && item.weaponRefId === this.player.equipped.weaponId) {
      this.player.equipped.weaponId = 'revolver_38'; // fallback to basic revolver
    }
    if (item.id === this.player.equipped.armorId) this.player.equipped.armorId = null;
    if (item.id === this.player.equipped.accessoryId) this.player.equipped.accessoryId = null;

    const sellRefund = Math.round(item.priceCash * 0.5);
    this.addCash(sellRefund);

    this.player.inventory.splice(index, 1);
    this.notify();
    return true;
  }

  equipWeapon(weaponId: string) {
    this.player.equipped.weaponId = weaponId;
    this.notify();
  }

  equipArmor(armorId: string | null) {
    this.player.equipped.armorId = armorId;
    this.notify();
  }

  equipAccessory(accId: string | null) {
    this.player.equipped.accessoryId = accId;
    this.notify();
  }

  useConsumable(item: GameItem, invIndex: number): boolean {
    if (item.type !== 'consumable' || !item.consumableEffect) return false;

    if (item.consumableEffect.type === 'energy') {
      this.addEnergy(item.consumableEffect.value);
    } else if (item.consumableEffect.type === 'cash') {
      this.addCash(item.consumableEffect.value);
    }

    this.player.inventory.splice(invIndex, 1);
    this.notify();
    return true;
  }

  joinFamily(familyId: string) {
    this.player.familyId = familyId;
    this.notify();
  }

  recordDuelResult(won: boolean, damageDealt: number) {
    if (won) this.player.statsRecord.duelsWon += 1;
    else this.player.statsRecord.duelsLost += 1;
    this.player.statsRecord.totalDamageDealt += damageDealt;
    this.notify();
  }

  recordMissionCompleted() {
    this.player.statsRecord.missionsCompleted += 1;
    this.notify();
  }

  /**
   * Returns total effective points taking gear stats bonuses into account
   */
  getCombatPoints(): Points {
    const pts: Points = { ...this.player.points };

    // Add armor bonus if equipped
    if (this.player.equipped.armorId) {
      const arm = SHOP_ITEMS.find(i => i.id === this.player.equipped.armorId);
      if (arm?.statsBonus) {
        if (arm.statsBonus.attack) pts.attack += arm.statsBonus.attack;
        if (arm.statsBonus.life) pts.life += arm.statsBonus.life;
        if (arm.statsBonus.astucia) pts.astucia += arm.statsBonus.astucia;
        if (arm.statsBonus.tenacidade) pts.tenacidade += arm.statsBonus.tenacidade;
      }
    }

    // Add accessory bonus if equipped
    if (this.player.equipped.accessoryId) {
      const acc = SHOP_ITEMS.find(i => i.id === this.player.equipped.accessoryId);
      if (acc?.statsBonus) {
        if (acc.statsBonus.attack) pts.attack += acc.statsBonus.attack;
        if (acc.statsBonus.life) pts.life += acc.statsBonus.life;
        if (acc.statsBonus.astucia) pts.astucia += acc.statsBonus.astucia;
        if (acc.statsBonus.tenacidade) pts.tenacidade += acc.statsBonus.tenacidade;
      }
    }

    return pts;
  }
}

export const gameState = new GameStateManager();

