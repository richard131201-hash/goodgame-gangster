/**
 * Regras de duelo entre jogadores que o navegador também precisa conhecer (para mostrar o prêmio
 * e os limites). Quem aplica de verdade é o servidor (src/server/rules.ts).
 */
export const DUEL = {
  /** Um duelo grátis a cada 10 minutos (contra qualquer rival). Sem limite por hora. */
  cooldownMs: 10 * 60 * 1000,
  /** Ouro para duelar de novo antes do fim da espera. */
  skipCooldownGold: 125,
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
