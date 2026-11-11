/**
 * Ouro (moeda premium). Como se ganha, hoje: 125 ao subir de nível e um drop raro em missão (R-OURO-1, R-OURO-2).
 * A compra com dinheiro real ainda não existe (decisão do fundador: fica para depois).
 */
export const GOLD = {
  /** Ouro com que todo personagem começa. */
  start: 25,
  /** Ouro ganho a cada nível que o jogador sobe. */
  perLevel: 125,
  /** Chance de uma missão vencida dropar ouro. */
  dropChance: 0.03,
  /** Tamanho do drop: de 10 (o mais provável) a 30 (o mais raro). */
  dropMin: 10,
  dropMax: 30,
} as const;

/**
 * Sorteia o ouro de uma missão vencida: 0 (97% das vezes) ou de 10 a 30. Dentro de 10..30 o peso
 * cai de forma linear: 10 tem o maior peso (21) e 30 o menor (1), então 10 é 21 vezes mais comum que 30.
 * `rand` devolve um número em [0, 1) (Math.random no jogo; fixo nos testes).
 */
export function rollGoldDrop(rand: () => number): number {
  if (rand() >= GOLD.dropChance) return 0;
  const weights: number[] = [];
  for (let g = GOLD.dropMin; g <= GOLD.dropMax; g++) weights.push(GOLD.dropMax + 1 - g);
  const total = weights.reduce((a, b) => a + b, 0);
  let pick = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    pick -= weights[i];
    if (pick < 0) return GOLD.dropMin + i;
  }
  return GOLD.dropMax;
}

/** Teto de ouro que um personagem pode ter, dado o nível e as missões cumpridas (usado pelo servidor). */
export function goldCap(level: number, missionsCompleted: number): number {
  return GOLD.start + GOLD.perLevel * (level - 1) + GOLD.dropMax * missionsCompleted;
}
