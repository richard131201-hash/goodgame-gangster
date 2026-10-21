import { describe, it, expect } from 'vitest';
import { getBuildPoints, getTotalPoints, ALL_BUILD_TYPES } from '../../src/sim/builds.js';
import { calculateRoundPercentiles } from '../../src/sim/metrics.js';
import { simulateMatchup } from '../../src/sim/runner.js';
import { exportCsvReport } from '../../src/sim/reporters.js';
import { runFullSimulation } from '../../src/sim/analyzer.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { validateConfig } from '../../src/engine/schema.js';

describe('Simulator Modules (Etapa f)', () => {
  const config = validateConfig(balanceJson);

  describe('Build Profiles & Point Distribution', () => {
    it('should generate integer points with exact sum for all builds and levels', () => {
      const levels = [1, 10, 50, 100];
      for (const lvl of levels) {
        const expectedTotal = getTotalPoints(lvl, config);

        for (const build of ALL_BUILD_TYPES) {
          const pts = getBuildPoints(build, lvl, config);
          const sum = pts.attack + pts.life + pts.astucia + pts.tenacidade;

          expect(sum).toBe(expectedTotal);
          expect(Number.isInteger(pts.attack)).toBe(true);
          expect(Number.isInteger(pts.life)).toBe(true);
          expect(Number.isInteger(pts.astucia)).toBe(true);
          expect(Number.isInteger(pts.tenacidade)).toBe(true);

          if (build === 'ofensivo') {
            expect(pts.attack).toBeGreaterThanOrEqual(pts.life);
            expect(pts.attack).toBeGreaterThanOrEqual(pts.astucia);
          } else if (build === 'defensivo') {
            expect(pts.life).toBeGreaterThanOrEqual(pts.attack);
            expect(pts.life).toBeGreaterThanOrEqual(pts.astucia);
          }
        }
      }
    });
  });

  describe('Metrics & Round Percentiles', () => {
    it('should compute exact percentiles and averages', () => {
      const rounds = [2, 3, 5, 8, 10, 12, 15, 20, 25, 30];
      const stats = calculateRoundPercentiles(rounds);

      expect(stats.min).toBe(2);
      expect(stats.max).toBe(30);
      expect(stats.avg).toBe(13); // 130 / 10 = 13.00
      expect(stats.p50).toBe(10); // median
      expect(stats.p5).toBe(2);
      expect(stats.p95).toBe(30);
    });

    it('should handle empty rounds gracefully', () => {
      const stats = calculateRoundPercentiles([]);
      expect(stats.avg).toBe(0);
      expect(stats.min).toBe(0);
    });
  });

  describe('Matchup Simulation & Seat Alternation', () => {
    it('should run simulation with seat alternation and report correct stats', () => {
      const res = simulateMatchup(
        'carrasco',
        'equilibrado',
        'muralha',
        'equilibrado',
        1,
        100,
        1234,
        config
      );

      expect(res.totalFights).toBe(100);
      expect(res.winRateA).toBeGreaterThan(0);
      expect(res.winRateA).toBeLessThan(1);
      expect(res.rounds.avg).toBeGreaterThan(0);
      expect(res.firstAttackerWinRate).toBeGreaterThan(0);
      expect(res.intimidationCapPct).toBe(1.0); // Muralha vs Carrasco hits 25% cap 100% of the time at L1
    });
  });

  describe('Export & Analyzer Integration', () => {
    it('should run mini simulation and generate CSV report string', () => {
      const report = runFullSimulation([1], 50, 42, config);
      expect(report.baseMatrices.length).toBe(1);
      expect(report.baseMatrices[0].matchups.length).toBe(9);
      expect(report.level1Variations.length).toBe(3);

      const csv = exportCsvReport(report);
      expect(csv).toContain('Level,StyleA,BuildA,StyleB,BuildB');
      expect(csv).toContain('carrasco,equilibrado,muralha,equilibrado');
    });
  });
});
