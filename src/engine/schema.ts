import { z } from 'zod';

export const StartDrawSchema = z.object({
  min: z.number().int().min(0),
  max: z.number().int().min(0),
}).refine(data => data.min <= data.max, {
  message: 'startDraw.min must be less than or equal to startDraw.max',
});

export const PointsConfigSchema = z.object({
  start: z.number().int().positive(),
  perLevel: z.number().int().nonnegative(),
  startDraw: StartDrawSchema,
});

export const ValuePerPointSchema = z.object({
  attack: z.number().positive(),
  life: z.number().positive(),
  levelGrowth: z.number().nonnegative(),
});

export const PercentCurvesSchema = z.object({
  cap: z.number().min(0).max(1),
  p50Base: z.number().positive(),
  p50PerLevel: z.number().positive(),
});

export const CombatConfigSchema = z.object({
  minDamage: z.number().positive(),
  safetyMaxRounds: z.number().int().positive(),
});

export const CritBonusTupleSchema = z.tuple([
  z.number().min(0),
  z.number().min(0),
]).refine(([min, max]) => min <= max, {
  message: 'critBonus min must be less than or equal to max',
});

export const CarrascoPassivesSchema = z.object({
  openingStrike: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).refine(data => data.min <= data.max, {
    message: 'openingStrike.min must be <= openingStrike.max',
  }),
  executionArmorIgnore: z.number().min(0).max(1),
});

export const MuralhaPassivesSchema = z.object({
  intimidation: z.object({
    base: z.number().min(0).max(1),
    cap: z.number().min(0).max(1),
    rounds: z.number().int().positive(),
    perTenPctExtraLife: z.number().nonnegative(),
  }).refine(data => data.base <= data.cap, {
    message: 'intimidation.base must be <= intimidation.cap',
  }),
  tenacityPointMultiplier: z.number().positive(),
});

export const MalandroPassivesSchema = z.object({
  adaptationPerPctLifeLost: z.number().nonnegative(),
  astuciaPointMultiplier: z.number().positive(),
});

export const CarrascoStyleSchema = z.object({
  attackScale: z.number().positive(),
  lifeScale: z.number().positive(),
  armorReduction: z.number().min(0).max(1),
  dodge: z.number().min(0).max(1),
  critBonus: CritBonusTupleSchema,
  passives: CarrascoPassivesSchema,
});

export const MuralhaStyleSchema = z.object({
  attackScale: z.number().positive(),
  lifeScale: z.number().positive(),
  armorReduction: z.number().min(0).max(1),
  dodge: z.number().min(0).max(1),
  critBonus: CritBonusTupleSchema,
  passives: MuralhaPassivesSchema,
});

export const MalandroStyleSchema = z.object({
  attackScale: z.number().positive(),
  lifeScale: z.number().positive(),
  armorReduction: z.number().min(0).max(1),
  dodge: z.number().min(0).max(1),
  critBonus: CritBonusTupleSchema,
  passives: MalandroPassivesSchema,
});

export const StylesConfigSchema = z.object({
  carrasco: CarrascoStyleSchema,
  muralha: MuralhaStyleSchema,
  malandro: MalandroStyleSchema,
});

export const BalanceConfigSchema = z.object({
  levelCap: z.number().int().positive(),
  points: PointsConfigSchema,
  valuePerPoint: ValuePerPointSchema,
  percentCurves: PercentCurvesSchema,
  combat: CombatConfigSchema,
  styles: StylesConfigSchema,
});

export type BalanceConfig = z.infer<typeof BalanceConfigSchema>;

/**
 * Validates any raw object against the strict BalanceConfig schema.
 * Throws a descriptive error if invalid.
 */
export function validateConfig(raw: unknown): BalanceConfig {
  const result = BalanceConfigSchema.safeParse(raw);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map(issue => `  - [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid balance configuration:\n${errorDetails}`);
  }
  return result.data;
}

/**
 * Parses and validates a JSON string configuration purely (no filesystem access).
 */
export function parseConfig(jsonString: string): BalanceConfig {
  try {
    const parsed = JSON.parse(jsonString);
    return validateConfig(parsed);
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      throw new Error(`Failed to parse balance config JSON: ${err.message}`);
    }
    throw err;
  }
}
