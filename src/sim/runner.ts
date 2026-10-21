import type { BalanceConfig } from '../engine/schema.js';
import type { StyleId, FighterInput } from '../engine/types.js';
import type { BuildType } from './builds.js';
import { getBuildPoints } from './builds.js';
import { simulateFight } from '../engine/fight.js';
import { calculateRoundPercentiles, type RoundPercentiles } from './metrics.js';

export interface MatchupResult {
  styleA: StyleId;
  buildA: BuildType;
  styleB: StyleId;
  buildB: BuildType;
  level: number;
  totalFights: number;
  winsA: number;
  winRateA: number; // 0..1
  firstAttackerWins: number;
  firstAttackerWinRate: number; // 0..1
  rounds: RoundPercentiles;
  observedCritRate: number; // 0..1
  observedDodgeRate: number; // 0..1
  intimidationCapPct: number; // 0..1 (% of fights where intimidation reached 25% cap)
}

/**
 * Simulates N fights between two configurations, alternating seats A/B for 50% of the fights
 * to eliminate order bias.
 */
export function simulateMatchup(
  styleA: StyleId,
  buildA: BuildType,
  styleB: StyleId,
  buildB: BuildType,
  level: number,
  fights: number,
  baseSeed: number,
  config: BalanceConfig
): MatchupResult {
  const pointsA = getBuildPoints(buildA, level, config);
  const pointsB = getBuildPoints(buildB, level, config);

  const inputA: FighterInput = { style: styleA, level, points: pointsA };
  const inputB: FighterInput = { style: styleB, level, points: pointsB };

  let winsA = 0;
  let firstAttackerWins = 0;
  let totalStrikes = 0;
  let totalDodges = 0;
  let totalCrits = 0;
  let intimidationCapCount = 0;
  const roundsList: number[] = new Array(fights);

  const half = Math.floor(fights / 2);

  // First half: inputA is fighter 'A', inputB is fighter 'B'
  for (let i = 0; i < half; i++) {
    const seed = baseSeed + i * 2;
    const res = simulateFight(inputA, inputB, config, seed);

    roundsList[i] = res.rounds;
    if (res.winner === 'A') winsA++;
    if (res.winner === res.firstAttacker) firstAttackerWins++;
    if (res.intimidationHitCap) intimidationCapCount++;

    totalStrikes += res.totalStrikes ?? 0;
    totalDodges += res.totalDodges ?? 0;
    totalCrits += res.totalCrits ?? 0;
  }

  // Second half: alternate positions to eliminate seat bias!
  // inputB is fighter 'A', inputA is fighter 'B'
  for (let i = half; i < fights; i++) {
    const seed = baseSeed + i * 2 + 1;
    const res = simulateFight(inputB, inputA, config, seed);

    roundsList[i] = res.rounds;
    if (res.winner === 'B') winsA++; // inputA was 'B'
    if (res.winner === res.firstAttacker) firstAttackerWins++;
    if (res.intimidationHitCap) intimidationCapCount++;

    totalStrikes += res.totalStrikes ?? 0;
    totalDodges += res.totalDodges ?? 0;
    totalCrits += res.totalCrits ?? 0;
  }

  const roundStats = calculateRoundPercentiles(roundsList);

  return {
    styleA,
    buildA,
    styleB,
    buildB,
    level,
    totalFights: fights,
    winsA,
    winRateA: winsA / fights,
    firstAttackerWins,
    firstAttackerWinRate: firstAttackerWins / fights,
    rounds: roundStats,
    observedCritRate: totalStrikes > 0 ? totalCrits / totalStrikes : 0,
    observedDodgeRate: totalStrikes > 0 ? totalDodges / totalStrikes : 0,
    intimidationCapPct: intimidationCapCount / fights,
  };
}
