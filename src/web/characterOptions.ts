import {
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHING_COLORS,
  type CharacterAppearance,
} from './paperdoll.js';

/**
 * Catálogo de opções do criador de personagem (R-PERSONAGEM-1).
 * Puro (sem DOM): usado pela tela e pelos testes. Cada opção aqui TEM de ter um desenho
 * próprio em paperdoll.ts; o teste `characterOptions.test.ts` garante que nenhuma
 * opção "cai" silenciosamente no desenho de outra.
 */
export type Gender = CharacterAppearance['gender'];

export interface Option<T extends string> {
  id: T;
  label: string;
  /** Se ausente, vale para os dois gêneros. */
  genders?: Gender[];
}

export const GENDER_OPTIONS: Option<Gender>[] = [
  { id: 'male', label: 'Masculino' },
  { id: 'female', label: 'Feminino' },
];

export const HAIR_STYLE_OPTIONS: Option<CharacterAppearance['hairStyle']>[] = [
  { id: 'slick', label: 'Penteado para trás', genders: ['male'] },
  { id: 'pompadour', label: 'Topete', genders: ['male'] },
  { id: 'messy', label: 'Desgrenhado', genders: ['male'] },
  { id: 'buzz', label: 'Raspado militar', genders: ['male'] },
  { id: 'bald', label: 'Careca', genders: ['male'] },
  { id: 'side_part', label: 'Risca de lado' },
  { id: 'curly', label: 'Cacheado' },
  { id: 'bob', label: 'Chanel anos 20', genders: ['female'] },
  { id: 'wavy', label: 'Ondas longas', genders: ['female'] },
  { id: 'updo', label: 'Coque elegante', genders: ['female'] },
];

export const FACIAL_HAIR_OPTIONS: Option<CharacterAppearance['facialHair']>[] = [
  { id: 'none', label: 'Sem barba' },
  { id: 'stubble', label: 'Barba por fazer' },
  { id: 'mustache', label: 'Bigode fino' },
  { id: 'handlebar', label: 'Bigode de guidão' },
  { id: 'goatee', label: 'Cavanhaque' },
  { id: 'vandyke', label: 'Van Dyke' },
  { id: 'beard', label: 'Barba cheia' },
];

export const CLOTHING_OPTIONS: Option<CharacterAppearance['clothing']>[] = [
  { id: 'pinstripe_suit', label: 'Terno risca de giz' },
  { id: 'classic_suit', label: 'Terno clássico' },
  { id: 'trenchcoat', label: 'Sobretudo' },
  { id: 'vest_suspenders', label: 'Colete e suspensórios' },
  { id: 'leather_jacket', label: 'Jaqueta de couro' },
  { id: 'turtleneck', label: 'Gola alta' },
  { id: 'flapper_dress', label: 'Vestido anos 20', genders: ['female'] },
];

export const HAT_OPTIONS: Option<NonNullable<CharacterAppearance['hat']>>[] = [
  { id: 'none', label: 'Sem chapéu' },
  { id: 'fedora', label: 'Fedora' },
  { id: 'flat_cap', label: 'Boina de jornaleiro' },
  { id: 'bowler', label: 'Chapéu coco' },
];

export const ACCESSORY_OPTIONS: Option<Exclude<CharacterAppearance['accessory'], 'fedora'>>[] = [
  { id: 'none', label: 'Nenhum' },
  { id: 'scar', label: 'Cicatriz' },
  { id: 'sunglasses', label: 'Óculos escuros' },
  { id: 'eyepatch', label: 'Tapa-olho' },
  { id: 'monocle', label: 'Monóculo' },
  { id: 'cigar', label: 'Charuto', genders: ['male'] },
  { id: 'gold_chain', label: 'Corrente de ouro' },
  { id: 'earring', label: 'Brinco' },
  { id: 'flower', label: 'Cravo na lapela' },
];

export const BACKGROUND_OPTIONS: Option<CharacterAppearance['cardBackground']>[] = [
  { id: 'alley', label: 'Beco' },
  { id: 'bar', label: 'Bar clandestino' },
  { id: 'dock', label: 'Porto' },
  { id: 'bank', label: 'Banco' },
];

export { SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTHING_COLORS };

/** Opções válidas para o gênero escolhido. */
export function optionsFor<T extends string>(list: Option<T>[], gender: Gender): Option<T>[] {
  return list.filter(o => !o.genders || o.genders.includes(gender));
}

/** Aparência inicial do criador (sem nome: o nome é escolhido no passo da conta). */
export function defaultAppearance(): CharacterAppearance {
  const skin = SKIN_TONES[1];
  const hair = HAIR_COLORS[0];
  const cloth = CLOTHING_COLORS[0];
  return {
    name: '',
    gender: 'male',
    skinTone: skin.value,
    hairStyle: 'slick',
    hairColor: hair.value,
    eyeColor: EYE_COLORS[0].value,
    facialHair: 'none',
    facialHairColor: hair.value,
    clothing: 'pinstripe_suit',
    clothingColor: cloth.main,
    clothingSecondaryColor: cloth.sec,
    accessory: 'none',
    hat: 'none',
    cardBackground: 'alley',
  };
}

/**
 * Troca o gênero e corrige o que deixou de ser válido (cabelo, barba, traje, acessório),
 * sem mexer no resto. Retorna uma cópia.
 */
export function applyGender(app: CharacterAppearance, gender: Gender): CharacterAppearance {
  const next: CharacterAppearance = { ...app, gender };

  const hairs = optionsFor(HAIR_STYLE_OPTIONS, gender);
  if (!hairs.some(o => o.id === next.hairStyle)) next.hairStyle = hairs[0].id;

  if (gender === 'female') next.facialHair = 'none';

  const clothes = optionsFor(CLOTHING_OPTIONS, gender);
  if (!clothes.some(o => o.id === next.clothing)) next.clothing = clothes[0].id;

  const accs = optionsFor(ACCESSORY_OPTIONS, gender);
  if (!accs.some(o => o.id === next.accessory)) next.accessory = 'none';

  return next;
}

/** Quantas combinações diferentes de visual existem para um gênero (para saber a variedade). */
export function countLooks(gender: Gender): number {
  const n = (l: Option<string>[]) => optionsFor(l, gender).length;
  return (
    SKIN_TONES.length *
    n(HAIR_STYLE_OPTIONS) *
    HAIR_COLORS.length *
    EYE_COLORS.length *
    (gender === 'male' ? FACIAL_HAIR_OPTIONS.length : 1) *
    n(CLOTHING_OPTIONS) *
    CLOTHING_COLORS.length *
    HAT_OPTIONS.length *
    n(ACCESSORY_OPTIONS) *
    BACKGROUND_OPTIONS.length
  );
}
