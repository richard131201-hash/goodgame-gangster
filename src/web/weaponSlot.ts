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

/** O que aparece na mochila: tudo, menos a cópia da arma que está no espaço da arma. */
export function bagEntries(inventory: GameItem[], weaponId: string | null | undefined): BagEntry[] {
  const hidden = equippedInventoryIndex(inventory, weaponId);
  const out: BagEntry[] = [];
  inventory.forEach((item, index) => {
    if (index !== hidden) out.push({ item, index });
  });
  return out;
}

/** Quantos espaços a mochila mostra: no mínimo 12, crescendo de 4 em 4 se houver mais itens. */
export function bagSlotCount(itemCount: number): number {
  return Math.max(12, Math.ceil(itemCount / 4) * 4);
}
