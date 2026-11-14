/**
 * Tamanho da Mala e a compra de slots (R-MALA-10, R-MALA-12).
 * A Mala começa com 10 slots livres (2 fileiras de 5). Os demais começam BLOQUEADOS e são comprados com ouro,
 * UM SLOT POR VEZ, na ordem que o jogador quiser DENTRO da fileira. A fileira de baixo só pode ser comprada
 * depois que TODOS os slots da fileira de cima foram comprados. O preço depende da fileira do slot.
 */
export const BAG_CAPACITY_INITIAL = 10;
export const BAG_COLUMNS = 5;
/** Máximo de slots hoje: 4 fileiras de 5 (a Mala visual). Mais fileiras dependem de rolagem na tela. */
export const BAG_CAPACITY_MAX = 20;
/** Preço antigo de uma fileira inteira (a "mala maior"): o slot da 3ª fileira custa um quinto disso. */
export const BIG_BAG_PRICE_GOLD = 300;

/** Preço, em ouro, de cada slot por fileira (0 = 1ª fileira). A 3ª mantém o preço antigo (300 / 5); da 6ª em diante fica em 1000. */
export const BAG_SLOT_PRICE_BY_ROW: Record<number, number> = { 2: BIG_BAG_PRICE_GOLD / BAG_COLUMNS, 3: 500, 4: 750 };
export const BAG_SLOT_PRICE_LAST = 1000;

export function bagRowOf(slot: number): number {
  return Math.floor(slot / BAG_COLUMNS);
}

/** Preço de um slot (0 para os 10 slots iniciais). */
export function bagSlotPrice(slot: number): number {
  const row = bagRowOf(slot);
  if (slot < BAG_CAPACITY_INITIAL) return 0;
  return BAG_SLOT_PRICE_BY_ROW[row] ?? BAG_SLOT_PRICE_LAST;
}

/** Slots comprados (da posição 10 em diante). Save antigo só tem a capacidade (10 ou 15): vale os primeiros slots em ordem. */
export function bagOpenOf(player: { bagCapacity?: number; bagOpen?: number[] }): number[] {
  if (Array.isArray(player.bagOpen)) return [...new Set(player.bagOpen)].sort((a, b) => a - b);
  const cap = Math.min(Math.max(BAG_CAPACITY_INITIAL, Math.trunc(player.bagCapacity ?? BAG_CAPACITY_INITIAL)), BAG_CAPACITY_MAX);
  return Array.from({ length: cap - BAG_CAPACITY_INITIAL }, (_, i) => BAG_CAPACITY_INITIAL + i);
}

/** Este slot está liberado (inicial ou comprado)? Slots além da Mala visual contam como liberados. */
export function bagSlotIsOpen(open: readonly number[], slot: number): boolean {
  return slot < BAG_CAPACITY_INITIAL || slot >= BAG_CAPACITY_MAX || open.includes(slot);
}

/** Capacidade da Mala: 10 + os slots comprados. */
export function bagCapacityFromOpen(open: readonly number[]): number {
  return BAG_CAPACITY_INITIAL + open.length;
}

/** A fileira que pode ser comprada agora: a primeira que não está inteira liberada (null = Mala no máximo). */
export function bagBuyableRow(open: readonly number[]): number | null {
  for (let row = bagRowOf(BAG_CAPACITY_INITIAL); row < bagRowOf(BAG_CAPACITY_MAX); row++) {
    for (let c = 0; c < BAG_COLUMNS; c++) if (!open.includes(row * BAG_COLUMNS + c)) return row;
  }
  return null;
}

/** Dá para comprar este slot agora? (está bloqueado e na fileira que pode ser comprada) */
export function bagCanBuySlot(open: readonly number[], slot: number): boolean {
  if (!Number.isInteger(slot) || slot < BAG_CAPACITY_INITIAL || slot >= BAG_CAPACITY_MAX) return false;
  if (open.includes(slot)) return false;
  return bagRowOf(slot) === bagBuyableRow(open);
}

/** Lista de slots comprados válida: inteiros de 10 a 19, sem repetir, e a regra da fileira (nenhuma fileira abre sem a de cima completa). */
export function validBagOpen(open: readonly number[]): boolean {
  if (!open.every(s => Number.isInteger(s) && s >= BAG_CAPACITY_INITIAL && s < BAG_CAPACITY_MAX)) return false;
  if (new Set(open).size !== open.length) return false;
  let previousFull = true;
  for (let row = bagRowOf(BAG_CAPACITY_INITIAL); row < bagRowOf(BAG_CAPACITY_MAX); row++) {
    const n = open.filter(s => bagRowOf(s) === row).length;
    if (n > 0 && !previousFull) return false;
    previousFull = n === BAG_COLUMNS;
  }
  return true;
}

/** Quanto custa passar de uma lista de slots comprados para outra (só conta os slots novos). */
export function bagOpenCost(before: readonly number[], after: readonly number[]): number {
  return after.filter(s => !before.includes(s)).reduce((sum, s) => sum + bagSlotPrice(s), 0);
}
