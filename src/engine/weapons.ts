import type { Weapon, WeaponCategory } from './types.js';

export interface WeaponDef extends Weapon {
  id: string;
  name: string;
  category: WeaponCategory;
  categoryName: string;
  icon: string;
  min: number;
  max: number;
  description: string;
  shotEffect: {
    type: 'pistol' | 'shotgun' | 'smg' | 'rifle' | 'molotov' | 'slash' | 'dynamite';
    bulletCount: number;
    spreadRadius: number; // in pixels
    burstIntervalMs?: number; // for smg/rifle
    smokeIntensity: 'light' | 'medium' | 'heavy';
    sound: 'pistol' | 'shotgun' | 'smg' | 'rifle' | 'molotov' | 'slash' | 'explosion';
    screenShake: 'light' | 'medium' | 'heavy';
  };
}

export const WEAPON_CATEGORIES: { id: WeaponCategory; name: string; icon: string }[] = [
  { id: 'pistol', name: 'Pistolas', icon: '🔫' },
  { id: 'shotgun', name: 'Espingardas (Shotguns)', icon: '💥' },
  { id: 'smg', name: 'Submetralhadoras (SMGs)', icon: '🌪️' },
  { id: 'rifle', name: 'Fuzis de Assalto', icon: '⚡' },
  { id: 'special', name: 'Armas Especiais / Diversas', icon: '🧨' },
];

