import { FISTS, getWeaponById, type WeaponDef } from '../engine/weapons.js';
import type { GameItem } from './gameData.js';

/**
 * Regras puras do espaço da arma (sem tela, sem relógio):
 *  - dano mínimo e máximo sempre à vista (R-ARMA-1);
 *  - comparação com a arma equipada (R-ARMA-2);
 *  - a arma equipada mora no espaço da arma e não aparece na mochila (R-ARMA-3);
 *  - sem arma equipada, o personagem luta com os punhos (R-ARMA-4).
 */
export type DamageRange = Pick<WeaponDef, 'min' | 'max'>;

export interface WeaponItem extends GameItem {
  type: 'weapon';
  weaponRefId: string;
}

export function isWeaponItem(item: GameItem | undefined | null): item is WeaponItem {
  return !!item && item.type === 'weapon' && typeof item.weaponRefId === 'string';
}

/** A arma que vale na luta: a equipada ou, sem nenhuma, os punhos. */
export function equippedWeaponDef(weaponId: string | null | undefined): WeaponDef {
  return weaponId ? getWeaponById(weaponId) : FISTS;
}

/** "12 mín – 22 máx" (sempre mostrado onde há arma). */
export function damageText(w: DamageRange): string {
  return `${w.min} mín – ${w.max} máx`;
}

/** Versão curta para espaços pequenos: "12–22". */
export function damageShort(w: DamageRange): string {
  return `${w.min}–${w.max}`;
}

export function damageAverage(w: DamageRange): number {
  return (w.min + w.max) / 2;
}

/** "+4", "−6" (sinal de menos de verdade) ou "0". */
export function formatDelta(n: number): string {
  if (n === 0) return '0';
  const abs = Math.abs(n);
  const txt = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  return `${n > 0 ? '+' : '−'}${txt}`;
}

export type Verdict = 'melhor' | 'pior' | 'igual' | 'misto';

export interface WeaponComparison {
  deltaMin: number;
  deltaMax: number;
  deltaAvg: number;
  /** melhor: não perde em nada e ganha em algo; pior: o contrário; misto: ganha num e perde noutro. */
  verdict: Verdict;
}

/** Compara a arma candidata com a equipada (positivo = a candidata causa mais dano). */
export function compareWeapons(candidate: DamageRange, equipped: DamageRange): WeaponComparison {
  const deltaMin = candidate.min - equipped.min;
  const deltaMax = candidate.max - equipped.max;
  const deltaAvg = damageAverage(candidate) - damageAverage(equipped);
  let verdict: Verdict;
  if (deltaMin === 0 && deltaMax === 0) verdict = 'igual';
  else if (deltaMin >= 0 && deltaMax >= 0) verdict = 'melhor';
  else if (deltaMin <= 0 && deltaMax <= 0) verdict = 'pior';
  else verdict = 'misto';
  return { deltaMin, deltaMax, deltaAvg, verdict };
}

/** Posição (na lista da mochila) da cópia da arma que está equipada, ou -1. */
export function equippedInventoryIndex(inventory: GameItem[], weaponId: string | null | undefined): number {
  if (!weaponId) return -1;
  return inventory.findIndex(i => isWeaponItem(i) && i.weaponRefId === weaponId);
}

export interface BagEntry {
  item: GameItem;
  /** Posição real na lista de inventário (use esta nas ações). */
  index: number;
}

/**
 * O que aparece na Mala: tudo, menos a cópia da arma que está no espaço da arma e os itens do Equipamento que estão
 * equipados (R-MALA-7: o que está equipado não ocupa lugar na Mala). `gearIds` = ids dos itens equipados nos 8 slots.
 */
export function bagEntries(inventory: GameItem[], weaponId: string | null | undefined, gearIds: readonly string[] = []): BagEntry[] {
  const hidden = equippedInventoryIndex(inventory, weaponId);
  const equippedGear = new Set(gearIds);
  const out: BagEntry[] = [];
  inventory.forEach((item, index) => {
    if (index === hidden) return;
    if (item.type === 'gear' && equippedGear.has(item.id)) return;
    out.push({ item, index });
  });
  return out;
}

/** Capacidade inicial da mochila (R-MOCHILA-1): 10 itens, em 2 linhas de 5. */
export const BAG_CAPACITY_INITIAL = 10;
export const BAG_COLUMNS = 5;

/** Capacidade do jogador: saves antigos não têm o campo e valem a capacidade inicial. */
export function bagCapacityOf(player: { bagCapacity?: number }): number {
  return Math.max(BAG_CAPACITY_INITIAL, player.bagCapacity ?? BAG_CAPACITY_INITIAL);
}

/** Quantos itens estão na mochila (a arma do espaço da arma não conta). */
export function bagCount(inventory: GameItem[], weaponId: string | null | undefined, gearIds: readonly string[] = []): number {
  return bagEntries(inventory, weaponId, gearIds).length;
}

/** Ainda cabe mais um item na mochila? */
export function bagHasRoom(inventory: GameItem[], weaponId: string | null | undefined, capacity: number, gearIds: readonly string[] = []): boolean {
  return bagCount(inventory, weaponId, gearIds) < capacity;
}

/**
 * Onde cada item aparece na Mala (R-MALA-4): o item com `slot` válido e livre fica nesse slot; os que não têm
 * posição (ou cuja posição já está ocupada ou fora da Mala) vão para os primeiros slots vazios, na ordem.
 * Devolve uma lista com um valor por slot: o item (com a posição real na lista de inventário) ou null (vazio).
 */
export function bagLayout(
  inventory: GameItem[],
  weaponId: string | null | undefined,
  totalSlots: number,
  gearIds: readonly string[] = [],
): (BagEntry | null)[] {
  const cells: (BagEntry | null)[] = Array.from({ length: totalSlots }, () => null);
  const pending: BagEntry[] = [];
  for (const entry of bagEntries(inventory, weaponId, gearIds)) {
    const s = entry.item.slot;
    if (typeof s === 'number' && Number.isInteger(s) && s >= 0 && s < totalSlots && cells[s] === null) cells[s] = entry;
    else pending.push(entry);
  }
  for (const entry of pending) {
    const i = cells.indexOf(null);
    if (i === -1) break; // não cabe (save com itens demais): o chamador usa bagSlotCount para nunca esconder item
    cells[i] = entry;
  }
  return cells;
}

/** Primeiro slot vazio da Mala (ou -1 se estiver cheia). */
export function firstEmptyBagSlot(
  inventory: GameItem[],
  weaponId: string | null | undefined,
  totalSlots: number,
  gearIds: readonly string[] = [],
): number {
  return bagLayout(inventory, weaponId, totalSlots, gearIds).indexOf(null);
}

/**
 * Quantos espaços a mochila mostra: a capacidade (10 no começo), arredondada para linhas de 5.
 * Se um save antigo tiver itens a mais, mostra todos (nada fica invisível).
 */
export function bagSlotCount(itemCount: number, capacity: number = BAG_CAPACITY_INITIAL): number {
  return Math.max(capacity, Math.ceil(itemCount / BAG_COLUMNS) * BAG_COLUMNS);
}
