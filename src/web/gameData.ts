import { WEAPONS_CATALOG, type WeaponDef } from '../engine/weapons.js';
import type { StyleId } from '../engine/types.js';
import type { CharacterAppearance } from './paperdoll.js';

export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable';

export interface GameItem {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
  priceCash: number;
  priceGold: number;
  levelReq: number;
  description: string;
  weaponRefId?: string; // links to WeaponDef if weapon
  /** Posição (0, 1, 2...) do item na Mala. Ausente = o jogo coloca no primeiro slot vazio (R-MALA-4). */
  slot?: number;
  statsBonus?: {
    attack?: number;
    life?: number;
    astucia?: number;
    tenacidade?: number;
    armorReduction?: number; // e.g. 0.05 for +5% armor
    dodgeChance?: number; // e.g. 0.05 for +5% dodge
  };
  consumableEffect?: {
    type: 'energy' | 'buff_attack' | 'buff_life' | 'cash';
    value: number;
    durationBattles?: number;
  };
}

// ==========================================
// SHOP ITEMS CATALOG (ARMORS, ACCESSORIES, CONSUMABLES + WEAPONS)
// ==========================================
export const SHOP_ITEMS: GameItem[] = [
  // Weapons mapped from WEAPONS_CATALOG
  ...WEAPONS_CATALOG.map((w, idx): GameItem => ({
    id: `item_${w.id}`,
    name: w.name,
    type: 'weapon',
    icon: w.icon,
    priceCash: Math.round(150 + idx * 85),
    priceGold: idx % 3 === 0 ? 5 : 0,
    levelReq: Math.min(60, 1 + Math.floor(idx * 3.5)),
    description: `${w.description} (Dano: +${w.min} a +${w.max})`,
    weaponRefId: w.id,
    statsBonus: {
      attack: Math.round((w.min + w.max) / 2),
    },
  })),

  // Defensive Armors / Suits
  {
    id: 'armor_colete_leve',
    name: 'Colete de Kevlar Oculto',
    type: 'armor',
    icon: '🛡️',
    priceCash: 280,
    priceGold: 0,
    levelReq: 2,
    description: 'Colete balístico leve usado por baixo da camisa. Concede +120 de Vida e +3% de Armadura.',
    statsBonus: { life: 120, armorReduction: 0.03 },
  },
  {
    id: 'armor_sobretudo_blindado',
    name: 'Sobretudo Noir Forrado',
    type: 'armor',
    icon: '🧥',
    priceCash: 750,
    priceGold: 10,
    levelReq: 5,
    description: 'Sobretudo elegante com placas de aço costuradas. Concede +350 de Vida e +6% de Armadura.',
    statsBonus: { life: 350, armorReduction: 0.06 },
  },
  {
    id: 'armor_colete_tatico',
    name: 'Blindagem Tática do Don',
    type: 'armor',
    icon: '🦺',
    priceCash: 2200,
    priceGold: 25,
    levelReq: 12,
    description: 'Proteção pesada de alta tecnologia para guerras de clãs. Concede +900 de Vida e +10% de Armadura.',
    statsBonus: { life: 900, armorReduction: 0.10 },
  },

  // Mafia Accessories / Lucky Charms
  {
    id: 'acc_anel_ouro',
    name: 'Anel do Selo da Família',
    type: 'accessory',
    icon: '💍',
    priceCash: 350,
    priceGold: 5,
    levelReq: 3,
    description: 'Símbolo de autoridade mafiosa. +15 Astúcia e +2% de Esquiva.',
    statsBonus: { astucia: 15, dodgeChance: 0.02 },
  },
  {
    id: 'acc_relogio_ouro',
    name: 'Relógio de Bolso em Ouro 24k',
    type: 'accessory',
    icon: '⏱️',
    priceCash: 980,
    priceGold: 12,
    levelReq: 8,
    description: 'Precisão para cronometrar os golpes e assaltos. +25 Astúcia e +25 Tenacidade.',
    statsBonus: { astucia: 25, tenacidade: 25 },
  },
  {
    id: 'acc_amuleto_corleone',
    name: 'Corrente de Ouro com Santo Protetor',
    type: 'accessory',
    icon: '🪙',
    priceCash: 2400,
    priceGold: 30,
    levelReq: 15,
    description: 'Abençoado pelo Don. Concede +40 Ataque, +400 Vida e +30 Tenacidade.',
    statsBonus: { attack: 40, life: 400, tenacidade: 30 },
  },

  // Consumables
  {
    id: 'cons_whisky',
    name: 'Uísque Escocês Contrabandeado',
    type: 'consumable',
    icon: '🥃',
    priceCash: 120,
    priceGold: 0,
    levelReq: 1,
    description: 'Dose forte que queima a garganta. Recupera instantaneamente 35 de Energia.',
    consumableEffect: { type: 'energy', value: 35 },
  },
  {
    id: 'cons_charuto',
    name: 'Charuto Cubano de Montecristo',
    type: 'consumable',
    icon: '🚬',
    priceCash: 180,
    priceGold: 2,
    levelReq: 2,
    description: 'Traga a fumaça com calma de líder. Concede +15% de Dano nas próximas 5 batalhas.',
    consumableEffect: { type: 'buff_attack', value: 15, durationBattles: 5 },
  },
  {
    id: 'cons_medkit',
    name: 'Maleta do Médico Clandestino',
    type: 'consumable',
    icon: '💉',
    priceCash: 250,
    priceGold: 3,
    levelReq: 3,
    description: 'Soro e analgésicos pesados. Concede +25% de Vida Máxima nas próximas 5 batalhas.',
    consumableEffect: { type: 'buff_life', value: 25, durationBattles: 5 },
  },
  {
    id: 'cons_cafe_expresso',
    name: 'Café Forte Italiano com Dopagem',
    type: 'consumable',
    icon: '☕',
    priceCash: 300,
    priceGold: 4,
    levelReq: 1,
    description: 'Adrenalina pura. Restaura completamente 100 de Energia!',
    consumableEffect: { type: 'energy', value: 100 },
  },
];

