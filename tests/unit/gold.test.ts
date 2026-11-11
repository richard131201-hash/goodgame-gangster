import { describe, it, expect } from 'vitest';
import { GOLD, rollGoldDrop, goldCap } from '../../src/shared/gold.js';
import { applyXp, createNewPlayer } from '../../src/shared/player.js';

/** Gerador pseudoaleatório simples e fixo (mulberry32) para os testes serem repetíveis. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('ouro: ganha 125 ao subir de nível (R-OURO-1)', () => {
  const novo = () => createNewPlayer('Teste', 'carrasco', {} as never, 'colt_1911');

  it('o personagem começa com 25 de ouro', () => {
    expect(novo().gold).toBe(GOLD.start);
  });

  it('um nível = +125 de ouro', () => {
    const p = novo();
    const antes = p.gold;
    const subiu = applyXp(p, p.xpToNextLevel);
    expect(subiu).toBe(true);
    expect(p.level).toBe(2);
    expect(p.gold).toBe(antes + GOLD.perLevel);
  });

  it('vários níveis de uma vez pagam 125 cada', () => {
    const p = novo();
    const antes = p.gold;
    applyXp(p, 1_000_000);
    expect(p.gold).toBe(antes + GOLD.perLevel * (p.level - 1));
  });

  it('XP que não completa o nível não dá ouro', () => {
    const p = novo();
    applyXp(p, 1);
    expect(p.gold).toBe(GOLD.start);
  });
});

describe('ouro: drop raro em missão (R-OURO-2)', () => {
  it('chance de 3%: nada cai quando o sorteio é 3% ou mais', () => {
    expect(rollGoldDrop(() => GOLD.dropChance)).toBe(0);
    expect(rollGoldDrop(() => 0.99)).toBe(0);
  });

  it('cai quando o sorteio é abaixo de 3%, entre 10 e 30', () => {
    const menor = rollGoldDrop(() => 0); // sorteio 0 e posição 0: o mais provável (10)
    expect(menor).toBe(GOLD.dropMin);
    const seq = [0.01, 0.9999];
    let i = 0;
    const maior = rollGoldDrop(() => seq[i++]); // última posição: o mais raro (30)
    expect(maior).toBe(GOLD.dropMax);
  });

  it('em 200.000 missões: cerca de 3% dropam, tudo entre 10 e 30, e 10 é bem mais comum que 30', () => {
    const rand = seeded(2026);
    const n = 200_000;
    const cont = new Map<number, number>();
    let drops = 0;
    for (let i = 0; i < n; i++) {
      const g = rollGoldDrop(rand);
      if (g === 0) continue;
      drops++;
      expect(g).toBeGreaterThanOrEqual(GOLD.dropMin);
      expect(g).toBeLessThanOrEqual(GOLD.dropMax);
      cont.set(g, (cont.get(g) ?? 0) + 1);
    }
    expect(drops / n).toBeGreaterThan(0.027);
    expect(drops / n).toBeLessThan(0.033);
    expect(cont.get(GOLD.dropMin)!).toBeGreaterThan((cont.get(GOLD.dropMax) ?? 0) * 5);
    // o peso cai de 10 até 30: 10 > 20 > 30
    expect(cont.get(10)!).toBeGreaterThan(cont.get(20)!);
    expect(cont.get(20)!).toBeGreaterThan(cont.get(30) ?? 0);
  });
});

describe('ouro: teto que o servidor aceita', () => {
  it('nível 1 sem missões: só o inicial', () => {
    expect(goldCap(1, 0)).toBe(25);
  });
  it('cada nível soma 125 e cada missão, até 30 de drop', () => {
    expect(goldCap(2, 0)).toBe(25 + 125);
    expect(goldCap(1, 10)).toBe(25 + 300);
  });
});
