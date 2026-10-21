import type { BalanceConfig } from './schema.js';
import type { Points } from './types.js';
import { createPRNG } from './prng.js';

let cachedKey = '';
let cachedCombinations: Points[] = [];

/**
 * Enumerates all valid starting point distributions where each of the 4 columns
 * is within [min, max] and the sum equals targetSum.
 * Throws a clear error if no valid combination exists.
 */
export function getValidStartingPointCombinations(
  min: number,
  max: number,
  targetSum: number
): Points[] {
  const cacheKey = `${min}:${max}:${targetSum}`;
  if (cachedKey === cacheKey && cachedCombinations.length > 0) {
    return cachedCombinations;
  }

  const combinations: Points[] = [];
  for (let a = min; a <= max; a++) {
    for (let l = min; l <= max; l++) {
      for (let ast = min; ast <= max; ast++) {
        const ten = targetSum - (a + l + ast);
        if (ten >= min && ten <= max) {
          combinations.push({
            attack: a,
            life: l,
            astucia: ast,
            tenacidade: ten,
          });
        }
      }
    }
  }

  if (combinations.length === 0) {
    throw new Error(
      `Impossible starting points configuration: target sum ${targetSum} cannot be achieved with 4 columns in range [${min}, ${max}].`
    );
  }

  cachedKey = cacheKey;
  cachedCombinations = combinations;
  return combinations;
}

/**
 * Deterministically rolls starting points for an account.
 * Uses an independent fork from the account seed so it never interferes with fight PRNG streams.
 * Uniformly selects one of the pre-enumerated valid combinations without bias.
 */
export function rollStartingPoints(
  accountSeed: string | number,
  config: BalanceConfig
): Points {
  const { min, max } = config.points.startDraw;
  const targetSum = config.points.start;

  const combinations = getValidStartingPointCombinations(min, max, targetSum);
  const prng = createPRNG(accountSeed).fork('starting-points');
  const index = prng.int(0, combinations.length - 1);
  return { ...combinations[index] };
}