// ==========================================
// GODFATHER MISSIONS (MISSÕES DO PADRINHO)
// ==========================================
export interface MissionDef {
  id: string;
  title: string;
  chapter: string;
  location: string;
  icon: string;
  energyCost: number;
  xpReward: number;
  cashReward: number;
  itemDropChance: number; // 0.0 to 1.0
  possibleDropId?: string;
  briefing: string;
  opponent: {
    name: string;
    style: StyleId;
    level: number;
    weaponId: string;
    points: { attack: number; life: number; astucia: number; tenacidade: number };
    appearance: CharacterAppearance;
  };
}

export const MISSIONS_LIST: MissionDef[] = [
  {
    id: 'mis_1_ruas',
    chapter: 'Capítulo I — Cobrança no Beco',
    title: 'Cobrança no Beco da Navalha',
    location: 'Beco dos Açougues',
    icon: '🗡️',
    energyCost: 15,
    xpReward: 45,
    cashReward: 160,
    itemDropChance: 0.35,
    possibleDropId: 'item_revolver_38',
    briefing: 'O dono da taverna está atrasando o tributo de proteção da nossa família. Dê um susto nele antes que os policiais do bairro notem.',
    opponent: {
      name: 'Pietro "Olho Torto"',
      style: 'malandro',
      level: 1,
      weaponId: 'revolver_38',
      points: { attack: 9, life: 11, astucia: 12, tenacidade: 8 },
      appearance: {
        name: 'Pietro "Olho Torto"',
        gender: 'male',
        skinTone: '#fae0cd',
        hairStyle: 'messy',
        hairColor: '#3e2723',
        eyeColor: '#4e342e',
        facialHair: 'stubble',
        facialHairColor: '#3e2723',
        clothing: 'vest_suspenders',
        clothingColor: '#303238',
        clothingSecondaryColor: '#8d4f2a',
        accessory: 'scar',
        cardBackground: 'alley',
      },
    },
  },
  {
    id: 'mis_2_bar',
    chapter: 'Capítulo I — Cobrança no Beco',
    title: 'Emboscada no Speakeasy Clandestino',
    location: 'Bar Subterrâneo do Luigi',
    icon: '🍸',
    energyCost: 20,
    xpReward: 85,
    cashReward: 290,
    itemDropChance: 0.40,
    possibleDropId: 'cons_whisky',
    briefing: 'Dois capangas da gangue rival estão cobrando pedágio dos nossos clientes no bar. Entre lá e mostre quem manda nesta vizinhança.',
    opponent: {
      name: 'Bruno "Quebra-Ossos"',
      style: 'muralha',
      level: 3,
      weaponId: 'sawed_off',
      points: { attack: 12, life: 20, astucia: 8, tenacidade: 14 },
      appearance: {
        name: 'Bruno "Quebra-Ossos"',
        gender: 'male',
        skinTone: '#e2b38f',
        hairStyle: 'buzz',
        hairColor: '#1b1b1e',
        eyeColor: '#546e7a',
        facialHair: 'beard',
        facialHairColor: '#1b1b1e',
        clothing: 'classic_suit',
        clothingColor: '#212121',
        clothingSecondaryColor: '#5b1212',
        accessory: 'cigar',
        cardBackground: 'bar',
      },
    },
  },
  {
    id: 'mis_3_porto',
    chapter: 'Capítulo II — Contrabando no Cais',
    title: 'Interceptar Carregamento no Cais 4',
    location: 'Porto Noturno',
    icon: '🚢',
    energyCost: 25,
    xpReward: 140,
    cashReward: 480,
    itemDropChance: 0.45,
    possibleDropId: 'item_colt_1911',
    briefing: 'Uma carga de uísque e armamento militar vinda de navio acabou de atracar. A polícia portuária foi subornada, mas um esquadrão rival tenta interceptar o carregamento.',
    opponent: {
      name: 'Capitão Carmelo',
      style: 'carrasco',
      level: 5,
      weaponId: 'colt_1911',
      points: { attack: 26, life: 14, astucia: 16, tenacidade: 10 },
      appearance: {
        name: 'Capitão Carmelo',
        gender: 'male',
        skinTone: '#c5926b',
        hairStyle: 'slick',
        hairColor: '#9e9e9e',
        eyeColor: '#1e88e5',
        facialHair: 'mustache',
        facialHairColor: '#9e9e9e',
        clothing: 'trenchcoat',
        clothingColor: '#102a43',
        clothingSecondaryColor: '#d4af37',
        accessory: 'sunglasses',
        cardBackground: 'dock',
      },
    },
  },
  {
    id: 'mis_4_cassino',
    chapter: 'Capítulo II — Contrabando no Cais',
    title: 'Cobrança do Cassino Imperial',
    location: 'Cassino Subterrâneo',
    icon: '🎲',
    energyCost: 30,
    xpReward: 210,
    cashReward: 750,
    itemDropChance: 0.50,
    possibleDropId: 'armor_sobretudo_blindado',
    briefing: 'O gerente do Cassino tentou desviar fichas da contabilidade da Família. Confronte o chefe dos seguranças dele no salão nobre.',
    opponent: {
      name: 'Dino "Gatilho Rápido"',
      style: 'malandro',
      level: 8,
      weaponId: 'tommy_gun',
      points: { attack: 30, life: 25, astucia: 32, tenacidade: 20 },
      appearance: {
        name: 'Dino "Gatilho Rápido"',
        gender: 'male',
        skinTone: '#fae0cd',
        hairStyle: 'pompadour',
        hairColor: '#1b1b1e',
        eyeColor: '#2e7d32',
        facialHair: 'stubble',
        facialHairColor: '#1b1b1e',
        clothing: 'pinstripe_suit',
        clothingColor: '#121212',
        clothingSecondaryColor: '#e74c3c',
        accessory: 'fedora',
        cardBackground: 'bar',
      },
    },
  },
  {
    id: 'mis_5_banco',
    chapter: 'Capítulo III — Golpe no Coração da Cidade',
    title: 'O Grande Assalto ao Cofre do Banco',
    location: 'Banco Central Municipal',
    icon: '🏦',
    energyCost: 35,
    xpReward: 320,
    cashReward: 1250,
    itemDropChance: 0.60,
    possibleDropId: 'item_tommy_gun',
    briefing: 'Hora do golpe maior. Neutralize a escolta fortemente armada da agência e arrombe o cofre com as bananas de dinamite.',
    opponent: {
      name: 'Comissário Vane',
      style: 'muralha',
      level: 12,
      weaponId: 'pump_trench',
      points: { attack: 35, life: 60, astucia: 25, tenacidade: 38 },
      appearance: {
        name: 'Comissário Vane',
        gender: 'male',
        skinTone: '#e2b38f',
        hairStyle: 'buzz',
        hairColor: '#9e9e9e',
        eyeColor: '#4e342e',
        facialHair: 'beard',
        facialHairColor: '#9e9e9e',
        clothing: 'trenchcoat',
        clothingColor: '#212121',
        clothingSecondaryColor: '#d4af37',
        accessory: 'cigar',
        cardBackground: 'dock',
      },
    },
  },
  {
    id: 'mis_6_mansao',
    chapter: 'Capítulo III — Golpe no Coração da Cidade',
    title: 'Eliminação na Mansão Maroni',
    location: 'Mansão no Topo da Colina',
    icon: '🏰',
    energyCost: 40,
    xpReward: 500,
    cashReward: 2000,
    itemDropChance: 0.70,
    possibleDropId: 'item_bar_1918',
    briefing: 'O próprio líder da facção rival está cercado em sua fortaleza. Derrote seus guarda-costas e force a rendição definitiva dele!',
    opponent: {
      name: 'Don Salvatore Maroni',
      style: 'carrasco',
      level: 15,
      weaponId: 'bar_1918',
      points: { attack: 70, life: 42, astucia: 48, tenacidade: 30 },
      appearance: {
        name: 'Don Salvatore Maroni',
        gender: 'male',
        skinTone: '#c5926b',
        hairStyle: 'slick',
        hairColor: '#eceff1',
        eyeColor: '#546e7a',
        facialHair: 'mustache',
        facialHairColor: '#eceff1',
        clothing: 'pinstripe_suit',
        clothingColor: '#5b1212',
        clothingSecondaryColor: '#d4af37',
        accessory: 'gold_chain',
        cardBackground: 'bar',
      },
    },
  },
];

