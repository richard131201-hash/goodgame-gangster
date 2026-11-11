/**
 * Regras de duelo entre jogadores que o navegador também precisa conhecer (para mostrar o prêmio
 * e a faixa de nível). Quem aplica de verdade é o servidor (src/server/rules.ts).
 */
export const DUEL = {
  /** Diferença máxima de nível entre os dois jogadores. */
  levelRange: 10,
  /** Intervalo mínimo para desafiar o MESMO jogador de novo. */
  pairCooldownMs: 10 * 60 * 1000,
  /** Duelos por hora de um mesmo jogador. */
  maxPerHour: 30,
  respectWin: 25,
  respectLoss: 10,
  xpWin: 60,
  /** Cash pago pelo servidor ao vencedor: 80 + 45 por nível do rival. */
  bountyBase: 80,
  bountyPerLevel: 45,
} as const;

export function duelBounty(defenderLevel: number): number {
  return DUEL.bountyBase + DUEL.bountyPerLevel * defenderLevel;
}
