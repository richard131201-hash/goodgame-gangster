import { describe, it, expect } from 'vitest';
import { simulateFight } from '../../src/engine/fight.js';
import { validateConfig } from '../../src/engine/schema.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import type { FighterInput } from '../../src/engine/types.js';

describe('Combat Engine - Full Fight (Etapa e)', () => {
  const config = validateConfig(balanceJson);

  const baseFighterA: FighterInput = {
    style: 'carrasco',
    level: 1,
    points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
  };

  const baseFighterB: FighterInput = {
    style: 'muralha',
    level: 1,
    points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
  };

  it('determines initiative by effective Astucia points', () => {
    // Malandro has 10 points * 1.2 = 12 effective Astucia
    const malandro: FighterInput = {
      style: 'malandro',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    };
    // Carrasco has 10 points * 1.0 = 10 effective Astucia
    const carrasco: FighterInput = {
      style: 'carrasco',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    };

    const fight = simulateFight(carrasco, malandro, config, 42);
    expect(fight.firstAttacker).toBe('B'); // Malandro attacks first
  });

  it('breaks initiative tie deterministically using seed', () => {
    // Both carrasco with equal astucia
    const fA = { ...baseFighterA };
    const fB = { ...baseFighterA };

    const fight1 = simulateFight(fA, fB, config, 100);
    const fight2 = simulateFight(fA, fB, config, 100);
    expect(fight1.firstAttacker).toBe(fight2.firstAttacker);

    // Across different seeds, both A and B can win initiative
    const initiatives = new Set<string>();
    for (let s = 1; s <= 50; s++) {
      initiatives.add(simulateFight(fA, fB, config, s).firstAttacker);
    }
    expect(initiatives.has('A')).toBe(true);
    expect(initiatives.has('B')).toBe(true);
  });

  it('strictly satisfies determinism: same inputs and seed produce identical fight and events', () => {
    const fA: FighterInput = {
      style: 'carrasco',
      level: 10,
      points: { attack: 25, life: 25, astucia: 15, tenacidade: 11 },
      weapon: { min: 10, max: 20 },
    };
    const fB: FighterInput = {
      style: 'malandro',
      level: 10,
      points: { attack: 20, life: 26, astucia: 18, tenacidade: 12 },
      weapon: { min: 8, max: 24 },
    };

    const result1 = simulateFight(fA, fB, config, 9999, { withEvents: true });
    const result2 = simulateFight(fA, fB, config, 9999, { withEvents: true });

    expect(result1.winner).toBe(result2.winner);
    expect(result1.rounds).toBe(result2.rounds);
    expect(result1.firstAttacker).toBe(result2.firstAttacker);
    expect(result1.finalHp).toEqual(result2.finalHp);
    expect(result1.events).toEqual(result2.events);
  });

  it('finishes fight immediately when one fighter reaches 0 HP', () => {
    const result = simulateFight(baseFighterA, baseFighterB, config, 42, { withEvents: true });

    expect(['A', 'B']).toContain(result.winner);
    const loser = result.winner === 'A' ? 'B' : 'A';
    expect(result.finalHp[loser]).toBe(0);
    expect(result.finalHp[result.winner]).toBeGreaterThan(0);

    // Verify last event caused HP to drop to 0
    const lastEvent = result.events![result.events!.length - 1];
    expect(lastEvent.defender).toBe(loser);
    expect(lastEvent.defenderHpRemaining).toBe(0);
  });

  it('throws error when safetyMaxRounds is exceeded', () => {
    const stalledConfig = JSON.parse(JSON.stringify(config));
    stalledConfig.combat.safetyMaxRounds = 2; // Artificially low limit

    expect(() => simulateFight(baseFighterA, baseFighterB, stalledConfig, 1)).toThrowError(
      /Safety round limit exceeded \(2\)/
    );
  });
});
