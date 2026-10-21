/**
 * Deterministic PRNG using Mulberry32 algorithm.
 * Pure 32-bit integer arithmetic with Math.imul and >>> 0.
 * Identical behavior in Node.js and all modern browsers.
 */
export class PRNG {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /**
   * Generates a pseudo-random uint32 in [0, 0xFFFFFFFF].
   */
  nextUint32(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  /**
   * Returns a float in [0, 1).
   */
  next(): number {
    return this.nextUint32() / 4294967296;
  }

  /**
   * Returns a float in [min, max).
   */
  float(min = 0, max = 1): number {
    if (min > max) {
      throw new Error(`float(min, max): min (${min}) cannot be greater than max (${max})`);
    }
    return min + this.next() * (max - min);
  }

  /**
   * Returns an integer uniformly distributed in the closed interval [min, max].
   */
  int(min: number, max: number): number {
    if (min > max) {
      throw new Error(`int(min, max): min (${min}) cannot be greater than max (${max})`);
    }
    const range = max - min + 1;
    return min + Math.floor(this.next() * range);
  }

  /**
   * Derives an independent sub-generator using an isolated seed.
   */
  fork(label?: string | number): PRNG {
    const derivedSeed = hashSeed(this.s, label ?? 'fork', this.nextUint32());
    return new PRNG(derivedSeed);
  }

  /**
   * Returns the current internal 32-bit state.
   */
  getState(): number {
    return this.s;
  }
}

/**
 * Mixes arbitrary numbers and strings into a single uint32 seed using FNV-1a
 * combined with MurmurHash3's 32-bit finalizer (fmix32) for full bit avalanche.
 */
export function hashSeed(...parts: (string | number)[]): number {
  let h = 0x811c9dc5; // 2166136261 FNV offset basis
  for (const part of parts) {
    const str = String(part);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0; // 16777619 FNV prime
    }
    h ^= 0xff;
    h = Math.imul(h, 0x01000193) >>> 0;
  }

  // MurmurHash3 fmix32 avalanche: ensures 1-bit input difference flips ~50% output bits
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Factory to create a PRNG instance from any account/fight seed (number or string),
 * always hashing it first to avoid correlation between sequential seeds.
 */
export function createPRNG(seed: string | number): PRNG {
  const hashed = hashSeed(seed);
  return new PRNG(hashed);
}
