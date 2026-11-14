import type { GameItem } from './gameData.js';
import { GEAR_NAMES, isGearItem } from '../shared/gear.js';
import type { ItemSlot } from '../shared/itemRoll.js';

/**
 * Arte dos equipamentos dos 8 slots (R-ARTE-6): imagens do fundador (geradas por IA), recortadas em 4:3 com fundo
 * transparente, em public/assets/gear/<slot>_<n>.comum.webp. Cada variação de nome do slot (GEAR_NAMES, na ordem) tem a
 * sua imagem: a 1ª imagem é o 1º nome, e assim por diante. Por enquanto só existe a moldura "comum" (borda preta).
 * Slot ou variação sem imagem cai no ícone de texto de sempre.
 */
export const GEAR_ART_SLOTS: Readonly<Partial<Record<ItemSlot, number>>> = { chapeu: 4 };

/** Endereço da imagem do equipamento, ou null se ele ainda não tem arte. */
export function gearArtUrl(item: GameItem | null | undefined): string | null {
  if (!isGearItem(item)) return null;
  const { slot, variant } = item.gear;
  const count = GEAR_ART_SLOTS[slot];
  if (!count) return null;
  const names = GEAR_NAMES[slot].length;
  const n = ((variant % names) + names) % names;
  return n < count ? `/assets/gear/${slot}_${n + 1}.comum.webp` : null;
}

/** <img> do equipamento, ou '' se ele não tem arte. `draggable=false` deixa o arrastar para o slot que a contém. */
export function gearArtImg(item: GameItem | null | undefined, cls = ''): string {
  const url = gearArtUrl(item);
  return url ? `<img class="warr ${cls}" src="${url}" alt="" decoding="async" draggable="false">` : '';
}
