import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPRNG } from '../../src/engine/prng.js';
import { ITEM_SLOTS, itemPoints } from '../../src/shared/itemRoll.js';
import {
  GEAR_PRICE_PER_POINT,
  buildGearItem,
  gearProblem,
  gearTotal,
  migrateLegacyGear,
  rollGear,
  rollRandomGear,
  shopStock,
} from '../../src/shared/gear.js';
import { LEGACY_GEAR_ITEMS, SHOP_ITEMS } from '../../src/web/gameData.js';
import { combatPointsOf } from '../../src/shared/player.js';

describe('item dos 8 slots pronto para o jogo (R-ITEM-2)', () => {
  it('é do nível do jogador, custa 300 de cash por ponto e mostra os pontos', () => {
    const prng = createPRNG('g1');
    const it = rollGear(10, 'chapeu', () => prng.next());
    expect(it.type).toBe('gear');
    expect(it.gear!.level).toBe(10);
    expect(gearTotal(it.gear!.points)).toBe(itemPoints(10));
    expect(it.priceCash).toBe(itemPoints(10) * GEAR_PRICE_PER_POINT);
    expect(it.description).toContain('Nível 10');
  });

  it('nível 1: 1 ponto e $300 (o jogador começa com $500)', () => {
    const it = rollGear(1, 'pet', () => 0.1);
    expect(gearTotal(it.gear!.points)).toBe(1);
    expect(it.priceCash).toBe(300);
  });

  it('item de chefão tem mais pontos, mas nunca mais que o dobro', () => {
    const prng = createPRNG('boss');
    const it = rollRandomGear(20, () => prng.next(), 2);
    expect(gearTotal(it.gear!.points)).toBe(itemPoints(20) * 2);
    expect(gearProblem(it.gear!, 20)).toBeNull();
  });

  it('o drop sorteia slots diferentes (os 8 aparecem)', () => {
    const prng = createPRNG('slots');
    const vistos = new Set<string>();
    for (let n = 0; n < 400; n++) vistos.add(rollRandomGear(5, () => prng.next()).gear!.slot);
    expect(vistos.size).toBe(ITEM_SLOTS.length);
  });
});

describe('loja de itens: estoque à vista (R-ITEM-2, sem lootbox)', () => {
  it('1 item de cada slot, todos do nível do jogador, com ids diferentes', () => {
    const s = shopStock('Chacal', 9, 0);
    expect(s.map(i => i.gear!.slot)).toEqual([...ITEM_SLOTS]);
    expect(new Set(s.map(i => i.id)).size).toBe(8);
    for (const i of s) expect(i.gear!.level).toBe(9);
  });

  it('o mesmo jogador, nível e contador veem sempre o mesmo estoque; depois de uma compra, outro', () => {
    expect(shopStock('Chacal', 9, 0)).toEqual(shopStock('Chacal', 9, 0));
    expect(shopStock('Chacal', 9, 1)).not.toEqual(shopStock('Chacal', 9, 0));
    expect(shopStock('Outro', 9, 0)).not.toEqual(shopStock('Chacal', 9, 0));
  });
});

describe('o servidor confere cada item dos 8 slots (R-ITEM-2)', () => {
  const ok = () => rollGear(5, 'calca', () => 0.3).gear!;
  it('aceita um item honesto', () => {
    expect(gearProblem(ok(), 5)).toBeNull();
    expect(gearProblem(ok(), 50)).toBeNull();
  });
  it('recusa item de nível acima do jogador', () => {
    expect(gearProblem(ok(), 4)).not.toBeNull();
  });
  it('recusa pontos a mais ou a menos do que o nível permite', () => {
    const g = ok();
    expect(gearProblem({ ...g, points: { ...g.points, attack: g.points.attack + 50 } }, 5)).not.toBeNull();
    expect(gearProblem({ ...g, points: { attack: 0, life: 0, astucia: 0, tenacidade: 0 } }, 5)).not.toBeNull();
  });
  it('recusa pontos negativos ou quebrados e slot inventado', () => {
    const g = ok();
    expect(gearProblem({ ...g, points: { ...g.points, life: -1 } }, 5)).not.toBeNull();
    expect(gearProblem({ ...g, points: { ...g.points, life: 0.5 } }, 5)).not.toBeNull();
    expect(gearProblem({ ...g, slot: 'arma' as never }, 5)).not.toBeNull();
  });
});

