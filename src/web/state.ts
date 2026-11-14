import type { Points } from '../engine/types.js';
import { DEFAULT_CARRASCO } from './paperdoll.js';
import { SHOP_ITEMS, MAFIA_FAMILIES_LIST, type GameItem } from './gameData.js';
import { regenEnergy } from './energy.js';
import { GOLD } from '../shared/gold.js';
import { BAG_CAPACITY_MAX, BAG_COLUMNS, bagOpenOf, bagCanBuySlot, bagSlotPrice, bagSlotIsOpen, bagCapacityFromOpen } from '../shared/bag.js';
import { migrateLegacyGear, isGearItem, shopStock } from '../shared/gear.js';
import { ITEM_SLOTS, type ItemSlot } from '../shared/itemRoll.js';
import { saveKeyFor } from './saveKey.js';
import { sellableInShop } from './weaponArt.js';
import { isWeaponItem, equippedInventoryIndex, bagCapacityOf, bagCount, bagHasRoom, bagLayout } from './weaponSlot.js';
import {
  applyXp,
  combatPointsOf,
  calculateXpForLevel,
  getStatTrainingCost,
  createNewPlayer,
  type PlayerState,
  type PlayerStatsRecord,
} from '../shared/player.js';

// O modelo e as contas puras moram em shared/player.ts (o servidor usa as mesmas).
export { calculateXpForLevel, getStatTrainingCost, createNewPlayer };
export type { PlayerState, PlayerStatsRecord };

