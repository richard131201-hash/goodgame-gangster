import { describe, it, expect } from 'vitest';
import { createPRNG } from '../../src/engine/prng.js';
import { ITEM_ATTRS, ITEM_SLOTS, ITEM_SLOT_LABELS, itemPoints, rollItem } from '../../src/shared/itemRoll.js';

const soma = (p: Record<string, number>) => Object.values(p).reduce((a, b) => a + b, 0);

describe('os 8 slots do perfil (R-ITEM-2)', () => {
  it('são exatamente estes 8, e a arma não é um deles', () => {
    expect([...ITEM_SLOTS].map(s => ITEM_SLOT_LABELS[s])).toEqual([
      'Chapéu',
      'Peitoral',
      'Calça',
      'Calçado',
      'Amuleto da sorte',
      'Pet',
      'Relíquia',
      'Veículo',
    ]);
    expect(ITEM_SLOTS).not.toContain('arma' as never);
  });
});

describe('pontos de um item por nível (R-ITEM-2, valores provisórios)', () => {
  it('meio ponto por nível, no mínimo 1', () => {
    expect(itemPoints(1)).toBe(1);
    expect(itemPoints(2)).toBe(1);
    expect(itemPoints(5)).toBe(3);
    expect(itemPoints(10)).toBe(5);
    expect(itemPoints(20)).toBe(10);
  });

  it('nunca diminui ao subir de nível', () => {
    let anterior = 0;
    for (let lv = 1; lv <= 100; lv++) {
      const p = itemPoints(lv);
      expect(p).toBeGreaterThanOrEqual(anterior);
      anterior = p;
    }
  });

  it('nível 1: os 8 itens somam 8 pontos; nível 10: 40', () => {
    expect(itemPoints(1) * ITEM_SLOTS.length).toBe(8);
    expect(itemPoints(10) * ITEM_SLOTS.length).toBe(40);
  });
});

describe('sorteio do item (R-ITEM-2)', () => {
  it('o item é do nível do jogador e a soma dos pontos é exatamente a do nível', () => {
    const prng = createPRNG('teste-1');
    for (const lv of [1, 2, 7, 10, 33, 100]) {
      for (const slot of ITEM_SLOTS) {
        const it = rollItem(lv, slot, () => prng.next());
        expect(it.level).toBe(lv);
        expect(it.slot).toBe(slot);
        expect(soma(it.points)).toBe(itemPoints(lv));
        for (const a of ITEM_ATTRS) expect(it.points[a]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('mesma semente, mesmo item (o servidor pode refazer o sorteio e conferir)', () => {
    const p1 = createPRNG('semente-x');
    const p2 = createPRNG('semente-x');
    expect(rollItem(12, 'pet', () => p1.next())).toEqual(rollItem(12, 'pet', () => p2.next()));
  });

  it('é aleatório de verdade: os 4 atributos aparecem, e nenhum domina (milhares de sorteios)', () => {
    const prng = createPRNG('distribuicao');
    const total = { attack: 0, life: 0, astucia: 0, tenacidade: 0 };
    for (let n = 0; n < 4000; n++) {
      const it = rollItem(10, 'chapeu', () => prng.next());
      for (const a of ITEM_ATTRS) total[a] += it.points[a];
    }
    const todos = soma(total);
    expect(todos).toBe(4000 * 5);
    for (const a of ITEM_ATTRS) {
      const fatia = total[a] / todos;
      expect(fatia, a).toBeGreaterThan(0.22);
      expect(fatia, a).toBeLessThan(0.28);
    }
  });

  it('um rand que devolve quase 1 não estoura a lista de atributos', () => {
    const it = rollItem(4, 'calcado', () => 0.9999999);
    expect(soma(it.points)).toBe(itemPoints(4));
    expect(it.points.tenacidade).toBe(itemPoints(4));
  });

  it('nível inválido (0, negativo, decimal) vira um nível válido, sem quebrar', () => {
    expect(rollItem(0, 'pet', () => 0).level).toBe(1);
    expect(rollItem(-5, 'pet', () => 0).level).toBe(1);
    expect(rollItem(7.9, 'pet', () => 0).level).toBe(7);
  });
});
