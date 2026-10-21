import { describe, it, expect } from 'vitest';
import {
  derivedStats,
  getP50,
  getValuePerPoint,
  getEffectiveAstuciaPoints,
  getEffectiveTenacidadePoints,
} from '../../src/engine/stats.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { validateConfig } from '../../src/engine/schema.js';
import type { FighterInput, Points } from '../../src/engine/types.js';

describe('Derived Stats & Formulas (Etapa c)', () => {
  const config = validateConfig(balanceJson);

  describe('P50 Curve & Value Per Point', () => {
    it('should compute exact P50 values according to design', () => {
      expect(getP50(1, config)).toBe(15);
      expect(getP50(10, config)).toBe(78);
      expect(getP50(50, config)).toBe(358);
      expect(getP50(100, config)).toBe(708);
    });

    it('should compute linear valuePerPoint for attack and life', () => {
      // Level 1: growth factor = 1.0
      expect(getValuePerPoint('attack', 1, config)).toBe(10);
      expect(getValuePerPoint('life', 1, config)).toBe(100);

      // Level 50: growth factor = 1 + 0.1 * 49 = 5.9
      expect(getValuePerPoint('attack', 50, config)).toBe(59);
      expect(getValuePerPoint('life', 50, config)).toBe(590);

      // Level 100: growth factor = 1 + 0.1 * 99 = 10.9
      expect(getValuePerPoint('attack', 100, config)).toBe(109);
      expect(getValuePerPoint('life', 100, config)).toBe(1090);
    });
  });

  describe('Effective Points with Style Passives', () => {
    it('should multiply Astúcia by 1.2 only for Malandro (Instinto)', () => {
      expect(getEffectiveAstuciaPoints('malandro', 10, config)).toBe(12);
      expect(getEffectiveAstuciaPoints('carrasco', 10, config)).toBe(10);
      expect(getEffectiveAstuciaPoints('muralha', 10, config)).toBe(10);
    });

    it('should multiply Tenacidade by 1.4 only for Muralha (Casca grossa)', () => {
      expect(getEffectiveTenacidadePoints('muralha', 10, config)).toBe(14);
      expect(getEffectiveTenacidadePoints('carrasco', 10, config)).toBe(10);
      expect(getEffectiveTenacidadePoints('malandro', 10, config)).toBe(10);
    });
  });

  describe('Hand-Calculated Reference Cases (Levels 1, 50, 100)', () => {
    // Level 1: 10 points in each of the 4 columns (sum 40)
    const ptsL1: Points = { attack: 10, life: 10, astucia: 10, tenacidade: 10 };

    it('Level 1 Reference: Carrasco', () => {
      const f: FighterInput = { style: 'carrasco', level: 1, points: ptsL1 };
      const stats = derivedStats(f, config);

      expect(stats.attackPower).toBeCloseTo(220, 4);
      expect(stats.maxHp).toBe(500);
      expect(stats.effectiveAstuciaPoints).toBe(10);
      expect(stats.effectiveTenacidadePoints).toBe(10);
      expect(stats.critChance).toBeCloseTo(10 / 30, 6); // 50% * 10 / 15 = 33.333%
      expect(stats.critReduction).toBeCloseTo(10 / 30, 6);
      expect(stats.armorReduction).toBe(0.15);
      expect(stats.dodgeChance).toBe(0.05);
    });

    it('Level 1 Reference: Muralha', () => {
      const f: FighterInput = { style: 'muralha', level: 1, points: ptsL1 };
      const stats = derivedStats(f, config);

      expect(stats.attackPower).toBeCloseTo(55, 4);
      expect(stats.maxHp).toBe(1950);
      expect(stats.effectiveAstuciaPoints).toBe(10);
      expect(stats.effectiveTenacidadePoints).toBe(14); // 10 * 1.4
      expect(stats.critChance).toBeCloseTo(10 / 30, 6);
      expect(stats.critReduction).toBeCloseTo(14 / 30, 6); // 50% * 14 / 15 = 46.666%
      expect(stats.armorReduction).toBe(0.25);
      expect(stats.dodgeChance).toBe(0.05);
    });

    it('Level 1 Reference: Malandro', () => {
      const f: FighterInput = { style: 'malandro', level: 1, points: ptsL1 };
      const stats = derivedStats(f, config);

      expect(stats.attackPower).toBeCloseTo(110, 4);
      expect(stats.maxHp).toBe(850);
      expect(stats.effectiveAstuciaPoints).toBe(12); // 10 * 1.2
      expect(stats.effectiveTenacidadePoints).toBe(10);
      expect(stats.critChance).toBeCloseTo(0.40, 6); // 50% * 12 / 15 = 40%
      expect(stats.critReduction).toBeCloseTo(10 / 30, 6);
      expect(stats.armorReduction).toBe(0.20);
      expect(stats.dodgeChance).toBe(0.15);
    });

    // Level 50: 59 points in each column (40 + 4 * 49 = 236 total / 4 = 59)
    const ptsL50: Points = { attack: 59, life: 59, astucia: 59, tenacidade: 59 };

    it('Level 50 Reference: Carrasco', () => {
      const f: FighterInput = { style: 'carrasco', level: 50, points: ptsL50 };
      const stats = derivedStats(f, config);

      expect(stats.attackPower).toBeCloseTo(7658.2, 4);
      expect(stats.maxHp).toBe(17405);
      expect(stats.effectiveAstuciaPoints).toBe(59);
      expect(stats.effectiveTenacidadePoints).toBe(59);
      expect(stats.critChance).toBeCloseTo(29.5 / 358, 6);
      expect(stats.critReduction).toBeCloseTo(29.5 / 358, 6);
      expect(stats.armorReduction).toBe(0.15);
      expect(stats.dodgeChance).toBe(0.05);
    });

    it('Level 50 Reference: Muralha', () => {
      const f: FighterInput = { style: 'muralha', level: 50, points: ptsL50 };
      const stats = derivedStats(f, config);

      expect(stats.attackPower).toBeCloseTo(1914.55, 4);
      expect(stats.maxHp).toBe(67880); // Math.round(67879.5)
      expect(stats.effectiveAstuciaPoints).toBe(59);
      expect(stats.effectiveTenacidadePoints).toBeCloseTo(82.6, 4);
      expect(stats.critChance).toBeCloseTo(29.5 / 358, 6);
      expect(stats.critReduction).toBeCloseTo(41.3 / 358, 6);
      expect(stats.armorReduction).toBe(0.25);
      expect(stats.dodgeChance).toBe(0.05);
    });

    it('Level 50 Reference: Malandro', () => {
      const f: FighterInput = { style: 'malandro', level: 50, points: ptsL50 };
      const stats = derivedStats(f, config);

      expect(stats.attackPower).toBeCloseTo(3829.1, 4);
      expect(stats.maxHp).toBe(29589); // Math.round(29588.5)
      expect(stats.effectiveAstuciaPoints).toBeCloseTo(70.8, 4);
      expect(stats.effectiveTenacidadePoints).toBe(59);
      expect(stats.critChance).toBeCloseTo(35.4 / 358, 6);
      expect(stats.critReduction).toBeCloseTo(29.5 / 358, 6);
      expect(stats.armorReduction).toBe(0.20);
      expect(stats.dodgeChance).toBe(0.15);
    });

    // Level 100: 109 points in each column (40 + 4 * 99 = 436 total / 4 = 109)
    const ptsL100: Points = { attack: 109, life: 109, astucia: 109, tenacidade: 109 };

    it('Level 100 Reference: Carrasco', () => {
      const f: FighterInput = { style: 'carrasco', level: 100, points: ptsL100 };
      const stats = derivedStats(f, config);

      expect(stats.attackPower).toBeCloseTo(26138.2, 4);
      expect(stats.maxHp).toBe(59405);
      expect(stats.effectiveAstuciaPoints).toBe(109);
      expect(stats.effectiveTenacidadePoints).toBe(109);
      expect(stats.critChance).toBeCloseTo(54.5 / 708, 6);
      expect(stats.critReduction).toBeCloseTo(54.5 / 708, 6);
      expect(stats.armorReduction).toBe(0.15);
      expect(stats.dodgeChance).toBe(0.05);
    });

    it('Level 100 Reference: Muralha', () => {
      const f: FighterInput = { style: 'muralha', level: 100, points: ptsL100 };
      const stats = derivedStats(f, config);

      expect(stats.attackPower).toBeCloseTo(6534.55, 4);
      expect(stats.maxHp).toBe(231680); // Math.round(231679.5)
      expect(stats.effectiveAstuciaPoints).toBe(109);
      expect(stats.effectiveTenacidadePoints).toBeCloseTo(152.6, 4);
      expect(stats.critChance).toBeCloseTo(54.5 / 708, 6);
      expect(stats.critReduction).toBeCloseTo(76.3 / 708, 6);
      expect(stats.armorReduction).toBe(0.25);
      expect(stats.dodgeChance).toBe(0.05);
    });

    it('Level 100 Reference: Malandro', () => {
      const f: FighterInput = { style: 'malandro', level: 100, points: ptsL100 };
      const stats = derivedStats(f, config);

      expect(stats.attackPower).toBeCloseTo(13069.1, 4);
      expect(stats.maxHp).toBe(100989); // Math.round(100988.5)
      expect(stats.effectiveAstuciaPoints).toBeCloseTo(130.8, 4);
      expect(stats.effectiveTenacidadePoints).toBe(109);
      expect(stats.critChance).toBeCloseTo(65.4 / 708, 6);
      expect(stats.critReduction).toBeCloseTo(54.5 / 708, 6);
      expect(stats.armorReduction).toBe(0.20);
      expect(stats.dodgeChance).toBe(0.15);
    });
  });

  describe('50% Cap Enforcement & Validation', () => {
    it('should cap critChance and critReduction strictly at 0.50 even if points exceed P50', () => {
      const f: FighterInput = {
        style: 'malandro',
        level: 1, // P50(1) = 15
        points: { attack: 10, life: 10, astucia: 50, tenacidade: 50 }, // 50 >> 15
      };
      const stats = derivedStats(f, config);
      expect(stats.critChance).toBe(0.50);
      expect(stats.critReduction).toBe(0.50);
    });

    it('should throw error when level is outside 1..levelCap', () => {
      const pts: Points = { attack: 10, life: 10, astucia: 10, tenacidade: 10 };
      expect(() => derivedStats({ style: 'carrasco', level: 0, points: pts }, config)).toThrowError(/Level must be between 1 and 100/);
      expect(() => derivedStats({ style: 'carrasco', level: 101, points: pts }, config)).toThrowError(/Level must be between 1 and 100/);
    });
  });
});
