import { describe, it, expect } from 'vitest';
import {
  getValidStartingPointCombinations,
  rollStartingPoints,
} from '../../src/engine/points.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { validateConfig } from '../../src/engine/schema.js';

describe('Starting Points Distribution (Etapa b)', () => {
  const config = validateConfig(balanceJson);

  it('should find exactly 85 combinations for 4 columns in [8, 12] summing to 40', () => {
    const combinations = getValidStartingPointCombinations(8, 12, 40);
    expect(combinations.length).toBe(85);

    // Verify all 85 satisfy the constraints
    for (const combo of combinations) {
      expect(combo.attack + combo.life + combo.astucia + combo.tenacidade).toBe(40);
      expect(combo.attack).toBeGreaterThanOrEqual(8);
      expect(combo.attack).toBeLessThanOrEqual(12);
      expect(combo.life).toBeGreaterThanOrEqual(8);
      expect(combo.life).toBeLessThanOrEqual(12);
      expect(combo.astucia).toBeGreaterThanOrEqual(8);
      expect(combo.astucia).toBeLessThanOrEqual(12);
      expect(combo.tenacidade).toBeGreaterThanOrEqual(8);
      expect(combo.tenacidade).toBeLessThanOrEqual(12);
    }
  });

  it('should throw clear error on impossible configuration', () => {
    expect(() => getValidStartingPointCombinations(11, 12, 40)).toThrowError(
      /Impossible starting points configuration/
    );
  });

  it('should yield identical starting points for the same account seed (string or number)', () => {
    const ptsNum1 = rollStartingPoints(12345, config);
    const ptsNum2 = rollStartingPoints(12345, config);
    expect(ptsNum1).toEqual(ptsNum2);

    const ptsStr1 = rollStartingPoints('user_abc_789', config);
    const ptsStr2 = rollStartingPoints('user_abc_789', config);
    expect(ptsStr1).toEqual(ptsStr2);

    expect(ptsNum1).not.toEqual(ptsStr1);
  });

  it('should maintain strict properties across 10,000 account seeds', () => {
    const numAccounts = 10_000;
    const combinations = getValidStartingPointCombinations(8, 12, 40);
    const counts = new Map<string, number>();

    const sums = { attack: 0, life: 0, astucia: 0, tenacidade: 0 };
    const sqSums = { attack: 0, life: 0, astucia: 0, tenacidade: 0 };

    for (let i = 1; i <= numAccounts; i++) {
      const seed = `player_account_${i}`;
      const pts = rollStartingPoints(seed, config);

      // Check sum and ranges
      const total = pts.attack + pts.life + pts.astucia + pts.tenacidade;
      expect(total).toBe(40);
      expect(pts.attack).toBeGreaterThanOrEqual(8);
      expect(pts.attack).toBeLessThanOrEqual(12);
      expect(pts.life).toBeGreaterThanOrEqual(8);
      expect(pts.life).toBeLessThanOrEqual(12);
      expect(pts.astucia).toBeGreaterThanOrEqual(8);
      expect(pts.astucia).toBeLessThanOrEqual(12);
      expect(pts.tenacidade).toBeGreaterThanOrEqual(8);
      expect(pts.tenacidade).toBeLessThanOrEqual(12);

      // Tally for stats
      sums.attack += pts.attack;
      sums.life += pts.life;
      sums.astucia += pts.astucia;
      sums.tenacidade += pts.tenacidade;

      sqSums.attack += pts.attack * pts.attack;
      sqSums.life += pts.life * pts.life;
      sqSums.astucia += pts.astucia * pts.astucia;
      sqSums.tenacidade += pts.tenacidade * pts.tenacidade;

      const key = `${pts.attack},${pts.life},${pts.astucia},${pts.tenacidade}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // Verify all 85 combinations appeared at least once
    expect(counts.size).toBe(85);

    // Compute mean and standard deviation
    const stats = {
      attack: {
        mean: sums.attack / numAccounts,
        stdDev: Math.sqrt(sqSums.attack / numAccounts - Math.pow(sums.attack / numAccounts, 2)),
      },
      life: {
        mean: sums.life / numAccounts,
        stdDev: Math.sqrt(sqSums.life / numAccounts - Math.pow(sums.life / numAccounts, 2)),
      },
      astucia: {
        mean: sums.astucia / numAccounts,
        stdDev: Math.sqrt(sqSums.astucia / numAccounts - Math.pow(sums.astucia / numAccounts, 2)),
      },
      tenacidade: {
        mean: sums.tenacidade / numAccounts,
        stdDev: Math.sqrt(sqSums.tenacidade / numAccounts - Math.pow(sums.tenacidade / numAccounts, 2)),
      },
    };

    // Columns should have mean very close to 10.0 (tolerance ±0.15 for 10k samples)
    expect(stats.attack.mean).toBeGreaterThan(9.85);
    expect(stats.attack.mean).toBeLessThan(10.15);
    expect(stats.life.mean).toBeGreaterThan(9.85);
    expect(stats.life.mean).toBeLessThan(10.15);
    expect(stats.astucia.mean).toBeGreaterThan(9.85);
    expect(stats.astucia.mean).toBeLessThan(10.15);
    expect(stats.tenacidade.mean).toBeGreaterThan(9.85);
    expect(stats.tenacidade.mean).toBeLessThan(10.15);

    // Standard deviation should be around ~1.15 to ~1.25 for all columns
    expect(stats.attack.stdDev).toBeGreaterThan(1.0);
    expect(stats.attack.stdDev).toBeLessThan(1.4);

    // Sort combinations by frequency
    const sortedCombos = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const top5 = sortedCombos.slice(0, 5);
    const bottom5 = sortedCombos.slice(-5);

    // Expected count per combination: 10,000 / 85 ≈ 117.6
    // Print report for verification
    console.log('\n--- RELATÓRIO DO SORTEIO INICIAL (10.000 CONTAS) ---');
    console.log(`Total de combinações possíveis: ${combinations.length}`);
    console.log(`Combinações observadas: ${counts.size} de ${combinations.length} (100% de cobertura)`);
    console.log('Médias e Desvios Padrão por Coluna:');
    console.log(`  Ataque:     Média = ${stats.attack.mean.toFixed(3)}, Desvio = ${stats.attack.stdDev.toFixed(3)}`);
    console.log(`  Vida:       Média = ${stats.life.mean.toFixed(3)}, Desvio = ${stats.life.stdDev.toFixed(3)}`);
    console.log(`  Astúcia:    Média = ${stats.astucia.mean.toFixed(3)}, Desvio = ${stats.astucia.stdDev.toFixed(3)}`);
    console.log(`  Tenacidade: Média = ${stats.tenacidade.mean.toFixed(3)}, Desvio = ${stats.tenacidade.stdDev.toFixed(3)}`);
    console.log(`Frequência esperada por combinação: ${(numAccounts / 85).toFixed(1)}`);
    console.log('Top 5 combinações mais frequentes:');
    top5.forEach(([combo, cnt]) => console.log(`  [${combo}]: ${cnt} ocorrências (${((cnt / numAccounts) * 100).toFixed(2)}%)`));
    console.log('Top 5 combinações menos frequentes:');
    bottom5.forEach(([combo, cnt]) => console.log(`  [${combo}]: ${cnt} ocorrências (${((cnt / numAccounts) * 100).toFixed(2)}%)`));
    console.log('-----------------------------------------------------\n');
  });
});
