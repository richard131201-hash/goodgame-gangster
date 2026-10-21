import { describe, it, expect } from 'vitest';
import { PRNG, hashSeed, createPRNG } from '../../src/engine/prng.js';

describe('PRNG (Mulberry32 & hashSeed)', () => {
  it('should match exact deterministic snapshot of first 10 values for seed 12345', () => {
    const prng = new PRNG(12345);
    const values: number[] = [];
    for (let i = 0; i < 10; i++) {
      values.push(prng.next());
    }

    // Locked deterministic snapshot for seed 12345
    const expected = [
      0.9797282677609473,
      0.3067522644996643,
      0.484205421525985,
      0.817934412509203,
      0.5094283693470061,
      0.34747186047025025,
      0.07375754183158278,
      0.7663964673411101,
      0.9968264393974096,
      0.8250224851071835,
    ];

    expect(values).toEqual(expected);
  });

  it('should generate identical sequence for identical seeds and different for different seeds', () => {
    const prng1 = new PRNG(99999);
    const prng2 = new PRNG(99999);
    const prng3 = new PRNG(100000);

    const seq1 = Array.from({ length: 50 }, () => prng1.next());
    const seq2 = Array.from({ length: 50 }, () => prng2.next());
    const seq3 = Array.from({ length: 50 }, () => prng3.next());

    expect(seq1).toEqual(seq2);
    expect(seq1).not.toEqual(seq3);
  });

  it('should cover both endpoints and never exit [min, max] in int() across 1,000,000 samples', () => {
    const prng = new PRNG(42);
    const min = 8;
    const max = 12;
    let hitMin = false;
    let hitMax = false;

    for (let i = 0; i < 1_000_000; i++) {
      const val = prng.int(min, max);
      if (val < min || val > max) {
        throw new Error(`int(${min}, ${max}) produced out of bounds value: ${val}`);
      }
      if (val === min) hitMin = true;
      if (val === max) hitMax = true;
    }

    expect(hitMin).toBe(true);
    expect(hitMax).toBe(true);
  });

  it('should throw error when min > max in int() or float()', () => {
    const prng = new PRNG(1);
    expect(() => prng.int(10, 5)).toThrowError(/cannot be greater than/);
    expect(() => prng.float(10, 5)).toThrowError(/cannot be greater than/);
  });

  it('should maintain uniformity in float(0, 1) with mean ~ 0.5 and balanced 10-bin histogram', () => {
    const prng = new PRNG(777);
    const samples = 100_000;
    const bins = new Array(10).fill(0);
    let sum = 0;

    for (let i = 0; i < samples; i++) {
      const v = prng.float(0, 1);
      sum += v;
      const binIdx = Math.min(9, Math.floor(v * 10));
      bins[binIdx]++;
    }

    const mean = sum / samples;
    // Expected mean is 0.5; tolerance ±0.005 for 100k samples
    expect(mean).toBeGreaterThan(0.495);
    expect(mean).toBeLessThan(0.505);

    // Each bin expected ~10,000 (10%); tolerance ±500 (±5% of bin count)
    for (let i = 0; i < 10; i++) {
      expect(bins[i]).toBeGreaterThan(9500);
      expect(bins[i]).toBeLessThan(10500);
    }
  });

  it('should eliminate correlation between sequential seeds via hashSeed', () => {
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const hashes = seeds.map(s => hashSeed(s));
    const firstFloats = seeds.map(s => createPRNG(s).next());

    // Check that hashes are widely spread
    for (let i = 0; i < hashes.length - 1; i++) {
      expect(hashes[i]).not.toBe(hashes[i + 1]);
      const diff = Math.abs(hashes[i] - hashes[i + 1]);
      // Should not be small differences like +1
      expect(diff).toBeGreaterThan(1_000_000);
    }

    // Check that first floats span across the [0, 1) range, not clustered
    const minFloat = Math.min(...firstFloats);
    const maxFloat = Math.max(...firstFloats);
    expect(maxFloat - minFloat).toBeGreaterThan(0.5);
  });

  it('should fork independent, reproducible child PRNGs', () => {
    const parent1 = createPRNG('main-account');
    const child1 = parent1.fork('sub-routine');

    const parent2 = createPRNG('main-account');
    const child2 = parent2.fork('sub-routine');

    const child3 = parent2.fork('different-label');

    expect(child1.next()).toBe(child2.next());
    expect(child1.next()).not.toBe(child3.next());
  });
});