// ==========================================
// RIVAL DUEL GANGSTERS (ARENA PvP MATCHMAKING)
// ==========================================
export interface DuelRival {
  id: string;
  name: string;
  style: StyleId;
  level: number;
  respect: number;
  bountyCash: number;
  weaponId: string;
  points: { attack: number; life: number; astucia: number; tenacidade: number };
  appearance: CharacterAppearance;
}

export function generateRivalPool(playerLevel: number): DuelRival[] {
  const styles: StyleId[] = ['carrasco', 'muralha', 'malandro'];
  const names = [
    'Tony "Duas Pistolas"', 'Frankie "Garganta de Aço"', 'Silvio "Sombra"',
    'Gina "Veneno Puro"', 'Carmine "O Touro"', 'Donnie "Navalheiro"',
    'Lucia "Dama de Espadas"', 'Vincenzo "Fúria"', 'Giacomo "Carcereiro"',
  ];

  return names.map((name, i) => {
    const lvlDiff = (i % 3) - 1; // -1, 0, +1
    const rLvl = Math.max(1, playerLevel + lvlDiff);
    const style = styles[i % styles.length];
    const totalPoints = 40 + (rLvl - 1) * 4;

    let pts = { attack: 10, life: 10, astucia: 10, tenacidade: 10 };
    if (style === 'carrasco') {
      pts = { attack: Math.round(totalPoints * 0.45), life: Math.round(totalPoints * 0.20), astucia: Math.round(totalPoints * 0.25), tenacidade: Math.round(totalPoints * 0.10) };
    } else if (style === 'muralha') {
      pts = { attack: Math.round(totalPoints * 0.15), life: Math.round(totalPoints * 0.50), astucia: Math.round(totalPoints * 0.10), tenacidade: Math.round(totalPoints * 0.25) };
    } else {
      pts = { attack: Math.round(totalPoints * 0.25), life: Math.round(totalPoints * 0.25), astucia: Math.round(totalPoints * 0.35), tenacidade: Math.round(totalPoints * 0.15) };
    }

    const availableWeapons = WEAPONS_CATALOG.filter(w => w.min <= 20 + rLvl * 2);
    const chosenWeapon = availableWeapons[i % availableWeapons.length] || WEAPONS_CATALOG[0];

    return {
      id: `rival_${i}`,
      name,
      style,
      level: rLvl,
      respect: 100 + rLvl * 65 + i * 15,
      bountyCash: 80 + rLvl * 45 + i * 20,
      weaponId: chosenWeapon.id,
      points: pts,
      appearance: {
        name,
        gender: i % 4 === 0 ? 'female' : 'male',
        skinTone: ['#fae0cd', '#e2b38f', '#c5926b', '#8f5c38'][i % 4],
        hairStyle: ['slick', 'pompadour', 'buzz', 'bob'][i % 4] as any,
        hairColor: '#1b1b1e',
        eyeColor: '#4e342e',
        facialHair: i % 4 === 0 ? 'none' : 'stubble',
        facialHairColor: '#1b1b1e',
        clothing: ['pinstripe_suit', 'trenchcoat', 'vest_suspenders', 'classic_suit'][i % 4] as any,
        clothingColor: ['#212121', '#102a43', '#5b1212', '#1b3a27'][i % 4],
        clothingSecondaryColor: '#d4af37',
        accessory: ['fedora', 'sunglasses', 'cigar', 'scar'][i % 4] as any,
        cardBackground: ['alley', 'bar', 'dock'][i % 3] as any,
      },
    };
  });
}