export const WEAPONS_CATALOG: WeaponDef[] = [
  // ==========================================
  // 1. PISTOLAS (3 TIPOS)
  // ==========================================
  {
    id: 'revolver_38',
    name: 'Revólver .38 Especial',
    category: 'pistol',
    categoryName: 'Pistola',
    icon: '🔫',
    min: 8,
    max: 16,
    description: 'Arma clássica de detetive e gângster de esquina. Disparo único preciso que deixa um furo limpo de entrada.',
    shotEffect: {
      type: 'pistol',
      bulletCount: 1,
      spreadRadius: 8,
      smokeIntensity: 'light',
      sound: 'pistol',
      screenShake: 'light',
    },
  },
  {
    id: 'colt_1911',
    name: 'Colt M1911 Calibre .45',
    category: 'pistol',
    categoryName: 'Pistola',
    icon: '🔫',
    min: 12,
    max: 22,
    description: 'Pistola pesada do exército adotada pelos capôs da máfia. Um furo de grosso calibre com estilhaços radiais.',
    shotEffect: {
      type: 'pistol',
      bulletCount: 1,
      spreadRadius: 10,
      smokeIntensity: 'medium',
      sound: 'pistol',
      screenShake: 'medium',
    },
  },
  {
    id: 'mauser_c96',
    name: 'Mauser C96 "Cabo de Vassoura"',
    category: 'pistol',
    categoryName: 'Pistola',
    icon: '🔫',
    min: 10,
    max: 19,
    description: 'Pistola alemã contrabandada com projétil de altíssima velocidade. Perfuração nítida com rastro de choque incandescente.',
    shotEffect: {
      type: 'pistol',
      bulletCount: 1,
      spreadRadius: 6,
      smokeIntensity: 'light',
      sound: 'pistol',
      screenShake: 'light',
    },
  },

  // ==========================================
  // 2. SHOTGUNS / ESPINGARDAS (3 TIPOS)
  // ==========================================
  {
    id: 'double_barrel',
    name: 'Escopeta Cano Duplo Calibre 12',
    category: 'shotgun',
    categoryName: 'Espingarda',
    icon: '💥',
    min: 22,
    max: 42,
    description: 'Dois canos paralelos disparados quase juntos. Espalha de 14 a 18 furos de chumbo em um leque devastador.',
    shotEffect: {
      type: 'shotgun',
      bulletCount: 16,
      spreadRadius: 110,
      smokeIntensity: 'heavy',
      sound: 'shotgun',
      screenShake: 'heavy',
    },
  },
  {
    id: 'pump_trench',
    name: 'Winchester 1897 "Trench Gun"',
    category: 'shotgun',
    categoryName: 'Espingarda',
    icon: '💥',
    min: 20,
    max: 38,
    description: 'A famosa espingarda militar de trincheira. Concentra 10 balins de chumbo grosso no peito com faíscas metálicas.',
    shotEffect: {
      type: 'shotgun',
      bulletCount: 10,
      spreadRadius: 75,
      smokeIntensity: 'heavy',
      sound: 'shotgun',
      screenShake: 'heavy',
    },
  },
  {
    id: 'sawed_off',
    name: 'Lupara Siciliana (Cano Serrado)',
    category: 'shotgun',
    categoryName: 'Espingarda',
    icon: '💥',
    min: 25,
    max: 45,
    description: 'Arma de emboscada à queima-roupa. Dispersão violenta e caótica de marcas de pólvora negra e chumbo grosso.',
    shotEffect: {
      type: 'shotgun',
      bulletCount: 14,
      spreadRadius: 130,
      smokeIntensity: 'heavy',
      sound: 'shotgun',
      screenShake: 'heavy',
    },
  },

  // ==========================================
  // 3. SUBMACHINE GUNS / SMGs (3 TIPOS)
  // ==========================================
  {
    id: 'tommy_gun',
    name: 'Thompson 1928 "Tommy Gun"',
    category: 'smg',
    categoryName: 'Submetralhadora',
    icon: '🌪️',
    min: 18,
    max: 32,
    description: 'A lendária "Chicago Typewriter" com tambor de 50 cartuchos. Dispara uma rajada rápida com múltiplos furos em sequência.',
    shotEffect: {
      type: 'smg',
      bulletCount: 8,
      spreadRadius: 35,
      burstIntervalMs: 50,
      smokeIntensity: 'medium',
      sound: 'smg',
      screenShake: 'medium',
    },
  },
  {
    id: 'mp40',
    name: 'Submetralhadora MP40 Mafiosa',
    category: 'smg',
    categoryName: 'Submetralhadora',
    icon: '🌪️',
    min: 16,
    max: 29,
    description: 'Firme, precisa e elegante. Cadência controlada que coloca 5 a 6 furos de bala em um agrupamento vertical fechado.',
    shotEffect: {
      type: 'smg',
      bulletCount: 6,
      spreadRadius: 28,
      burstIntervalMs: 65,
      smokeIntensity: 'medium',
      sound: 'smg',
      screenShake: 'medium',
    },
  },
  {
    id: 'grease_gun',
    name: 'M3 "Grease Gun" .45 Auto',
    category: 'smg',
    categoryName: 'Submetralhadora',
    icon: '🌪️',
    min: 17,
    max: 30,
    description: 'Construção rústica em aço estampado disparando projéteis pesados .45. Rajada ritmada com marcas profundas bem próximas.',
    shotEffect: {
      type: 'smg',
      bulletCount: 5,
      spreadRadius: 32,
      burstIntervalMs: 80,
      smokeIntensity: 'medium',
      sound: 'smg',
      screenShake: 'medium',
    },
  },

  // ==========================================
  // 4. FUZIS DE ASSALTO / RIFLES (3 TIPOS)
  // ==========================================
  {
    id: 'bar_1918',
    name: 'Fuzil Automático BAR M1918',
    category: 'rifle',
    categoryName: 'Fuzil de Assalto',
    icon: '⚡',
    min: 26,
    max: 46,
    description: 'Monstro calibre .30-06. Rajada militar de 4 tiros pesados que rasgam a blindagem deixando furos incandescentes profundos.',
    shotEffect: {
      type: 'rifle',
      bulletCount: 4,
      spreadRadius: 40,
      burstIntervalMs: 90,
      smokeIntensity: 'heavy',
      sound: 'rifle',
      screenShake: 'heavy',
    },
  },
  {
    id: 'm1_garand',
    name: 'Fuzil de Batalha M1 Garand',
    category: 'rifle',
    categoryName: 'Fuzil de Assalto',
    icon: '⚡',
    min: 24,
    max: 42,
    description: 'Rifle semiautomático lendário. 2 disparos contundentes de altíssima penetração com estilhaços e o clássico tilintar de clipe.',
    shotEffect: {
      type: 'rifle',
      bulletCount: 2,
      spreadRadius: 20,
      burstIntervalMs: 120,
      smokeIntensity: 'heavy',
      sound: 'rifle',
      screenShake: 'heavy',
    },
  },
  {
    id: 'stg_44',
    name: 'Fuzil de Assalto StG 44',
    category: 'rifle',
    categoryName: 'Fuzil de Assalto',
    icon: '⚡',
    min: 25,
    max: 44,
    description: 'O pioneiro fuzil de assalto de tiro rápido. Rajada tática de 4 tiros de grosso calibre em linha reta com clarão alongado.',
    shotEffect: {
      type: 'rifle',
      bulletCount: 4,
      spreadRadius: 30,
      burstIntervalMs: 70,
      smokeIntensity: 'heavy',
      sound: 'rifle',
      screenShake: 'heavy',
    },
  },

  // ==========================================
  // 5. ARMAS ESPECIAIS / DIVERSAS (3 TIPOS)
  // ==========================================
  {
    id: 'molotov',
    name: 'Coquetel Molotov Incendiário',
    category: 'special',
    categoryName: 'Especial / Incendiária',
    icon: '🍾',
    min: 22,
    max: 40,
    description: 'Garrafa de vidro com combustível e pavio. Estilhaça em chamas cobrindo o card com labaredas vivas e fuligem negra ardente.',
    shotEffect: {
      type: 'molotov',
      bulletCount: 0,
      spreadRadius: 100,
      smokeIntensity: 'heavy',
      sound: 'molotov',
      screenShake: 'medium',
    },
  },
  {
    id: 'navalha_taco',
    name: 'Taco com Pregos & Navalha',
    category: 'special',
    categoryName: 'Especial / Corpo a Corpo',
    icon: '🪓',
    min: 19,
    max: 36,
    description: 'Golpe brutal e impiedoso dos becos. Rasga a tela com uma fenda profunda de corte/lâmina e respingos de sangue estilizados.',
    shotEffect: {
      type: 'slash',
      bulletCount: 0,
      spreadRadius: 60,
      smokeIntensity: 'light',
      sound: 'slash',
      screenShake: 'heavy',
    },
  },
  {
    id: 'dinamite',
    name: 'Banana de Dinamite Mafiosa',
    category: 'special',
    categoryName: 'Especial / Explosiva',
    icon: '🧨',
    min: 28,
    max: 52,
    description: 'Carga explosiva industrial para roubo de cofres. Clarão ofuscante de explosão e estilhaços que sacodem todo o cenário.',
    shotEffect: {
      type: 'dynamite',
      bulletCount: 0,
      spreadRadius: 140,
      smokeIntensity: 'heavy',
      sound: 'explosion',
      screenShake: 'heavy',
    },
  },
];

/**
 * Desarmado (R-ARMA-4): quando o jogador guarda a arma na mochila, luta com os punhos.
 * Dano 0 a 0, igual a não ter arma (só o Ataque base causa dano). Fica FORA do catálogo
 * (não é vendida na loja nem é item).
 */
export const FISTS: WeaponDef = {
  id: 'fists',
  name: 'Punhos',
  category: 'special',
  categoryName: 'Desarmado',
  icon: '👊',
  min: 0,
  max: 0,
  description: 'Sem arma equipada: só o seu Ataque base causa dano.',
  shotEffect: {
    type: 'slash',
    bulletCount: 1,
    spreadRadius: 6,
    smokeIntensity: 'light',
    sound: 'slash',
    screenShake: 'light',
  },
};

export function getWeaponById(id: string): WeaponDef {
  if (id === FISTS.id) return FISTS;
  const found = WEAPONS_CATALOG.find(w => w.id === id);
  if (found) return found;
  return WEAPONS_CATALOG[0]; // fallback to Revolver .38
}

