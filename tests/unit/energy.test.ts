import { describe, it, expect } from 'vitest';
import { regenEnergy, msToNextEnergy, ENERGY_SECONDS_PER_POINT } from '../../src/web/energy.js';

const S = ENERGY_SECONDS_PER_POINT * 1000; // 1 ponto
const T0 = 1_000_000;

describe('regra do fundador (R-ENERGIA-1)', () => {
  it('1 ponto a cada 7 minutos', () => {
    expect(ENERGY_SECONDS_PER_POINT).toBe(420);
  });

  it('100 de energia levam 11h40 do zero, e o teto é 100', () => {
    const start = T0;
    expect(regenEnergy(0, 100, start, start + 99 * S).energy).toBe(99);
    expect(regenEnergy(0, 100, start, start + 100 * S).energy).toBe(100);
    expect(regenEnergy(0, 100, start, start + 500 * S).energy).toBe(100);
  });
});

describe('regenEnergy', () => {
  it('não muda antes de completar 1 ponto', () => {
    expect(regenEnergy(50, 100, T0, T0 + S - 1)).toEqual({ energy: 50, lastAt: T0 });
  });

  it('dá 1 ponto ao completar o tempo e guarda a sobra', () => {
    const r = regenEnergy(50, 100, T0, T0 + S + 500);
    expect(r.energy).toBe(51);
    expect(r.lastAt).toBe(T0 + S);
  });

  it('acumula vários pontos de uma vez (jogador ficou fora)', () => {
    expect(regenEnergy(10, 100, T0, T0 + 5 * S).energy).toBe(15);
  });

  it('nunca passa do máximo e zera o contador', () => {
    const now = T0 + 1000 * S;
    expect(regenEnergy(10, 100, T0, now)).toEqual({ energy: 100, lastAt: now });
  });

  it('energia cheia mantém o contador parado (lastAt = agora)', () => {
    expect(regenEnergy(100, 100, T0, T0 + 99 * S)).toEqual({ energy: 100, lastAt: T0 + 99 * S });
  });

  it('save antigo sem marca de tempo recomeça sem dar energia de graça', () => {
    expect(regenEnergy(40, 100, undefined, T0)).toEqual({ energy: 40, lastAt: T0 });
  });

  it('relógio que voltou no tempo não gera energia nem trava', () => {
    expect(regenEnergy(40, 100, T0, T0 - 5 * S)).toEqual({ energy: 40, lastAt: T0 - 5 * S });
  });

  it('bônus de Família acelera a regeneração', () => {
    // +100% = o dobro da velocidade: 2 pontos no mesmo tempo
    expect(regenEnergy(50, 100, T0, T0 + S, 100).energy).toBe(52);
  });
});

describe('msToNextEnergy', () => {
  it('conta o que falta para o próximo ponto', () => {
    expect(msToNextEnergy(50, 100, T0, T0 + 30_000)).toBe(S - 30_000);
  });
  it('é 0 com energia cheia', () => {
    expect(msToNextEnergy(100, 100, T0, T0)).toBe(0);
  });
});
