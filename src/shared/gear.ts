import { hashSeed, createPRNG } from '../engine/prng.js';
import { LEGACY_GEAR_ITEMS, type GameItem, type GearInfo } from '../web/gameData.js';
import { ITEM_ATTRS, ITEM_SLOTS, itemPoints, rollItem, type ItemAttr, type ItemSlot } from './itemRoll.js';

/**
 * Itens dos 8 slots do perfil (R-ITEM-2): montagem do item, preço, loja e conversão de saves antigos.
 * Regra pura: roda igual no navegador e no servidor.
 */

/** Ícone provisório de cada slot (a arte de verdade virá do fundador). */
export const GEAR_ICONS: Record<ItemSlot, string> = {
  chapeu: '🎩',
  peitoral: '🧥',
  calca: '👖',
  calcado: '👞',
  amuleto: '🍀',
  pet: '🐕',
  relicia: '💍',
  veiculo: '🚗',
};

/** Nomes provisórios, só aparência: o sorteio escolhe um deles. */
export const GEAR_NAMES: Record<ItemSlot, string[]> = {
  chapeu: ['Fedora de Feltro', 'Chapéu Panamá', 'Boina do Porto', 'Cartola Velha'],
  peitoral: ['Sobretudo Noir', 'Colete de Couro', 'Paletó Risca de Giz', 'Casaco do Cais'],
  calca: ['Calça de Lã', 'Calça Social Risca', 'Calça de Couro', 'Calça de Linho'],
  calcado: ['Sapato Bicolor', 'Botina de Couro', 'Oxford Lustrado', 'Bota do Porto'],
  amuleto: ['Terço de Prata', 'Trevo de Ouro', 'Moeda da Sorte', 'Dente de Lobo'],
  pet: ['Cão de Guarda', 'Gato de Rua', 'Corvo Negro', 'Dobermann'],
  relicia: ['Anel da Família', 'Relógio do Don', 'Corrente de Ouro', 'Broche Antigo'],
  veiculo: ['Ford Modelo T', 'Cadillac Preto', 'Moto com Sidecar', 'Packard Blindado'],
};

/** Preço provisório: cash por ponto do item (o fundador ajusta com o simulador, C6). */
export const GEAR_PRICE_PER_POINT = 300;
/** Item de chefão ou wanted pode ter até este tanto de vezes os pontos normais do nível. */
export const GEAR_MAX_MULTIPLIER = 2;

export const gearTotal = (points: Record<ItemAttr, number>) => ITEM_ATTRS.reduce((a, k) => a + points[k], 0);

export function isGearItem(item: GameItem | undefined | null): item is GameItem & { gear: GearInfo } {
  return !!item && item.type === 'gear' && !!item.gear;
}

const LABEL: Record<ItemAttr, string> = { attack: 'Ataque', life: 'Vida', astucia: 'Astúcia', tenacidade: 'Tenacidade' };

/** Monta o item do jogo a partir dos dados do sorteio (o servidor refaz o mesmo item a partir dos mesmos dados). */
export function buildGearItem(id: string, g: GearInfo): GameItem {
  const names = GEAR_NAMES[g.slot];
  const total = gearTotal(g.points);
  const statsBonus: NonNullable<GameItem['statsBonus']> = {};
  for (const k of ITEM_ATTRS) if (g.points[k] > 0) statsBonus[k] = g.points[k];
  const parts = ITEM_ATTRS.filter(k => g.points[k] > 0).map(k => `+${g.points[k]} ${LABEL[k]}`);
  return {
    id,
    name: names[((g.variant % names.length) + names.length) % names.length],
    type: 'gear',
    icon: GEAR_ICONS[g.slot],
    priceCash: total * GEAR_PRICE_PER_POINT,
    priceGold: 0,
    levelReq: 0,
    description: `Nível ${g.level}: ${parts.join(', ')}.`,
    statsBonus,
    gear: { slot: g.slot, level: g.level, points: { ...g.points }, variant: g.variant },
  };
}

/** Sorteia um item pronto. `rand` = Math.random no jogo. */
export function rollGear(level: number, slot: ItemSlot, rand: () => number, multiplier = 1): GameItem {
  const r = rollItem(level, slot, rand, multiplier);
  const variant = Math.floor(rand() * GEAR_NAMES[slot].length);
  const id = `g_${slot}_${Math.floor(rand() * 0xffffffff).toString(36)}${Math.floor(rand() * 0xffffffff).toString(36)}`;
  return buildGearItem(id, { slot: r.slot, level: r.level, points: r.points, variant });
}

