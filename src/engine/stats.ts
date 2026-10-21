import type { BalanceConfig } from './schema.js';
import type { DerivedStats, FighterInput, StyleId } from './types.js';

/**
 * Calculates the P50 benchmark (points needed for the 50% cap at a given level).
 * Formula: P50(L) = p50Base + p50PerLevel * (L - 1)
 */
export function getP50(level: number, config: BalanceConfig): number {
  return config.percentCurves.p50Base + config.percentCurves.p50PerLevel * (level - 1);
}

/**
 * Calculates the raw value per point for a given column (attack or life) at a given level.
 * Formula: valorPorPonto(coluna, L) = base[coluna] * (1 + levelGrowth * (L - 1))
 */
export function getValuePerPoint(
  column: 'attack' | 'life',
  level: number,
  config: BalanceConfig
): number {
  const base = config.valuePerPoint[column];
  return base * (1 + config.valuePerPoint.levelGrowth * (level - 1));
}

/**
 * Calculates effective Astúcia points, taking style passives into account (e.g. Malandro - Instinto).
 */
export function getEffectiveAstuciaPoints(
  style: StyleId,
  points: number,
  config: BalanceConfig
): number {
  if (style === 'malandro') {
    return points * config.styles.malandro.passives.astuciaPointMultiplier;
  }
  return points;
}

/**
 * Calculates effective Tenacidade points, taking style passives into account (e.g. Muralha - Casca grossa).
 */
export function getEffectiveTenacidadePoints(
  style: StyleId,
  points: number,
  config: BalanceConfig
): number {
  if (style === 'muralha') {
    return points * config.styles.muralha.passives.tenacityPointMultiplier;
  }
  return points;
}

/**
 * Computes all derived stats for a given fighter input according to the balance config.
 * - Attack is kept in float for precision in combat steps.
 * - Max HP is rounded to nearest integer (Math.round).
 * - Astúcia and Tenacidade percentages are strictly capped at 50% (config.percentCurves.cap).
 * - Armor and Dodge are fixed by style.
 */
export function derivedStats(f: FighterInput, config: BalanceConfig): DerivedStats {
  if (f.level < 1 || f.level > config.levelCap) {
    throw new Error(`Level must be between 1 and ${config.levelCap}, received: ${f.level}`);
  }

  const styleConfig = config.styles[f.style];
  if (!styleConfig) {
    throw new Error(`Unknown style: ${f.style}`);
  }

  // 1. Attack & Life values per point
  const attackValuePerPoint = getValuePerPoint('attack', f.level, config);
  const lifeValuePerPoint = getValuePerPoint('life', f.level, config);

  const attackPower = f.points.attack * attackValuePerPoint * styleConfig.attackScale;
  const maxHp = Math.round(f.points.life * lifeValuePerPoint * styleConfig.lifeScale);

  // 2. Effective points
  const effectiveAstuciaPoints = getEffectiveAstuciaPoints(f.style, f.points.astucia, config);
  const effectiveTenacidadePoints = getEffectiveTenacidadePoints(f.style, f.points.tenacidade, config);

  // 3. Percentage curves & cap (Astúcia & Tenacidade)
  const p50 = getP50(f.level, config);
  const cap = config.percentCurves.cap;

  const rawCritChance = cap * (effectiveAstuciaPoints / p50);
  const critChance = Math.min(cap, Math.max(0, rawCritChance));

  const rawCritReduction = cap * (effectiveTenacidadePoints / p50);
  const critReduction = Math.min(cap, Math.max(0, rawCritReduction));

  return {
    maxHp,
    attackPower,
    effectiveAstuciaPoints,
    effectiveTenacidadePoints,
    critChance,
    critReduction,
    armorReduction: styleConfig.armorReduction,
    dodgeChance: styleConfig.dodge,
  };
}
