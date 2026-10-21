import type { BalanceConfig } from '../engine/schema.js';
import type { Points } from '../engine/types.js';

export type BuildType = 'equilibrado' | 'ofensivo' | 'defensivo' | 'critico' | 'antiCritico';

export const ALL_BUILD_TYPES: BuildType[] = [
  'equilibrado',
  'ofensivo',
  'defensivo',
  'critico',
  'antiCritico',
];

/**
 * Calculates total distributed points for a character at a given level without training cash.
 * Formula: start + perLevel * (level - 1)
 */
export function getTotalPoints(level: number, config: BalanceConfig): number {
  return config.points.start + config.points.perLevel * (level - 1);
}

/**
 * Generates exact integer points for a build profile at a given level.
 * Any remainder is added to the primary column of the build to ensure the exact sum.
 */
export function getBuildPoints(
  build: BuildType,
  level: number,
  config: BalanceConfig
): Points {
  const total = getTotalPoints(level, config);

  switch (build) {
    case 'equilibrado': {
      // 25% each column. Remainder goes to attack first, then life, etc.
      const base = Math.floor(total / 4);
      let rem = total - base * 4;
      return {
        attack: base + (rem > 0 ? (rem--, 1) : 0),
        life: base + (rem > 0 ? (rem--, 1) : 0),
        astucia: base + (rem > 0 ? (rem--, 1) : 0),
        tenacidade: base + (rem > 0 ? (rem--, 1) : 0),
      };
    }

    case 'ofensivo': {
      // 50% Attack, remaining 50% split among Life, Astucia, Tenacidade.
      // Remainder goes to Attack.
      const secondaryShare = Math.floor((total * 0.50) / 3);
      const life = secondaryShare;
      const astucia = secondaryShare;
      const tenacidade = secondaryShare;
      const attack = total - (life + astucia + tenacidade);
      return { attack, life, astucia, tenacidade };
    }

    case 'defensivo': {
      // 50% Life, remaining 50% split among Attack, Astucia, Tenacidade.
      // Remainder goes to Life.
      const secondaryShare = Math.floor((total * 0.50) / 3);
      const attack = secondaryShare;
      const astucia = secondaryShare;
      const tenacidade = secondaryShare;
      const life = total - (attack + astucia + tenacidade);
      return { attack, life, astucia, tenacidade };
    }

    case 'critico': {
      // 50% Astucia, remaining 50% split among Attack, Life, Tenacidade.
      // Remainder goes to Astucia.
      const secondaryShare = Math.floor((total * 0.50) / 3);
      const attack = secondaryShare;
      const life = secondaryShare;
      const tenacidade = secondaryShare;
      const astucia = total - (attack + life + tenacidade);
      return { attack, life, astucia, tenacidade };
    }

    case 'antiCritico': {
      // 50% Tenacidade, remaining 50% split among Attack, Life, Astucia.
      // Remainder goes to Tenacidade.
      const secondaryShare = Math.floor((total * 0.50) / 3);
      const attack = secondaryShare;
      const life = secondaryShare;
      const astucia = secondaryShare;
      const tenacidade = total - (attack + life + astucia);
      return { attack, life, astucia, tenacidade };
    }
  }
}