describe('conversão de saves antigos (R-ITEM-2)', () => {
  const antigo = () => {
    const armor = { ...LEGACY_GEAR_ITEMS.find(i => i.id === 'armor_sobretudo_blindado')!, slot: 3 };
    const acc = LEGACY_GEAR_ITEMS.find(i => i.id === 'acc_anel_ouro')!;
    return {
      level: 9,
      inventory: [armor, acc],
      equipped: { weaponId: null, armorId: armor.id, accessoryId: null, consumables: [] } as never,
    };
  };

  it('armadura vira Peitoral e acessório vira Amuleto, no nível do jogador, na mesma posição da Mala', () => {
    const p = antigo();
    expect(migrateLegacyGear(p)).toBe(true);
    const [a, b] = p.inventory;
    expect(a.gear!.slot).toBe('peitoral');
    expect(b.gear!.slot).toBe('amuleto');
    expect(a.gear!.level).toBe(9);
    expect(a.slot).toBe(3);
    expect(gearProblem(a.gear!, 9)).toBeNull();
  });

  it('o que estava equipado continua equipado, e os campos antigos somem', () => {
    const p = antigo();
    migrateLegacyGear(p);
    const eq = p.equipped as unknown as { gear: Record<string, string>; armorId?: string };
    expect(eq.gear.peitoral).toBe(p.inventory[0].id);
    expect(eq.armorId).toBeUndefined();
    const pts = combatPointsOf({
      points: { attack: 0, life: 0, astucia: 0, tenacidade: 0 },
      inventory: p.inventory,
      equipped: p.equipped as never,
    });
    expect(pts.attack + pts.life + pts.astucia + pts.tenacidade).toBe(itemPoints(9));
  });

  it('é repetível (navegador e servidor chegam ao mesmo item) e não converte duas vezes', () => {
    const a = antigo();
    const b = antigo();
    migrateLegacyGear(a);
    migrateLegacyGear(b);
    expect(a.inventory).toEqual(b.inventory);
    expect(migrateLegacyGear(a)).toBe(false);
  });
});

describe('comprar e equipar no jogo (R-ITEM-2)', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  async function jogador() {
    const { GameStateManager, createNewPlayer } = await import('../../src/web/state.js');
    const { defaultAppearance } = await import('../../src/web/characterOptions.js');
    const gm = new GameStateManager();
    Object.assign(gm.getPlayer(), createNewPlayer('Teste', 'malandro', defaultAppearance(), 'colt_1911'));
    gm.getPlayer().cash = 100_000;
    return gm;
  }

  it('compra cobra o preço, põe na Mala (NÃO equipa sozinho) e muda o estoque', async () => {
    const gm = await jogador();
    const antes = gm.getShopStock();
    const alvo = antes.find(i => i.gear!.slot === 'chapeu')!;
    const cash = gm.getPlayer().cash;
    expect(gm.buyGearFromStock(alvo.id)).toBeNull();
    expect(gm.getPlayer().cash).toBe(cash - alvo.priceCash);
    expect(gm.getPlayer().inventory.some(i => i.id === alvo.id)).toBe(true);
    expect(gm.getPlayer().equipped.gear.chapeu).toBeUndefined(); // vai primeiro para a Mala (R-MALA-7)
    expect(gm.getBagCount()).toBe(2); // uísque + o item novo (o Colt equipado não conta)
    expect(gm.getShopStock()).not.toEqual(antes);
    expect(gm.buyGearFromStock(alvo.id)).toBe('sem_item'); // não dá para comprar o mesmo de novo
  });

  it('sem cash ou sem espaço na Mala: recusa e não cobra nada', async () => {
    const gm = await jogador();
    gm.getPlayer().cash = 10;
    const item = gm.getShopStock()[0];
    expect(gm.buyGearFromStock(item.id)).toBe('cash');
    expect(gm.getPlayer().cash).toBe(10);
    gm.getPlayer().cash = 1_000_000;
    const whisky = SHOP_ITEMS.find(i => i.id === 'cons_whisky')!;
    while (gm.bagHasRoom()) gm.grantItem(whisky);
    expect(gm.buyGearFromStock(item.id)).toBe('mochila');
    expect(gm.getPlayer().cash).toBe(1_000_000);
  });

  it('equipar troca o item do slot; os pontos entram no combate só enquanto equipado; vender desequipa', async () => {
    const gm = await jogador();
    const a = buildGearItem('g_chapeu_a', { slot: 'chapeu', level: 1, points: { attack: 1, life: 0, astucia: 0, tenacidade: 0 }, variant: 0 });
    const b = buildGearItem('g_chapeu_b', { slot: 'chapeu', level: 1, points: { attack: 0, life: 1, astucia: 0, tenacidade: 0 }, variant: 1 });
    gm.getPlayer().inventory.push(a, b);
    const base = gm.getCombatPoints();
    expect(gm.equipGear('g_chapeu_a')).toBe(true);
    expect(gm.getCombatPoints().attack).toBe(base.attack + 1);
    expect(gm.equipGear('g_chapeu_b')).toBe(true);
    expect(gm.getCombatPoints().attack).toBe(base.attack);
    expect(gm.getCombatPoints().life).toBe(base.life + 1);
    expect(gm.equipGear('cons_whisky')).toBe(false);
    const idx = gm.getPlayer().inventory.findIndex(i => i.id === 'g_chapeu_b');
    gm.sellItem(idx);
    expect(gm.getPlayer().equipped.gear.chapeu).toBeUndefined();
    expect(gm.getCombatPoints().life).toBe(base.life);
  });
});
