/**
 * Tamanho da Mala e a "mala maior" (R-MALA-10).
 * A Mala começa com 10 slots (2 fileiras de 5). Uma fileira extra de 5 slots começa BLOQUEADA e é liberada
 * comprando a "mala maior" com ouro. VALORES PROVISÓRIOS (a confirmar com o fundador): preço e limite.
 */
export const BAG_CAPACITY_INITIAL = 10;
export const BAG_COLUMNS = 5;
/** Quantos slots a mala maior acrescenta (uma fileira). */
export const BAG_UPGRADE_SLOTS = 5;
/** Máximo de slots hoje: 3 fileiras de 5. */
export const BAG_CAPACITY_MAX = 15;
/** Preço da mala maior, em ouro (provisório). */
export const BIG_BAG_PRICE_GOLD = 300;

/** Capacidade vinda de um save: só vale 10 ou 15 (múltiplos de uma fileira entre o início e o máximo). */
export function validBagCapacity(c: number): boolean {
  return Number.isInteger(c) && c >= BAG_CAPACITY_INITIAL && c <= BAG_CAPACITY_MAX && (c - BAG_CAPACITY_INITIAL) % BAG_UPGRADE_SLOTS === 0;
}