// ==========================================
// MAFIA CLANS (FAMÍLIAS DO CRIME)
// ==========================================
export interface MafiaFamily {
  id: string;
  name: string;
  leaderName: string;
  emblem: string;
  membersCount: number;
  maxMembers: number;
  respectTotal: number;
  treasuryCash: number;
  treasuryGold: number;
  buffs: {
    attackBonusPct: number;
    xpBonusPct: number;
    energyRegenBonusPct: number;
  };
  motto: string;
}

export const MAFIA_FAMILIES_LIST: MafiaFamily[] = [
  {
    id: 'fam_corleone',
    name: 'Família Corleone',
    leaderName: 'Don Vito Corleone',
    emblem: '👑',
    membersCount: 28,
    maxMembers: 30,
    respectTotal: 14250,
    treasuryCash: 85000,
    treasuryGold: 450,
    buffs: { attackBonusPct: 8, xpBonusPct: 10, energyRegenBonusPct: 15 },
    motto: '"Uma proposta que ninguém pode recusar."',
  },
  {
    id: 'fam_gambino',
    name: 'Família Gambino',
    leaderName: 'Carlo Gambino',
    emblem: '♠️',
    membersCount: 22,
    maxMembers: 30,
    respectTotal: 11800,
    treasuryCash: 62000,
    treasuryGold: 310,
    buffs: { attackBonusPct: 12, xpBonusPct: 6, energyRegenBonusPct: 10 },
    motto: '"Silêncio, honra e aço afiado."',
  },
  {
    id: 'fam_luciano',
    name: 'Sindicato Luciano',
    leaderName: 'Lucky Luciano',
    emblem: '🎲',
    membersCount: 19,
    maxMembers: 30,
    respectTotal: 9600,
    treasuryCash: 48000,
    treasuryGold: 260,
    buffs: { attackBonusPct: 5, xpBonusPct: 15, energyRegenBonusPct: 20 },
    motto: '"A sorte favorece quem controla os dados."',
  },
];

