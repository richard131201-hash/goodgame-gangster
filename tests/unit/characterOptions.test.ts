import { describe, it, expect } from 'vitest';
import { renderPaperdollSVG, type CharacterAppearance } from '../../src/web/paperdoll.js';
import {
  GENDER_OPTIONS,
  HAIR_STYLE_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  CLOTHING_OPTIONS,
  HAT_OPTIONS,
  ACCESSORY_OPTIONS,
  BACKGROUND_OPTIONS,
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHING_COLORS,
  optionsFor,
  defaultAppearance,
  applyGender,
  countLooks,
  type Gender,
  type Option,
} from '../../src/web/characterOptions.js';
import { validateCharacterName, cleanCharacterName } from '../../src/web/authRules.js';

// R-PERSONAGEM-1: o criador oferece variedade REAL. Cada opção precisa ter desenho próprio.
const svg = (a: CharacterAppearance) => renderPaperdollSVG(a, { width: 100, height: 120 });

function assertAllDistinct<T extends string>(
  nome: string,
  list: Option<T>[],
  gender: Gender,
  set: (a: CharacterAppearance, id: T) => CharacterAppearance,
) {
  const base = applyGender(defaultAppearance(), gender);
  const options = optionsFor(list, gender);
  const outputs = options.map(o => svg(set(base, o.id)));
  const unicos = new Set(outputs);
  expect(unicos.size, `${nome} (${gender}): opções com o mesmo desenho`).toBe(options.length);
}