// A chave do save vem de saveKey.ts (uma por conta).

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
    this.persistHook?.();
    this.listeners.forEach(fn => fn());
  }

  /** Chamado a cada mudança do jogo (usado para mandar o progresso ao servidor). */
  private persistHook: (() => void) | null = null;
  setPersistHook(fn: (() => void) | null) {
    this.persistHook = fn;
  }

  /**
   * Troca o personagem pelo que o SERVIDOR guardou (login, save recusado, fim de duelo).
   * Não manda nada de volta ao servidor.
   */
  adoptServerSave(save: PlayerState) {
    const fresh = structuredClone(save);
    migrateLegacyGear(fresh);
    for (const k of Object.keys(this.player)) delete (this.player as unknown as Record<string, unknown>)[k];
    Object.assign(this.player, fresh);
    this.saveToStorage();
    this.listeners.forEach(fn => fn());
  }

  private loadFromStorage(): PlayerState {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.hasCreatedCharacter) {
          migrateLegacyGear(parsed); // armadura/acessório antigos viram Peitoral/Amuleto (R-ITEM-2)
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
      gold: GOLD.start,
      energy: 100,
      maxEnergy: 100,
      respect: 0,
      points: { attack: 12, life: 8, astucia: 10, tenacidade: 10 },
      trainedPoints: { attack: 0, life: 0, astucia: 0, tenacidade: 0 },
      freePoints: 0,
      equipped: {
        weaponId: 'colt_1911',
        gear: {},
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
    const leveledUp = applyXp(this.player, amount);
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

  /** Slots da Mala comprados (posições 10 a 19). */
  getBagOpen(): number[] {
    return bagOpenOf(this.player);
  }

  /** Por que este slot não pode ser comprado agora (ou null se pode): 'indisponivel' = já liberado ou fileira de cima incompleta. */
  bagSlotBlockReason(slot: number): 'indisponivel' | 'ouro' | null {
    if (!bagCanBuySlot(this.getBagOpen(), slot)) return 'indisponivel';
    if (this.player.gold < bagSlotPrice(slot)) return 'ouro';
    return null;
  }

  /** Compra UM slot da Mala (R-MALA-12): cobra o ouro do slot e libera só ele. Confere tudo antes de cobrar. */
  buyBagSlot(slot: number): boolean {
    if (this.bagSlotBlockReason(slot) !== null) return false;
    this.spendGold(bagSlotPrice(slot));
    const open = [...this.getBagOpen(), slot].sort((a, b) => a - b);
    this.player.bagOpen = open;
    this.player.bagCapacity = bagCapacityFromOpen(open);
    this.notify();
    return true;
  }

  /** Ids dos itens do Equipamento que estão equipados (eles não ocupam lugar na Mala, R-MALA-7). */
  equippedGearIds(): string[] {
    return Object.values(this.player.equipped.gear ?? {}).filter((id): id is string => !!id);
  }

  /** Itens na Mala agora (a arma do espaço da arma e os itens equipados não contam). */
  getBagCount(): number {
    return bagCount(this.player.inventory, this.player.equipped.weaponId, this.equippedGearIds());
  }

  /** Quantos slots a Mala mostra agora: sempre a Mala visual inteira (20); mais só se um save antigo tiver itens demais. */
  getBagSlotCount(): number {
    return Math.max(BAG_CAPACITY_MAX, Math.ceil(this.getBagCount() / BAG_COLUMNS) * BAG_COLUMNS);
  }

  /** Onde cada item aparece na Mala (R-MALA-4): um valor por slot, o item ou null. */
  getBagLayout() {
    return bagLayout(this.player.inventory, this.player.equipped.weaponId, this.getBagSlotCount(), this.equippedGearIds(), this.getBagOpen());
  }

  /** Primeiro slot vazio (ou undefined se a Mala está cheia). */
  private firstEmptySlot(): number | undefined {
    const open = this.getBagOpen();
    const i = this.getBagLayout().findIndex((c, k) => c === null && bagSlotIsOpen(open, k));
    return i === -1 ? undefined : i;
  }

  /**
   * Move um item da Mala para um slot (R-MALA-4): slot vazio = o item vai para lá; slot ocupado = os dois trocam
   * de lugar. Retorna false se o item ou o slot não existem.
   */
  moveBagItem(invIndex: number, targetSlot: number): boolean {
    const layout = this.getBagLayout();
    if (!Number.isInteger(targetSlot) || targetSlot < 0 || targetSlot >= layout.length || !bagSlotIsOpen(this.getBagOpen(), targetSlot)) return false;
    const from = layout.findIndex(c => c?.index === invIndex);
    if (from === -1) return false;
    if (from === targetSlot) return true;
    // fixa a posição de todos antes de mexer, para ninguém mudar de lugar sozinho
    layout.forEach((c, i) => {
      if (c) this.player.inventory[c.index].slot = i;
    });
    const other = layout[targetSlot];
    this.player.inventory[invIndex].slot = targetSlot;
    if (other) this.player.inventory[other.index].slot = from;
    this.notify();
    return true;
  }

  /** Cabe mais um item? */
  bagHasRoom(): boolean {
    return bagHasRoom(this.player.inventory, this.player.equipped.weaponId, this.getBagCapacity(), this.equippedGearIds());
  }

  /**
   * Por que a compra não pode ser feita agora (ou null se pode). Todo item comprado vai primeiro para a Mala,
   * então precisa haver espaço (R-MALA-7).
   */
  buyBlockReason(item: GameItem): 'nivel' | 'ouro' | 'cash' | 'mochila' | 'indisponivel' | null {
    // Épico e lendário nunca são vendidos (R-ORIGEM-1)
    if (isWeaponItem(item) && !sellableInShop(item.weaponRefId)) return 'indisponivel';
    if (this.player.level < item.levelReq) return 'nivel';
    if (this.player.gold < item.priceGold) return 'ouro';
    if (this.player.cash < item.priceCash) return 'cash';
    if (!this.bagHasRoom()) return 'mochila';
    return null;
  }

  /**
   * Item que o jogador GANHA (drop de missão, chefão): sem preço e sem exigir nível, só precisa de espaço na Mala (R-DROP-1).
   * O nível mínimo vale para usar o item, não para recebê-lo. Vai sempre para a Mala (R-MALA-7).
   */
  grantItem(item: GameItem): boolean {
    if (!this.bagHasRoom()) return false;
    this.placeItem(item);
    return true;
  }

  buyItem(item: GameItem): boolean {
    // Tudo é conferido ANTES de cobrar: nunca gasta ouro e falha depois por falta de cash ou de espaço.
    if (this.buyBlockReason(item) !== null) return false;
    if (item.priceGold > 0) this.spendGold(item.priceGold);
    if (item.priceCash > 0) this.spendCash(item.priceCash);
    this.placeItem(item);
    return true;
  }

  /** Coloca o item na Mala, no primeiro slot vazio. NUNCA equipa sozinho: tudo vai primeiro para a Mala (R-MALA-7). */
  private placeItem(item: GameItem): void {
    this.player.inventory.push({ ...item, slot: this.firstEmptySlot() });
    this.notify();
  }

  sellItem(index: number): boolean {
    if (index < 0 || index >= this.player.inventory.length) return false;
    const item = this.player.inventory[index];

    // Vendeu a cópia que estava no espaço da arma: fica desarmado (R-ARMA-4)
    if (index === equippedInventoryIndex(this.player.inventory, this.player.equipped.weaponId)) {
      this.player.equipped.weaponId = null;
    }
    for (const slot of ITEM_SLOTS) {
      if (this.player.equipped.gear[slot] === item.id) delete this.player.equipped.gear[slot];
    }

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
    if (shopCopy) this.player.inventory.push({ ...shopCopy, slot: this.firstEmptySlot() });
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
  unequipWeapon(targetSlot?: number): boolean {
    const current = this.player.equipped.weaponId;
    if (!current) return false;
    if (!this.bagHasRoom()) return false; // mochila cheia: não há onde guardar
    this.ensureWeaponInBag(current);
    this.player.equipped.weaponId = null;
    // se soltou num slot vazio da Mala, a arma vai exatamente para ele (R-MALA-4)
    if (typeof targetSlot === 'number') {
      const idx = equippedInventoryIndex(this.player.inventory, current);
      const layout = this.getBagLayout();
      if (idx !== -1 && targetSlot >= 0 && targetSlot < layout.length && layout[targetSlot] === null && bagSlotIsOpen(this.getBagOpen(), targetSlot)) {
        this.player.inventory[idx].slot = targetSlot;
      }
    }
    this.notify();
    return true;
  }

  /** Equipa um item dos 8 slots no slot dele (troca o que estava lá). Retorna false se não é desse tipo. */
  equipGear(itemId: string): boolean {
    const item = this.player.inventory.find(i => i.id === itemId);
    if (!isGearItem(item)) return false;
    this.player.equipped.gear[item.gear.slot] = item.id;
    this.notify();
    return true;
  }

  /**
   * Guarda na Mala o item equipado do slot (volta a ocupar lugar). Devolve 'sem_espaco' se a Mala está cheia,
   * 'vazio' se o slot não tem item, ou 'ok'. `targetSlot` = posição da Mala onde ele deve ficar (opcional).
   */
  unequipGear(slot: ItemSlot, targetSlot?: number): 'ok' | 'sem_espaco' | 'vazio' {
    const id = this.player.equipped.gear[slot];
    if (!id) return 'vazio';
    if (!this.bagHasRoom()) return 'sem_espaco';
    delete this.player.equipped.gear[slot];
    const idx = this.player.inventory.findIndex(i => i.id === id);
    if (idx >= 0) {
      delete this.player.inventory[idx].slot; // posição antiga pode estar ocupada: acha o primeiro vazio
      if (targetSlot !== undefined) this.moveBagItem(idx, targetSlot);
    }
    this.notify();
    return 'ok';
  }

  /** Item de loja de um dos 8 slots que está equipado agora (ou undefined). */
  equippedGear(slot: ItemSlot): GameItem | undefined {
    const id = this.player.equipped.gear[slot];
    return id ? this.player.inventory.find(i => i.id === id) : undefined;
  }

  /** Estoque atual da loja de itens (1 por slot, atributos à vista). Muda a cada compra. */
  getShopStock(): GameItem[] {
    return shopStock(this.player.name, this.player.level, this.player.shopSerial ?? 0);
  }

  /** Compra um item do estoque (confere cash e espaço antes de cobrar). Retorna o motivo da recusa, ou null se comprou. */
  buyGearFromStock(itemId: string): 'sem_item' | 'cash' | 'mochila' | null {
    const item = this.getShopStock().find(i => i.id === itemId);
    if (!item) return 'sem_item';
    if (this.player.cash < item.priceCash) return 'cash';
    if (!this.bagHasRoom()) return 'mochila';
    const id = this.player.inventory.some(i => i.id === item.id) ? `${item.id}_${this.player.shopSerial ?? 0}` : item.id;
    this.spendCash(item.priceCash);
    this.player.shopSerial = (this.player.shopSerial ?? 0) + 1; // o estoque muda
    this.placeItem({ ...item, id });
    return null;
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
    return combatPointsOf(this.player);
  }
}

export const gameState = new GameStateManager();

