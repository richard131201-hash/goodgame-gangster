import { describe, it, expect } from 'vitest';
import { simulateFight } from '../../src/engine/fight.js';
import { validateConfig } from '../../src/engine/schema.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import type { FighterInput } from '../../src/engine/types.js';

describe('Property Tests: Monotonicity (Etapa e)', () => {
  const config = validateConfig(balanceJson);

  function winRate(fA: FighterInput, fB: FighterInput, count: number): number {
    let wins = 0;
    for (let s = 1; s <= count; s++) {
      const res = simulateFight(fA, fB, config, s);
      if (res.winner === 'A') wins++;
    }
    return wins / count;
  }

  it('Monotonicity of Attack: increasing Attack points never reduces win rate (statistical tolerance)', () => {
    const opponent: FighterInput = {
      style: 'malandro',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    };

    const fighterLowAtk: FighterInput = {
      style: 'carrasco',
      level: 1,
      points: { attack: 8, life: 10, astucia: 11, tenacidade: 11 },
    };

    const fighterHighAtk: FighterInput = {
      style: 'carrasco',
      level: 1,
      points: { attack: 14, life: 10, astucia: 8, tenacidade: 8 },
    };

    const fights = 2000;
    const wrLow = winRate(fighterLowAtk, opponent, fights);
    const wrHigh = winRate(fighterHighAtk, opponent, fights);

    console.log(`\nMonotonicity Attack Test: Low Attack WR = ${(wrLow * 100).toFixed(1)}%, High Attack WR = ${(wrHigh * 100).toFixed(1)}%`);
    // High attack must win more than low attack (with 2% margin)
    expect(wrHigh).toBeGreaterThan(wrLow - 0.02);
  });

  it('Monotonicity of Life: increasing Life points never reduces win rate (statistical tolerance)', () => {
    const opponent: FighterInput = {
      style: 'carrasco',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    };

    const fighterLowLife: FighterInput = {
      style: 'muralha',
      level: 1,
      points: { attack: 11, life: 8, astucia: 11, tenacidade: 10 },
    };

    const fighterHighLife: FighterInput = {
      style: 'muralha',
      level: 1,
      points: { attack: 8, life: 14, astucia: 9, tenacidade: 9 },
    };

    const fights = 2000;
    const wrLow = winRate(fighterLowLife, opponent, fights);
    const wrHigh = winRate(fighterHighLife, opponent, fights);

    console.log(`Monotonicity Life Test: Low Life WR = ${(wrLow * 100).toFixed(1)}%, High Life WR = ${(wrHigh * 100).toFixed(1)}%\n`);
    expect(wrHigh).toBeGreaterThan(wrLow - 0.02);
  });
});
