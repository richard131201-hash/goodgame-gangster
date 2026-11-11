/**
 * Regeneração de energia por tempo real (função pura, sem relógio próprio).
 * REGRA DEFINIDA PELO FUNDADOR (2026-11-11, ver docs/REGRAS_DO_JOGO.md, regra R-ENERGIA-1):
 * 1 ponto a cada 7 minutos (420 s). Teto de 100 (maxEnergy no estado do jogador).
 * 100 de energia levam 11h40 para encher do zero.
 * Mudar este valor exige atualizar docs/REGRAS_DO_JOGO.md e o teste que o fixa.
 */
export const ENERGY_SECONDS_PER_POINT = 420;

export interface EnergyResult {
  energy: number;
  lastAt: number;
}

export function regenEnergy(
  energy: number,
  maxEnergy: number,
  lastAt: number | undefined,
  now: number,
  bonusPct = 0,
): EnergyResult {
  // Energia cheia: o contador fica parado e recomeça no próximo gasto.
  if (energy >= maxEnergy) return { energy: maxEnergy, lastAt: now };
  // Save antigo (sem marca de tempo) ou relógio do aparelho voltou: recomeça agora.
  if (lastAt === undefined || now < lastAt) return { energy, lastAt: now };

  const msPerPoint = (ENERGY_SECONDS_PER_POINT * 1000) / (1 + Math.max(0, bonusPct) / 100);
  const gained = Math.floor((now - lastAt) / msPerPoint);
  if (gained <= 0) return { energy, lastAt };

  const next = Math.min(maxEnergy, energy + gained);
  return { energy: next, lastAt: next >= maxEnergy ? now : lastAt + gained * msPerPoint };
}

/** Milissegundos até o próximo ponto (para mostrar na tela). 0 se a energia está cheia. */
export function msToNextEnergy(
  energy: number,
  maxEnergy: number,
  lastAt: number | undefined,
  now: number,
  bonusPct = 0,
): number {
  if (energy >= maxEnergy || lastAt === undefined) return 0;
  const msPerPoint = (ENERGY_SECONDS_PER_POINT * 1000) / (1 + Math.max(0, bonusPct) / 100);
  return Math.max(0, Math.round(msPerPoint - (now - lastAt)));
}