/** Drop de missão: o slot também é sorteado. */
export function rollRandomGear(level: number, rand: () => number, multiplier = 1): GameItem {
  const slot = ITEM_SLOTS[Math.min(ITEM_SLOTS.length - 1, Math.floor(rand() * ITEM_SLOTS.length))];
  return rollGear(level, slot, rand, multiplier);
}

/**
 * Estoque da loja (R-ITEM-2): 1 item de cada slot, já sorteado, com os atributos à vista antes de comprar.
 * Fixo para o mesmo jogador, nível e `serial` (o serial sobe a cada compra e o estoque muda).
 * Nunca é caixa-surpresa: o que aparece é o que se compra.
 */
export function shopStock(playerKey: string, level: number, serial: number): GameItem[] {
  return ITEM_SLOTS.map(slot => {
    const seed = `shop:${playerKey}:${level}:${serial}:${slot}`;
    const prng = createPRNG(seed);
    const item = rollGear(level, slot, () => prng.next());
    return { ...item, id: `g_${slot}_${hashSeed(seed).toString(36)}` };
  });
}

/** Regras que o servidor confere em cada item dos 8 slots que o navegador diz ter. Devolve o motivo do erro, ou null. */
export function gearProblem(g: GearInfo, playerLevel: number): string | null {
  if (!(ITEM_SLOTS as readonly string[]).includes(g.slot)) return 'slot de item desconhecido';
  if (!Number.isInteger(g.level) || g.level < 1 || g.level > playerLevel) return 'item de nível acima do jogador';
  for (const k of ITEM_ATTRS) {
    if (!Number.isInteger(g.points[k]) || g.points[k] < 0) return 'pontos de item inválidos';
  }
  const base = itemPoints(g.level);
  const total = gearTotal(g.points);
  if (total < base || total > base * GEAR_MAX_MULTIPLIER) return 'pontos do item incoerentes com o nível';
  if (!Number.isInteger(g.variant) || g.variant < 0 || g.variant > 99) return 'aparência de item inválida';
  return null;
}

// ---------------------------------------------------------------------------------------------
// Conversão de saves antigos (Blindagem/Acessório de valor fixo → Peitoral/Amuleto sorteados)
// ---------------------------------------------------------------------------------------------
const LEGACY_SLOT: Record<string, ItemSlot> = { armor: 'peitoral', accessory: 'amuleto' };

interface Convertible {
  level: number;
  inventory: GameItem[];
  equipped: { armorId?: string | null; accessoryId?: string | null; gear?: Partial<Record<ItemSlot, string>> } & Record<string, unknown>;
}

/**
 * Troca cada armadura/acessório antigo da Mala por um item sorteado do slot equivalente, no nível do jogador
 * (mesma posição na Mala; o que estava equipado continua equipado). O sorteio vem de uma semente do próprio item,
 * então navegador e servidor chegam ao mesmo resultado. Devolve true se mudou algo.
 */
export function migrateLegacyGear(p: Convertible): boolean {
  let changed = false;
  if (!p.equipped.gear) {
    p.equipped.gear = {};
    changed = true;
  }
  const legacyIds = new Set(LEGACY_GEAR_ITEMS.map(i => i.id));
  p.inventory = p.inventory.map(item => {
    if (!legacyIds.has(item.id)) return item;
    const slot = LEGACY_SLOT[item.type];
    if (!slot) return item;
    const prng = createPRNG(`legacy:${item.id}:${p.level}`);
    const fresh = rollGear(p.level, slot, () => prng.next());
    const converted: GameItem = {
      ...fresh,
      id: `g_${slot}_${hashSeed('legacy', item.id, p.level).toString(36)}`,
      ...(item.slot === undefined ? {} : { slot: item.slot }),
    };
    if (item.id === p.equipped.armorId || item.id === p.equipped.accessoryId) p.equipped.gear![slot] = converted.id;
    changed = true;
    return converted;
  });
  if ('armorId' in p.equipped || 'accessoryId' in p.equipped) {
    delete p.equipped.armorId;
    delete p.equipped.accessoryId;
    changed = true;
  }
  return changed;
}
