import type { BalanceConfig } from '../engine/schema.js';
import { derivedStats, getValuePerPoint } from '../engine/stats.js';
import type { FighterInput } from '../engine/types.js';

/**
 * Quanto cada atributo influencia no personagem (R-ATRIB-2): dano, HP, crítico e redução.
 * Função pura, usada pelo balão do painel de atributos. Usa a mesma conta do motor de combate
 * (derivedStats), então nunca mostra um número diferente do que vale na luta.
 */
export type AttrKey = 'attack' | 'life' | 'astucia' | 'tenacidade';

export type InfluenceKind = 'dano' | 'hp' | 'critico' | 'reducao';

export interface AttrInfluence {
  key: AttrKey;
  label: string;
  kind: InfluenceKind;
  /** Pontos que o personagem tem neste atributo. */
  points: number;
  /** Efeito atual: dano base, HP máximo, ou fração (0 a 0,5) para crítico e redução. */
  value: number;
  /** Quanto cada ponto a mais acrescenta (mesma unidade de `value`). 0 se já está no limite. */
  perPoint: number;
  /** Só crítico e redução: já chegou ao teto e mais pontos não ajudam. */
  capped: boolean;
  /** Frase curta do que o atributo faz. */
  effect: string;
}

export const ATTR_LABELS: Record<AttrKey, string> = {
  attack: 'Ataque',
  life: 'Vida',
  astucia: 'Astúcia',
  tenacidade: 'Tenacidade',
};

export function attributeInfluence(input: FighterInput, config: BalanceConfig): Record<AttrKey, AttrInfluence> {
  const now = derivedStats(input, config);
  const style = config.styles[input.style];

  const withPlusOne = (key: AttrKey): FighterInput => ({
    ...input,
    points: { ...input.points, [key]: input.points[key] + 1 },
  });
  const next = (key: AttrKey) => derivedStats(withPlusOne(key), config);

  const cap = config.percentCurves.cap;
  const nextAst = next('astucia');
  const nextTen = next('tenacidade');

  return {
    attack: {
      key: 'attack',
      label: ATTR_LABELS.attack,
      kind: 'dano',
      points: input.points.attack,
      value: now.attackPower,
      perPoint: getValuePerPoint('attack', input.level, config) * style.attackScale,
      capped: false,
      effect: 'Dano base de cada golpe (soma com o dano da arma).',
    },
    life: {
      key: 'life',
      label: ATTR_LABELS.life,
      kind: 'hp',
      points: input.points.life,
      value: now.maxHp,
      perPoint: getValuePerPoint('life', input.level, config) * style.lifeScale,
      capped: false,
      effect: 'Vida máxima: quanto dano você aguenta.',
    },
    astucia: {
      key: 'astucia',
      label: ATTR_LABELS.astucia,
      kind: 'critico',
      points: input.points.astucia,
      value: now.critChance,
      perPoint: nextAst.critChance - now.critChance,
      capped: now.critChance >= cap,
      effect: 'Chance de acertar golpe crítico. Também decide quem ataca primeiro.',
    },
    tenacidade: {
      key: 'tenacidade',
      label: ATTR_LABELS.tenacidade,
      kind: 'reducao',
      points: input.points.tenacidade,
      value: now.critReduction,
      perPoint: nextTen.critReduction - now.critReduction,
      capped: now.critReduction >= cap,
      effect: 'Reduz o bônus de dano dos críticos que você sofre.',
    },
  };
}

/** Número em português: 2552 → "2.552"; 0,59 → "0,6". */
export function formatNumberPt(n: number, decimals = 0): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Fração em percentual: 0,318 → "31,8%". */
export function formatPercentPt(fraction: number, decimals = 1): string {
  return `${formatNumberPt(fraction * 100, decimals)}%`;
}

/** Valor atual já formatado conforme o tipo (dano e HP em número, crítico e redução em %). */
export function formatInfluenceValue(i: AttrInfluence): string {
  return i.kind === 'dano' || i.kind === 'hp' ? formatNumberPt(Math.round(i.value)) : formatPercentPt(i.value);
}

/** Ganho de +1 ponto, formatado, com o sinal. Ex.: "+44 de dano base", "+0,6% de chance de crítico". */
export function formatPerPoint(i: AttrInfluence): string {
  if (i.capped || i.perPoint <= 0) return 'já no limite: mais pontos não ajudam';
  switch (i.kind) {
    case 'dano':
      return `+${formatNumberPt(i.perPoint, i.perPoint < 10 ? 1 : 0)} de dano base`;
    case 'hp':
      return `+${formatNumberPt(i.perPoint, i.perPoint < 10 ? 1 : 0)} de HP máximo`;
    case 'critico':
      return `+${formatPercentPt(i.perPoint, 2)} de chance de crítico`;
    case 'reducao':
      return `+${formatPercentPt(i.perPoint, 2)} de redução do crítico sofrido`;
  }
}

/** Nome do que o atributo muda, para o título do balão. */
export function influenceTitle(i: AttrInfluence): string {
  switch (i.kind) {
    case 'dano':
      return 'Dano base';
    case 'hp':
      return 'HP máximo';
    case 'critico':
      return 'Chance de crítico';
    case 'reducao':
      return 'Redução do crítico sofrido';
  }
}