// ==========================================
// SYNDICATE RAID BOSS EVENT (EVENTOS CLANDESTINOS)
// ==========================================
export interface RaidBossEvent {
  id: string;
  name: string;
  title: string;
  description: string;
  bossName: string;
  bossStyle: StyleId;
  bossMaxHp: number;
  bossCurrentHp: number;
  bossWeaponId: string;
  rewardCash: number;
  rewardGold: number;
  rewardRespect: number;
  exclusiveItemDropId: string;
  timeRemainingHours: number;
}

export const CURRENT_RAID_EVENT: RaidBossEvent = {
  id: 'event_lei_seca',
  name: 'Operação Lei Seca: O Grande Cerco',
  title: 'Invasão Federal & O Juiz Corrupto',
  description: 'O Juiz Federal "Martelo de Ferro" Hastings está liderando uma força-tarefa especial para erradicar todos os sindicatos mafiosos da cidade. Reúna os mafiosos e derrube este titã em combate coletivo!',
  bossName: 'Juiz "Martelo de Ferro" Hastings',
  bossStyle: 'muralha',
  bossMaxHp: 85000,
  bossCurrentHp: 58240,
  bossWeaponId: 'bar_1918',
  rewardCash: 15000,
  rewardGold: 100,
  rewardRespect: 0, // Respeito só vem de duelos contra jogadores (R-RESPEITO-1)
  exclusiveItemDropId: 'acc_amuleto_corleone',
  timeRemainingHours: 48,
};

