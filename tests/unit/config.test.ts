import { describe, it, expect } from 'vitest';
import { validateConfig, parseConfig } from '../../src/engine/schema.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };

describe('Balance Configuration & Schema (Etapa a)', () => {
  it('should validate the real balance.config.json successfully', () => {
    const config = validateConfig(balanceJson);
    expect(config.levelCap).toBe(100);
    expect(config.points.start).toBe(40);
    expect(config.points.perLevel).toBe(4);
    expect(config.points.startDraw).toEqual({ min: 8, max: 12 });
    expect(config.valuePerPoint.attack).toBe(10);
    expect(config.valuePerPoint.life).toBe(100);
    expect(config.valuePerPoint.levelGrowth).toBe(0.1);
    expect(config.percentCurves.cap).toBe(0.5);
    expect(config.percentCurves.p50Base).toBe(15);
    expect(config.percentCurves.p50PerLevel).toBe(7);
    expect(config.combat.minDamage).toBe(1);
    expect(config.combat.safetyMaxRounds).toBe(10000);

    // Styles
    expect(config.styles.carrasco.attackScale).toBe(2.2);
    expect(config.styles.carrasco.lifeScale).toBe(0.5);
    expect(config.styles.carrasco.armorReduction).toBe(0.15);
    expect(config.styles.carrasco.dodge).toBe(0.05);
    expect(config.styles.carrasco.critBonus).toEqual([0.8, 1.2]);
    expect(config.styles.carrasco.passives.openingStrike).toEqual({ min: 0.1, max: 1.0 });
    expect(config.styles.carrasco.passives.executionArmorIgnore).toBe(0.25);

    expect(config.styles.muralha.attackScale).toBe(0.55);
    expect(config.styles.muralha.lifeScale).toBe(1.95);
    expect(config.styles.muralha.armorReduction).toBe(0.25);
    expect(config.styles.muralha.dodge).toBe(0.05);
    expect(config.styles.muralha.critBonus).toEqual([0.5, 0.9]);
    expect(config.styles.muralha.passives.intimidation).toEqual({
      base: 0.1,
      cap: 0.25,
      rounds: 3,
      perTenPctExtraLife: 0.01,
    });
    expect(config.styles.muralha.passives.tenacityPointMultiplier).toBe(1.4);

    expect(config.styles.malandro.attackScale).toBe(1.1);
    expect(config.styles.malandro.lifeScale).toBe(0.85);
    expect(config.styles.malandro.armorReduction).toBe(0.2);
    expect(config.styles.malandro.dodge).toBe(0.15);
    expect(config.styles.malandro.critBonus).toEqual([0.5, 0.9]);
    expect(config.styles.malandro.passives.adaptationPerPctLifeLost).toBe(0.002);
    expect(config.styles.malandro.passives.astuciaPointMultiplier).toBe(1.2);
  });

  it('should parse valid JSON string with parseConfig', () => {
    const jsonStr = JSON.stringify(balanceJson);
    const config = parseConfig(jsonStr);
    expect(config.levelCap).toBe(100);
  });

  it('should fail immediately when missing required keys', () => {
    const invalidConfig = { levelCap: 100 };
    expect(() => validateConfig(invalidConfig)).toThrowError(/Invalid balance configuration/);
    expect(() => validateConfig(invalidConfig)).toThrowError(/points/);
  });

  it('should fail with clear messages on invalid ranges and values', () => {
    const badConfig = JSON.parse(JSON.stringify(balanceJson));
    badConfig.points.startDraw.min = 15;
    badConfig.points.startDraw.max = 10; // min > max
    expect(() => validateConfig(badConfig)).toThrowError(/startDraw\.min must be less than or equal to startDraw\.max/);

    const badBonusConfig = JSON.parse(JSON.stringify(balanceJson));
    badBonusConfig.styles.carrasco.critBonus = [1.5, 1.0]; // min > max
    expect(() => validateConfig(badBonusConfig)).toThrowError(/critBonus min must be less than or equal to max/);

    const badIntimidation = JSON.parse(JSON.stringify(balanceJson));
    badIntimidation.styles.muralha.passives.intimidation.base = 0.30;
    badIntimidation.styles.muralha.passives.intimidation.cap = 0.20; // base > cap
    expect(() => validateConfig(badIntimidation)).toThrowError(/intimidation\.base must be <= intimidation\.cap/);
  });

  it('should fail on malformed JSON string', () => {
    expect(() => parseConfig('{ invalid json')).toThrowError(/Failed to parse balance config JSON/);
  });
});
