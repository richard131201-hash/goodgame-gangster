import { describe, it, expect } from 'vitest';
import { executeStrike, type FighterCombatState } from '../../src/engine/strike.js';
import { derivedStats } from '../../src/engine/stats.js';
import { PRNG } from '../../src/engine/prng.js';
import { validateConfig } from '../../src/engine/schema.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import type { FighterInput } from '../../src/engine/types.js';

describe('Combat Strike Calculation (Etapa d - Step by Step)', () => {
  const config = validateConfig(balanceJson);

  function createFighter(side: 'A' | 'B', input: FighterInput): FighterCombatState {
    const stats = derivedStats(input, config);
    return {
      side,
      input,
      stats,
      currentHp: stats.maxHp,
      openingStrikeUsed: false,
    };
  }

  /**
   * Helper class to mock PRNG calls deterministically.
   */
  class MockPRNG extends PRNG {
    private nextQueue: number[] = [];
    private floatQueue: number[] = [];
    private intQueue: number[] = [];

    constructor() {
      super(1);
    }

    queueNext(...values: number[]) {
      this.nextQueue.push(...values);
    }

    queueFloat(...values: number[]) {
      this.floatQueue.push(...values);
    }

    queueInt(...values: number[]) {
      this.intQueue.push(...values);
    }

    override next(): number {
      if (this.nextQueue.length > 0) return this.nextQueue.shift()!;
      return 0.999; // Default: will not dodge (0.999 >= 0.15) and will not crit
    }

    override float(min = 0, max = 1): number {
      if (this.floatQueue.length > 0) return this.floatQueue.shift()!;
      return (min + max) / 2;
    }

    override int(min: number, max: number): number {
      if (this.intQueue.length > 0) return this.intQueue.shift()!;
      return min;
    }
  }

  it('RULE: Esquiva - dodges if roll < dodgeChance, deals 0 damage', () => {
    const attacker = createFighter('A', {
      style: 'carrasco',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });
    const defender = createFighter('B', {
      style: 'malandro', // 15% dodge
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });

    const prng = new MockPRNG();
    prng.queueNext(0.10); // 0.10 < 0.15 => Dodge!

    const result = executeStrike(attacker, defender, 1, 1, config, prng);
    expect(result.hit).toBe(false);
    expect(result.damage).toBe(0);
    expect(result.event.isDodge).toBe(true);
    expect(defender.currentHp).toBe(defender.stats.maxHp);
    // Opening strike was consumed even though it dodged!
    expect(attacker.openingStrikeUsed).toBe(true);
  });

  it('RULE: Crítico e Tenacidade - Tenacity only reduces the bonus, never the base', () => {
    // Malandro vs Muralha
    // Malandro base attack power = 10 * 10 * 1.1 = 110.
    // Armor of Muralha = 25% (reduction 0.25).
    // Let's test round 4 so Intimidation does not interfere.
    const attacker = createFighter('A', {
      style: 'malandro',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });
    const defender = createFighter('B', {
      style: 'muralha',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 }, // 10 tenacidade * 1.4 = 14 pts -> 46.67% critReduction
    });

    // 1. Non-crit strike:
    const prngNonCrit = new MockPRNG();
    prngNonCrit.queueNext(0.999); // No dodge
    prngNonCrit.queueNext(0.999); // No crit
    const nonCrit = executeStrike(attacker, defender, 4, 1, config, prngNonCrit);

    // Damage expected: 110 * (1 - 0.25) = 82.5 -> Math.round = 83.
    expect(nonCrit.event.rawDamage).toBeCloseTo(82.5, 4);
    expect(nonCrit.damage).toBe(83);

    // 2. Crit strike with +70% bonus (0.70):
    // Effective bonus = 0.70 * (1 - (14/30)) = 0.70 * (16/30) = 0.70 * 0.5333333 = 0.3733333.
    // Damage: 110 * (1 + 0.3733333) * 0.75 = 110 * 1.3733333 * 0.75 = 113.30.
    const prngCrit = new MockPRNG();
    prngCrit.queueNext(0.999); // No dodge
    prngCrit.queueNext(0.01);  // Crit!
    prngCrit.queueFloat(0.70); // Sampled crit bonus: +70%

    // Reset defender HP
    defender.currentHp = defender.stats.maxHp;
    const critResult = executeStrike(attacker, defender, 4, 2, config, prngCrit);

    expect(critResult.event.isCrit).toBe(true);
    expect(critResult.event.rawDamage).toBeCloseTo(113.30, 2);
    expect(critResult.damage).toBe(113);
  });

  it('RULE: Execução (Carrasco) - ignores 25% of target armor', () => {
    // Carrasco attacks Muralha (25% base armor) in round 4
    const attacker = createFighter('A', {
      style: 'carrasco',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });
    attacker.openingStrikeUsed = true; // Avoid opening strike

    const defender = createFighter('B', {
      style: 'muralha',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });

    const prng = new MockPRNG();
    prng.queueNext(0.999); // No dodge
    prng.queueNext(0.999); // No crit

    const result = executeStrike(attacker, defender, 4, 1, config, prng);
    // Effective armor = 0.25 * (1 - 0.25) = 0.1875
    expect(result.event.armorReductionApplied).toBeCloseTo(0.1875, 4);

    // Base damage = 10 * 10 * 2.2 = 220.
    // Damage after armor = 220 * (1 - 0.1875) = 220 * 0.8125 = 178.75 -> Math.round = 179.
    expect(result.event.rawDamage).toBeCloseTo(178.75, 4);
    expect(result.damage).toBe(179);
  });

  it('RULE: Intimidação (Muralha) - applies on rounds 1..3, floors at 10% and caps at 25%', () => {
    // Muralha has 1950 HP, Carrasco has 500 HP.
    // Extra life = (1950 - 500) / 500 * 100 = 290%.
    // Intimidation = 10% + 29% = 39% -> Capped at 25%!
    const attacker = createFighter('A', {
      style: 'carrasco',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });
    attacker.openingStrikeUsed = true;

    const defender = createFighter('B', {
      style: 'muralha',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });

    const prng = new MockPRNG();
    prng.queueNext(0.999);
    prng.queueNext(0.999);

    // Round 1: Intimidation applied at cap 25%
    const r1 = executeStrike(attacker, defender, 1, 1, config, prng);
    expect(r1.event.intimidationReductionApplied).toBe(0.25);
    expect(r1.intimidationHitCap).toBe(true);

    // Round 3: Still applied
    prng.queueNext(0.999);
    prng.queueNext(0.999);
    const r3 = executeStrike(attacker, defender, 3, 1, config, prng);
    expect(r3.event.intimidationReductionApplied).toBe(0.25);

    // Round 4: NOT applied
    prng.queueNext(0.999);
    prng.queueNext(0.999);
    const r4 = executeStrike(attacker, defender, 4, 1, config, prng);
    expect(r4.event.intimidationReductionApplied).toBeUndefined();

    // Floor test: When attacker has MORE HP than Muralha
    const giantAttacker = createFighter('A', {
      style: 'muralha',
      level: 1,
      points: { attack: 10, life: 50, astucia: 10, tenacidade: 10 }, // More HP than defender
    });
    prng.queueNext(0.999);
    prng.queueNext(0.999);
    const floorResult = executeStrike(giantAttacker, defender, 1, 1, config, prng);
    expect(floorResult.event.intimidationReductionApplied).toBe(0.10); // Floor 10%
  });

  it('RULE: Golpe de abertura (Carrasco) - exactly once per fight, scales with Astúcia ratio', () => {
    const carrasco = createFighter('A', {
      style: 'carrasco',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });
    const malandro = createFighter('B', {
      style: 'malandro',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 }, // 12 astucia pts
    });

    // Ratio = 10 / (10 + 12) = 10 / 22 = 5 / 11.
    // Bonus = 0.10 + 0.90 * (5/11) = 0.10 + 0.40909 = 0.50909.
    const prng = new MockPRNG();
    prng.queueNext(0.999); // No dodge
    prng.queueNext(0.999); // No crit

    // First strike:
    const s1 = executeStrike(carrasco, malandro, 4, 1, config, prng);
    expect(s1.event.openingStrikeBonus).toBeCloseTo(0.10 + 0.90 * (10 / 22), 4);
    expect(carrasco.openingStrikeUsed).toBe(true);

    // Second strike:
    prng.queueNext(0.999);
    prng.queueNext(0.999);
    const s2 = executeStrike(carrasco, malandro, 4, 2, config, prng);
    expect(s2.event.openingStrikeBonus).toBeUndefined();
  });

  it('RULE: Adaptação (Malandro) - +0.2% per 1% life lost, continuous', () => {
    const malandro = createFighter('A', {
      style: 'malandro',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });
    const opponent = createFighter('B', {
      style: 'carrasco',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });

    const prng = new MockPRNG();
    prng.queueNext(0.999);
    prng.queueNext(0.999);

    // At 100% HP: bonus = 0
    const s1 = executeStrike(malandro, opponent, 4, 1, config, prng);
    expect(s1.event.adaptationBonus).toBeCloseTo(0, 4);

    // Reduce Malandro HP to 50% (50% life lost)
    malandro.currentHp = malandro.stats.maxHp * 0.5;
    prng.queueNext(0.999);
    prng.queueNext(0.999);
    const s2 = executeStrike(malandro, opponent, 4, 2, config, prng);
    // 50% lost * 0.002 = 0.10 (+10% damage)
    expect(s2.event.adaptationBonus).toBeCloseTo(0.10, 4);
  });

  it('RULE: Dano mínimo de 1 por golpe que acerta', () => {
    // A weak attacker dealing almost 0 damage against high armor and intimidation
    const weakling = createFighter('A', {
      style: 'muralha',
      level: 1,
      points: { attack: 0, life: 10, astucia: 10, tenacidade: 10 }, // 0 attack points
    });
    const target = createFighter('B', {
      style: 'muralha',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });

    const prng = new MockPRNG();
    prng.queueNext(0.999); // No dodge
    prng.queueNext(0.999); // No crit

    const result = executeStrike(weakling, target, 1, 1, config, prng);
    expect(result.hit).toBe(true);
    expect(result.damage).toBe(1); // Min damage floor 1
  });

  it('RULE: Weapon Damage - throws error if min > max, otherwise samples [min, max]', () => {
    const attacker = createFighter('A', {
      style: 'carrasco',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
      weapon: { min: 100, max: 50 }, // Invalid!
    });
    const defender = createFighter('B', {
      style: 'muralha',
      level: 1,
      points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 },
    });

    const prng = new MockPRNG();
    prng.queueNext(0.999);
    expect(() => executeStrike(attacker, defender, 1, 1, config, prng)).toThrowError(
      /Weapon min damage.*cannot be greater than max/
    );
  });
});
