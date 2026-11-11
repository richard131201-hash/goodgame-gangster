import { describe, it, expect } from 'vitest';
import { validateConfig } from '../../src/engine/schema.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { derivedStats } from '../../src/engine/stats.js';
import type { FighterInput, StyleId } from '../../src/engine/types.js';
import {
  attributeInfluence,
  formatInfluenceValue,
  formatPerPoint,
  formatNumberPt,
  formatPercentPt,
  influenceTitle,
  ATTR_LABELS,
  type AttrKey,
} from '../../src/web/attributeInfluence.js';

const config = validateConfig(balanceJson);

const fighter = (style: StyleId, level: number, p = { attack: 12, life: 8, astucia: 10, tenacidade: 10 }): FighterInput => ({
  style,
  level,
  points: p,
});

const KEYS: AttrKey[] = ['attack', 'life', 'astucia', 'tenacidade'];

describe('influência dos atributos (R-ATRIB-2)', () => {
  it('o valor atual é exatamente o que o motor de combate usa', () => {
    for (const style of ['carrasco', 'muralha', 'malandro'] as StyleId[]) {
      for (const level of [1, 10, 50]) {
        const f = fighter(style, level, { attack: 20, life: 15, astucia: 12, tenacidade: 9 });
        const d = derivedStats(f, config);
        const i = attributeInfluence(f, config);
        expect(i.attack.value).toBe(d.attackPower);
        expect(i.life.value).toBe(d.maxHp);
        expect(i.astucia.value).toBe(d.critChance);
        expect(i.tenacidade.value).toBe(d.critReduction);
      }
    }
  });

  it('+1 ponto acrescenta exatamente o "por ponto" mostrado (dano e HP, sem arredondar)', () => {
    for (const style of ['carrasco', 'muralha', 'malandro'] as StyleId[]) {
      const f = fighter(style, 25);
      const i = attributeInfluence(f, config);
      const mais = derivedStats({ ...f, points: { ...f.points, attack: f.points.attack + 1 } }, config);
      expect(mais.attackPower - i.attack.value).toBeCloseTo(i.attack.perPoint, 6);
      const maisVida = derivedStats({ ...f, points: { ...f.points, life: f.points.life + 1 } }, config);
      // o HP do motor é arredondado: a diferença real fica a menos de 1 do valor por ponto
      expect(Math.abs(maisVida.maxHp - i.life.value - i.life.perPoint)).toBeLessThanOrEqual(1);
    }
  });

  it('crítico e redução: +1 ponto muda exatamente o "por ponto"', () => {
    const f = fighter('carrasco', 10);
    const i = attributeInfluence(f, config);
    const a = derivedStats({ ...f, points: { ...f.points, astucia: f.points.astucia + 1 } }, config);
    const t = derivedStats({ ...f, points: { ...f.points, tenacidade: f.points.tenacidade + 1 } }, config);
    expect(a.critChance - i.astucia.value).toBeCloseTo(i.astucia.perPoint, 9);
    expect(t.critReduction - i.tenacidade.value).toBeCloseTo(i.tenacidade.perPoint, 9);
    expect(i.astucia.perPoint).toBeGreaterThan(0);
    expect(i.tenacidade.perPoint).toBeGreaterThan(0);
  });

  it('a passiva do Malandro (Astúcia ×1,2) aparece no ganho por ponto; a do Muralha vale para a Tenacidade', () => {
    const base = fighter('carrasco', 10);
    const mal = fighter('malandro', 10);
    const mur = fighter('muralha', 10);
    expect(attributeInfluence(mal, config).astucia.perPoint).toBeGreaterThan(attributeInfluence(base, config).astucia.perPoint);
    expect(attributeInfluence(mur, config).tenacidade.perPoint).toBeGreaterThan(attributeInfluence(base, config).tenacidade.perPoint);
  });

  it('no teto de 50% mais pontos não ajudam, e o balão diz isso', () => {
    const f = fighter('carrasco', 1, { attack: 10, life: 10, astucia: 500, tenacidade: 500 });
    const i = attributeInfluence(f, config);
    expect(i.astucia.capped).toBe(true);
    expect(i.astucia.perPoint).toBe(0);
    expect(formatPerPoint(i.astucia)).toMatch(/limite/);
    expect(i.tenacidade.capped).toBe(true);
    expect(i.attack.capped).toBe(false);
  });

  it('níveis maiores valem mais por ponto (a conta acompanha o nível)', () => {
    const a1 = attributeInfluence(fighter('carrasco', 1), config).attack.perPoint;
    const a50 = attributeInfluence(fighter('carrasco', 50), config).attack.perPoint;
    expect(a50).toBeGreaterThan(a1);
  });

  it('cada atributo tem nome, tipo e frase em português', () => {
    const i = attributeInfluence(fighter('carrasco', 1), config);
    expect(KEYS.map(k => i[k].label)).toEqual(['Ataque', 'Vida', 'Astúcia', 'Tenacidade']);
    expect(KEYS.map(k => i[k].kind)).toEqual(['dano', 'hp', 'critico', 'reducao']);
    for (const k of KEYS) {
      expect(i[k].effect.length).toBeGreaterThan(10);
      expect(ATTR_LABELS[k]).toBe(i[k].label);
    }
    expect(KEYS.map(k => influenceTitle(i[k]))).toEqual(['Dano base', 'HP máximo', 'Chance de crítico', 'Redução do crítico sofrido']);
  });

  it('formata em português: milhar com ponto, percentual com vírgula', () => {
    expect(formatNumberPt(2552)).toBe('2.552');
    expect(formatNumberPt(0.5, 1)).toBe('0,5');
    expect(formatPercentPt(0.318)).toBe('31,8%');
    expect(formatPercentPt(0.0059, 2)).toBe('0,59%');
    const i = attributeInfluence(fighter('carrasco', 1), config);
    expect(formatInfluenceValue(i.attack)).toMatch(/^\d{1,3}(\.\d{3})*$/);
    expect(formatInfluenceValue(i.astucia)).toMatch(/%$/);
    expect(formatPerPoint(i.attack)).toMatch(/^\+.* de dano base$/);
    expect(formatPerPoint(i.life)).toMatch(/^\+.* de HP máximo$/);
    expect(formatPerPoint(i.astucia)).toMatch(/chance de crítico$/);
    expect(formatPerPoint(i.tenacidade)).toMatch(/redução do crítico sofrido$/);
  });
});
