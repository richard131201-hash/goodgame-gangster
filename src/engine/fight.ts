import type { BalanceConfig } from './schema.js';
import type { FighterInput, FightResult, FightEvent } from './types.js';
import { derivedStats } from './stats.js';
import { createPRNG, hashSeed } from './prng.js';
import { executeStrike, type FighterCombatState } from './strike.js';

export interface SimulateFightOptions {
  withEvents?: boolean;
}

/**
 * Simulates a full, deterministic combat between two fighters.
 * - Initiative is determined by highest effective Astucia points; tie broken by seed.
 * - Alternating rounds until one fighter reaches 0 HP.
 * - Never draws, never hits arbitrary round cap (internal safety limit throws error).
 * - Events log is optional for performance during mass simulation.
 */
export function simulateFight(
  aInput: FighterInput,
  bInput: FighterInput,
  config: BalanceConfig,
  seed: number | string,
  opts?: SimulateFightOptions
): FightResult {
  const prng = createPRNG(hashSeed('fight', seed));

  const statsA = derivedStats(aInput, config);
  const statsB = derivedStats(bInput, config);

  const fighterA: FighterCombatState = {
    side: 'A',
    input: aInput,
    stats: statsA,
    currentHp: statsA.maxHp,
    openingStrikeUsed: false,
  };

  const fighterB: FighterCombatState = {
    side: 'B',
    input: bInput,
    stats: statsB,
    currentHp: statsB.maxHp,
    openingStrikeUsed: false,
  };

  // Determine initiative (who attacks first)
  let firstAttacker: 'A' | 'B';
  if (statsA.effectiveAstuciaPoints > statsB.effectiveAstuciaPoints) {
    firstAttacker = 'A';
  } else if (statsB.effectiveAstuciaPoints > statsA.effectiveAstuciaPoints) {
    firstAttacker = 'B';
  } else {
    // Exact tie: deterministic roll using PRNG
    firstAttacker = prng.next() < 0.5 ? 'A' : 'B';
  }

  const p1 = firstAttacker === 'A' ? fighterA : fighterB;
  const p2 = firstAttacker === 'A' ? fighterB : fighterA;

  const events: FightEvent[] | undefined = opts?.withEvents ? [] : undefined;
  let intimidationHitCap = false;
  let round = 1;
  const safetyLimit = config.combat.safetyMaxRounds;

  while (round <= safetyLimit) {
    // Turn 1: P1 strikes P2
    const strike1 = executeStrike(p1, p2, round, 1, config, prng);
    if (events) events.push(strike1.event);
    if (strike1.intimidationHitCap) intimidationHitCap = true;

    if (p2.currentHp <= 0) {
      return {
        winner: p1.side,
        rounds: round,
        firstAttacker,
        finalHp: { A: fighterA.currentHp, B: fighterB.currentHp },
        events,
        intimidationHitCap,
      };
    }

    // Turn 2: P2 strikes P1
    const strike2 = executeStrike(p2, p1, round, 2, config, prng);
    if (events) events.push(strike2.event);
    if (strike2.intimidationHitCap) intimidationHitCap = true;

    if (p1.currentHp <= 0) {
      return {
        winner: p2.side,
        rounds: round,
        firstAttacker,
        finalHp: { A: fighterA.currentHp, B: fighterB.currentHp },
        events,
        intimidationHitCap,
      };
    }

    round++;
  }

  throw new Error(
    `Safety round limit exceeded (${safetyLimit}): combat reached an infinite loop or stalled.`
  );
}
