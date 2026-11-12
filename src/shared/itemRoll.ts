/**
 * Sorteio dos itens dos 8 slots do perfil (R-ITEM-2). Regra pura: não mexe em tela, servidor nem save.
 *
 * - O item é sempre do nível do jogador.
 * - Dá `itemPoints(nível)` pontos no total, cada ponto sorteado entre os 4 atributos (nada fixo).
 * - Valores PROVISÓRIOS (meio ponto por nível, no mínimo 1): o fundador ajusta depois com o simulador (C6).
 * - `rand` devolve um número em [0, 1): Math.random no jogo, a semente do servidor (D2) em produção, fixo nos testes.
 */
export const ITEM_SLOTS = ['chapeu', 'peitoral', 'calca', 'calcado', 'amuleto', 'pet', 'relicia', 'veiculo'] as const;
export type ItemSlot = (typeof ITEM_SLOTS)[number];

export const ITEM_SLOT_LABELS: Record<ItemSlot, string> = {
  chapeu: 'Chapéu',
  peitoral: 'Peitoral',
  calca: 'Calça',
  calcado: 'Calçado',
  amuleto: 'Amuleto da sorte',
  pet: 'Pet',
  relicia: 'Relíquia',
  veiculo: 'Veículo',
};

export const ITEM_ATTRS = ['attack', 'life', 'astucia', 'tenacidade'] as const;
export type ItemAttr = (typeof ITEM_ATTRS)[number];

export const ITEM_ROLL = {
  /** Pontos por nível do jogador, no total de um item. */
  pointsPerLevel: 0.5,
  /** Todo item dá pelo menos isto. */
  minPoints: 1,
} as const;

export interface RolledItem {
  slot: ItemSlot;
  /** Nível do jogador quando o item foi sorteado: é também o nível do item. */
  level: number;
  /** Pontos de cada atributo. A soma é sempre `itemPoints(level)`. */
  points: Record<ItemAttr, number>;
}

/** Total de pontos que um item do nível dado dá: max(1, arredonda(0,5 x nível)). */
export function itemPoints(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  return Math.max(ITEM_ROLL.minPoints, Math.round(lv * ITEM_ROLL.pointsPerLevel));
}

/** Sorteia um item do slot, do nível do jogador. Cada ponto cai em um dos 4 atributos com a mesma chance. */
export function rollItem(level: number, slot: ItemSlot, rand: () => number): RolledItem {
  const lv = Math.max(1, Math.floor(level));
  const points: Record<ItemAttr, number> = { attack: 0, life: 0, astucia: 0, tenacidade: 0 };
  const total = itemPoints(lv);
  for (let n = 0; n < total; n++) {
    const i = Math.min(ITEM_ATTRS.length - 1, Math.floor(rand() * ITEM_ATTRS.length));
    points[ITEM_ATTRS[i]] += 1;
  }
  return { slot, level: lv, points };
}
