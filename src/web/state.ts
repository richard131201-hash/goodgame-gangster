import type { StyleId, Points } from '../engine/types.js';
import type { CharacterAppearance } from './paperdoll.js';
import { DEFAULT_CARRASCO, DEFAULT_MURALHA, DEFAULT_MALANDRO } from './paperdoll.js';
import { SHOP_ITEMS, MAFIA_FAMILIES_LIST, type GameItem } from './gameData.js';
import { regenEnergy } from './energy.js';
import { saveKeyFor } from './saveKey.js';
import { isWeaponItem, equippedInventoryIndex, bagCapacityOf, bagCount, bagHasRoom } from './weaponSlot.js';

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

// A chave do save vem de saveKey.ts (uma por conta).

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
  private storageKey: string = saveKeyFor(null);

  /**
   * Troca a conta ativa e carrega o save DESSA conta (R-CONTA-2).
   * Não grava nada na chave da conta anterior nem na nova antes de carregar.
   */
  setAccount(userId: string | null) {
    this.storageKey = saveKeyFor(userId);
    this.player = this.loadFromStorage();
    this.tickEnergy();
    this.listeners.forEach(fn => fn());
  }

  constructor() {
    this.player = this.loadFromStorage();
    this.tickEnergy(); // aplica a energia regenerada enquanto o jogador esteve fora
  }

  /**
   * Regenera energia conforme o tempo real. Salva, mas não notifica ouvintes
   * (quem chama atualiza só o HUD, para não redesenhar a aba aberta).
   * Retorna true se a energia mudou.
   */
  tickEnergy(now: number = Date.now()): boolean {
    const p = this.player;
    if (!p.hasCreatedCharacter) return false;
    const family = p.familyId ? MAFIA_FAMILIES_LIST.find(f => f.id === p.familyId) : undefined;
    const bonus = family ? family.buffs.energyRegenBonusPct : 0;
    const r = regenEnergy(p.energy, p.maxEnergy, p.lastEnergyAt, now, bonus);
    const changed = r.energy !== p.energy || r.lastAt !== p.lastEnergyAt;
    p.energy = r.energy;
    p.lastEnergyAt = r.lastAt;
    if (changed) this.saveToStorage();
    return changed;
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
      const data = localStorage.getItem(this.storageKey);
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
      localStorage.setItem(this.storageKey, JSON.stringify(this.player));
    } catch (e) {
      console.error('Falha ao persistir save local:', e);
    }
  }

  resetAllProgress() {
    localStorage.removeItem(this.storageKey);
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
    this.tickEnergy(); // credita o que já regenerou antes de cobrar
    if (this.player.energy < amount) return false;
    // Saindo de energia cheia, o contador de regeneração começa agora.
    if (this.player.energy >= this.player.maxEnergy) this.player.lastEnergyAt = Date.now();
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
  /** Capacidade da mochila deste jogador (10 no começo, R-MOCHILA-1). */
  getBagCapacity(): number {
    return bagCapacityOf(this.player);
  }

  /** Itens na mochila agora (a arma do espaço da arma não conta). */
  getBagCount(): number {
    return bagCount(this.player.inventory, this.player.equipped.weaponId);
  }

  /** Cabe mais um item? */
  bagHasRoom(): boolean {
    return bagHasRoom(this.player.inventory, this.player.equipped.weaponId, this.getBagCapacity());
  }

  /**
   * Por que a compra não pode ser feita agora (ou null se pode). A arma que vai direto para o
   * espaço da arma (espaço vazio) não ocupa lugar na mochila.
   */
  buyBlockReason(item: GameItem): 'nivel' | 'ouro' | 'cash' | 'mochila' | null {
    if (this.player.level < item.levelReq) return 'nivel';
    if (this.player.gold < item.priceGold) return 'ouro';
    if (this.player.cash < item.priceCash) return 'cash';
    const goesToWeaponSlot = isWeaponItem(item) && !this.player.equipped.weaponId;
    if (!goesToWeaponSlot && !this.bagHasRoom()) return 'mochila';
    return null;
  }

  buyItem(item: GameItem): boolean {
    // Tudo é conferido ANTES de cobrar: nunca gasta ouro e falha depois por falta de cash ou de espaço.
    if (this.buyBlockReason(item) !== null) return false;
    if (item.priceGold > 0) this.spendGold(item.priceGold);
    if (item.priceCash > 0) this.spendCash(item.priceCash);

    this.player.inventory.push({ ...item });

    // Arma nova só é equipada sozinha se o espaço da arma estiver vazio (R-ARMA-5);
    // senão vai para a mochila e o jogador decide arrastando.
    if (item.type === 'weapon' && item.weaponRefId) {
      if (!this.player.equipped.weaponId) this.player.equipped.weaponId = item.weaponRefId;
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

    // Vendeu a cópia que estava no espaço da arma: fica desarmado (R-ARMA-4)
    if (index === equippedInventoryIndex(this.player.inventory, this.player.equipped.weaponId)) {
      this.player.equipped.weaponId = null;
    }
    if (item.id === this.player.equipped.armorId) this.player.equipped.armorId = null;
    if (item.id === this.player.equipped.accessoryId) this.player.equipped.accessoryId = null;

    const sellRefund = Math.round(item.priceCash * 0.5);
    this.addCash(sellRefund);

    this.player.inventory.splice(index, 1);
    this.notify();
    return true;
  }

  equipWeapon(weaponId: string | null) {
    this.player.equipped.weaponId = weaponId;
    this.notify();
  }

  /** Garante que a arma (que vai sair do espaço da arma) esteja na mochila, para nunca se perder. */
  private ensureWeaponInBag(weaponId: string | null) {
    if (!weaponId) return;
    if (equippedInventoryIndex(this.player.inventory, weaponId) !== -1) return;
    const shopCopy = SHOP_ITEMS.find(i => isWeaponItem(i) && i.weaponRefId === weaponId);
    if (shopCopy) this.player.inventory.push({ ...shopCopy });
  }

  /**
   * Arrastar uma arma da mochila para o espaço da arma (R-ARMA-3): ela vira a equipada e a
   * que estava lá volta para a mochila. Retorna false se o item não for uma arma.
   */
  equipWeaponFromBag(invIndex: number): boolean {
    const item = this.player.inventory[invIndex];
    if (!isWeaponItem(item)) return false;
    if (item.weaponRefId === this.player.equipped.weaponId) return true; // já é a equipada
    this.ensureWeaponInBag(this.player.equipped.weaponId);
    this.player.equipped.weaponId = item.weaponRefId;
    this.notify();
    return true;
  }

  /** Arrastar a arma equipada para a mochila (R-ARMA-3): ela sai do espaço e o jogador fica desarmado. */
  unequipWeapon(): boolean {
    const current = this.player.equipped.weaponId;
    if (!current) return false;
    if (!this.bagHasRoom()) return false; // mochila cheia: não há onde guardar
    this.ensureWeaponInBag(current);
    this.player.equipped.weaponId = null;
    this.notify();
    return true;
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