describe('variedade do criador de personagem (R-PERSONAGEM-1)', () => {
  for (const g of ['male', 'female'] as Gender[]) {
    it(`cada penteado tem desenho próprio (${g})`, () => {
      assertAllDistinct('cabelo', HAIR_STYLE_OPTIONS, g, (a, id) => ({ ...a, hairStyle: id }));
    });
    it(`cada traje tem desenho próprio (${g})`, () => {
      assertAllDistinct('traje', CLOTHING_OPTIONS, g, (a, id) => ({ ...a, clothing: id }));
    });
    it(`cada chapéu tem desenho próprio (${g})`, () => {
      assertAllDistinct('chapéu', HAT_OPTIONS, g, (a, id) => ({ ...a, hat: id }));
    });
    it(`cada acessório tem desenho próprio (${g})`, () => {
      assertAllDistinct('acessório', ACCESSORY_OPTIONS, g, (a, id) => ({ ...a, accessory: id }));
    });
  }

  it('cada barba tem desenho próprio (masculino)', () => {
    assertAllDistinct('barba', FACIAL_HAIR_OPTIONS, 'male', (a, id) => ({ ...a, facialHair: id }));
  });

  it('cada fundo tem desenho próprio', () => {
    assertAllDistinct('fundo', BACKGROUND_OPTIONS, 'male', (a, id) => ({ ...a, cardBackground: id }));
  });

  it('as cores são todas diferentes entre si (sem repetidas)', () => {
    expect(new Set(SKIN_TONES.map(c => c.value)).size).toBe(SKIN_TONES.length);
    expect(new Set(HAIR_COLORS.map(c => c.value)).size).toBe(HAIR_COLORS.length);
    expect(new Set(EYE_COLORS.map(c => c.value)).size).toBe(EYE_COLORS.length);
    expect(new Set(CLOTHING_COLORS.map(c => c.main + c.sec)).size).toBe(CLOTHING_COLORS.length);
  });

  it('há bastante variedade de cada tipo', () => {
    expect(SKIN_TONES.length).toBeGreaterThanOrEqual(8);
    expect(HAIR_COLORS.length).toBeGreaterThanOrEqual(10);
    expect(EYE_COLORS.length).toBeGreaterThanOrEqual(8);
    expect(CLOTHING_COLORS.length).toBeGreaterThanOrEqual(10);
    expect(optionsFor(HAIR_STYLE_OPTIONS, 'male').length).toBeGreaterThanOrEqual(7);
    expect(optionsFor(HAIR_STYLE_OPTIONS, 'female').length).toBeGreaterThanOrEqual(5);
    expect(optionsFor(CLOTHING_OPTIONS, 'male').length).toBeGreaterThanOrEqual(6);
    expect(optionsFor(CLOTHING_OPTIONS, 'female').length).toBeGreaterThanOrEqual(7);
    expect(HAT_OPTIONS.length).toBeGreaterThanOrEqual(4);
    expect(ACCESSORY_OPTIONS.length).toBeGreaterThanOrEqual(8);
    expect(countLooks('male')).toBeGreaterThan(1_000_000);
    expect(countLooks('female')).toBeGreaterThan(1_000_000);
  });

  it('todas as opções têm id único e rótulo em português não vazio', () => {
    const listas: Option<string>[][] = [
      GENDER_OPTIONS, HAIR_STYLE_OPTIONS, FACIAL_HAIR_OPTIONS, CLOTHING_OPTIONS,
      HAT_OPTIONS, ACCESSORY_OPTIONS, BACKGROUND_OPTIONS,
    ];
    for (const l of listas) {
      expect(new Set(l.map(o => o.id)).size).toBe(l.length);
      for (const o of l) expect(o.label.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('applyGender (corrige o que deixa de valer)', () => {
  it('mulher: barba some, penteado de homem vira um válido, traje de homem continua', () => {
    const m = { ...defaultAppearance(), hairStyle: 'buzz' as const, facialHair: 'beard' as const, accessory: 'cigar' as const };
    const f = applyGender(m, 'female');
    expect(f.gender).toBe('female');
    expect(f.facialHair).toBe('none');
    expect(optionsFor(HAIR_STYLE_OPTIONS, 'female').some(o => o.id === f.hairStyle)).toBe(true);
    expect(f.accessory).toBe('none'); // charuto é só masculino
    expect(f.clothing).toBe(m.clothing);
  });

  it('homem: vestido vira terno e penteado de mulher vira um válido', () => {
    const f = { ...applyGender(defaultAppearance(), 'female'), clothing: 'flapper_dress' as const, hairStyle: 'bob' as const };
    const m = applyGender(f, 'male');
    expect(m.clothing).not.toBe('flapper_dress');
    expect(optionsFor(HAIR_STYLE_OPTIONS, 'male').some(o => o.id === m.hairStyle)).toBe(true);
  });

  it('não altera o objeto original e mantém cores e fundo', () => {
    const a = { ...defaultAppearance(), skinTone: SKIN_TONES[4].value, cardBackground: 'bank' as const };
    const b = applyGender(a, 'female');
    expect(a.gender).toBe('male');
    expect(b.skinTone).toBe(a.skinTone);
    expect(b.cardBackground).toBe('bank');
  });
});

describe('save antigo continua válido', () => {
  it("fedora antigo (accessory='fedora', sem campo hat) ainda desenha o chapéu", () => {
    const antigo = { ...defaultAppearance(), accessory: 'fedora' as const, hat: undefined };
    const semChapeu = { ...defaultAppearance(), accessory: 'none' as const, hat: undefined };
    expect(svg(antigo)).not.toBe(svg(semChapeu));
    const novo = { ...defaultAppearance(), accessory: 'none' as const, hat: 'fedora' as const };
    expect(svg(antigo)).toBe(svg(novo));
  });
});

describe('nome do personagem (R-PERSONAGEM-2)', () => {
  it('aceita nomes normais, com acento, apelido e números', () => {
    for (const n of ['Tony', "Tony 'Navalha'", 'José da Silva', 'Vinícius_77', 'Don Vito "O Carrasco"', 'Ana-Maria']) {
      expect(validateCharacterName(n), n).toBeNull();
    }
  });

  it('recusa vazio, curto e longo', () => {
    expect(validateCharacterName('')).toMatch(/Escolha/);
    expect(validateCharacterName('   ')).toMatch(/Escolha/);
    expect(validateCharacterName('ab')).toMatch(/pelo menos 3/);
    expect(validateCharacterName('x'.repeat(25))).toMatch(/máximo 24/);
    expect(validateCharacterName('x'.repeat(24))).toBeNull();
  });

  it('recusa HTML e símbolos perigosos (o nome aparece em listas)', () => {
    for (const n of ['<script>alert(1)</script>', 'a<b>c', 'Tony & Co', 'x;DROP', 'a=b', '😀😀😀']) {
      expect(validateCharacterName(n), n).not.toBeNull();
    }
  });

  it('limpa espaços nas pontas e repetidos', () => {
    expect(cleanCharacterName('  Tony    Navalha  ')).toBe('Tony Navalha');
  });
});
