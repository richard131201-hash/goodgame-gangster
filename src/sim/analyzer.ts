import type { BalanceConfig } from '../engine/schema.js';
import type { StyleId, FighterInput } from '../engine/types.js';
import { ALL_BUILD_TYPES, type BuildType, getBuildPoints } from './builds.js';
import { simulateMatchup, type MatchupResult } from './runner.js';
import { getValidStartingPointCombinations } from '../engine/points.js';
import { simulateFight } from '../engine/fight.js';

export interface StyleMatrix {
  level: number;
  build: BuildType;
  styles: StyleId[];
  matrix: Record<StyleId, Record<StyleId, number>>; // win rates
  matchups: MatchupResult[];
}

export interface Level1Variation {
  style: StyleId;
  bestCombo: string;
  bestWinRate: number;
  worstCombo: string;
  worstWinRate: number;
  spreadPctPoints: number; // best - worst in %
  isUnderThreshold: boolean; // spread < 5%
}

export interface SimulationAlert {
  type: 'imbalance' | 'dominant_build' | 'extreme_duration' | 'useless_stat';
  level: number;
  description: string;
}

export interface SimulationReport {
  timestamp: string;
  configSummary: { levelCap: number; fightsPerCell: number; seed: number };
  executionTimeMs: number;
  baseMatrices: StyleMatrix[];
  buildComparisons: MatchupResult[];
  level1Variations: Level1Variation[];
  alerts: SimulationAlert[];
}

const STYLES: StyleId[] = ['carrasco', 'muralha', 'malandro'];

export function runFullSimulation(
  levels: number[],
  fightsPerCell: number,
  seed: number,
  config: BalanceConfig
): SimulationReport {
  const startTime = Date.now();
  const baseMatrices: StyleMatrix[] = [];
  const buildComparisons: MatchupResult[] = [];
  const alerts: SimulationAlert[] = [];

  // 1. Base 3x3 Matrices (Equilibrado) across levels
  for (const level of levels) {
    const matchups: MatchupResult[] = [];
    const matrix: Record<StyleId, Record<StyleId, number>> = {
      carrasco: { carrasco: 0, muralha: 0, malandro: 0 },
      muralha: { carrasco: 0, muralha: 0, malandro: 0 },
      malandro: { carrasco: 0, muralha: 0, malandro: 0 },
    };

    for (const styleA of STYLES) {
      for (const styleB of STYLES) {
        const res = simulateMatchup(
          styleA,
          'equilibrado',
          styleB,
          'equilibrado',
          level,
          fightsPerCell,
          seed + level * 1000,
          config
        );
        matchups.push(res);
        matrix[styleA][styleB] = res.winRateA;

        // Alerts: Win rate outside 45%..55% for cross-style
        if (styleA !== styleB) {
          if (res.winRateA < 0.45 || res.winRateA > 0.55) {
            alerts.push({
              type: 'imbalance',
              level,
              description: `Confronto ${styleA} vs ${styleB} (L${level}, equilibrado) fora de 45%-55%: ${(res.winRateA * 100).toFixed(1)}% vs ${(100 - res.winRateA * 100).toFixed(1)}%`,
            });
          }
        }

        // Alerts: Duration too short (<3) or too long (>40)
        if (res.rounds.avg < 3 || res.rounds.avg > 40) {
          alerts.push({
            type: 'extreme_duration',
            level,
            description: `Duração média extrema em ${styleA} vs ${styleB} (L${level}): ${res.rounds.avg} rodadas (alvo: 8..15)`,
          });
        }
      }
    }

    baseMatrices.push({
      level,
      build: 'equilibrado',
      styles: STYLES,
      matrix,
      matchups,
    });
  }

  // 2. Build Profiles Comparison across all builds at reference levels
  // Compare each specialized build against Equilibrado and other builds
  for (const level of levels) {
    for (const styleA of STYLES) {
      for (const buildA of ALL_BUILD_TYPES) {
        for (const styleB of STYLES) {
          if (styleA === styleB && buildA === 'equilibrado') continue;
          // Sample specific build comparisons
          const res = simulateMatchup(
            styleA,
            buildA,
            styleB,
            'equilibrado',
            level,
            Math.max(1000, Math.floor(fightsPerCell / 10)), // Sub-sample for build profiles if 100k
            seed + 50000,
            config
          );
          buildComparisons.push(res);
        }
      }
    }
  }

  // Check for Dominant or Useless Builds
  // Group by level and style
  for (const level of levels) {
    for (const style of STYLES) {
      const styleBuilds = buildComparisons.filter(
        b => b.level === level && b.styleA === style && b.styleB !== style
      );

      const wrByBuild = new Map<BuildType, number[]>();
      for (const b of styleBuilds) {
        if (!wrByBuild.has(b.buildA)) wrByBuild.set(b.buildA, []);
        wrByBuild.get(b.buildA)!.push(b.winRateA);
      }

      for (const [build, rates] of wrByBuild.entries()) {
        const avgWr = rates.reduce((a, c) => a + c, 0) / rates.length;
        if (avgWr > 0.70) {
          alerts.push({
            type: 'dominant_build',
            level,
            description: `Build '${build}' para ${style} (L${level}) é dominante com taxa média de vitória de ${(avgWr * 100).toFixed(1)}%`,
          });
        } else if (avgWr < 0.25) {
          alerts.push({
            type: 'useless_stat',
            level,
            description: `Build '${build}' para ${style} (L${level}) tem desempenho muito baixo: média de ${(avgWr * 100).toFixed(1)}%`,
          });
        }
      }
    }
  }

  // 3. Level 1 Variation between rolled starting profiles (within same style)
  const level1Variations: Level1Variation[] = [];
  const combos = getValidStartingPointCombinations(
    config.points.startDraw.min,
    config.points.startDraw.max,
    config.points.start
  );

  for (const style of STYLES) {
    // Benchmark opponent: average balanced profile
    const opponent: FighterInput = {
      style,
      level: 1,
      points: getBuildPoints('equilibrado', 1, config),
    };

    let bestRate = -1;
    let worstRate = 2;
    let bestCombo = '';
    let worstCombo = '';

    const testFights = 500;
    for (const combo of combos) {
      const fighter: FighterInput = { style, level: 1, points: combo };
      let wins = 0;
      for (let s = 1; s <= testFights; s++) {
        const r = simulateFight(fighter, opponent, config, seed + s);
        if (r.winner === 'A') wins++;
      }
      const rate = wins / testFights;
      const comboStr = `[${combo.attack},${combo.life},${combo.astucia},${combo.tenacidade}]`;

      if (rate > bestRate) {
        bestRate = rate;
        bestCombo = comboStr;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstCombo = comboStr;
      }
    }

    const spread = (bestRate - worstRate) * 100;
    level1Variations.push({
      style,
      bestCombo,
      bestWinRate: Number((bestRate * 100).toFixed(2)),
      worstCombo,
      worstWinRate: Number((worstRate * 100).toFixed(2)),
      spreadPctPoints: Number(spread.toFixed(2)),
      isUnderThreshold: spread <= 5.0, // Target: < 5 percentage points
    });
  }

  const executionTimeMs = Date.now() - startTime;

  return {
    timestamp: new Date().toISOString(),
    configSummary: {
      levelCap: config.levelCap,
      fightsPerCell,
      seed,
    },
    executionTimeMs,
    baseMatrices,
    buildComparisons,
    level1Variations,
    alerts,
  };
}
