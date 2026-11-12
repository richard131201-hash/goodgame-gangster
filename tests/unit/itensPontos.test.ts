import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SHOP_ITEMS } from '../../src/web/gameData.js';
import { combatPointsOf } from '../../src/shared/player.js';
import { derivedStats } from '../../src/engine/stats.js';
import { validateConfig } from '../../src/engine/schema.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };

describe('itens dão pontos de atributo pequenos (R-ITEM-1)', () => {
  it('nenhum item de armadura ou acessório dá mais de 15 pontos de um atributo', () => {
    for (const i of SHOP_ITEMS.filter(x => x.type === 'armor' || x.type === 'accessory')) {
      for (const k of ['attack', 'life', 'astucia', 'tenacidade'] as const) {
        expect(i.statsBonus?.[k] ?? 0, `${i.id} ${k}`).toBeLessThanOrEqual(15);
      }
    }
  });

  it('o Sobretudo Noir Forrado não infla o HP (antes: 27 pontos viravam 377 e o HP ia a 57 mil)', () => {
    const cfg = validateConfig(balanceJson);
    const base = { attack: 35, life: 27, astucia: 37, tenacidade: 12 };
    const vestido = combatPointsOf({ points: base, equipped: { weaponId: null, armorId: 'armor_sobretudo_blindado', accessoryId: null, consumables: [] } });
    expect(vestido.life).toBe(27 + 6);
    const input = (points: typeof base) => ({ style: 'malandro' as const, level: 9, points, weapon: undefined as never });
    const hpBase = derivedStats(input(base), cfg).maxHp;
    const hpVestido = derivedStats(input(vestido), cfg).maxHp;
    expect(hpVestido / hpBase).toBeLessThan(1.3);
  });
});

describe('drop de missão ignora o nível do item (R-DROP-1)', () => {
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
    gm.getPlayer().level = 9;
    gm.getPlayer().inventory = gm.getPlayer().inventory.filter(i => i.weaponRefId);
    return gm;
  }

  it('nível 9 recebe a BAR (nível mínimo 32) e a Tommy Gun (22) de drop, sem pagar nada', async () => {
    const gm = await jogador();
    const bar = SHOP_ITEMS.find(i => i.id === 'item_bar_1918')!;
    expect(bar.levelReq).toBeGreaterThan(9);
    const cash = gm.getPlayer().cash;
    expect(gm.grantItem(bar)).toBe(true);
    expect(gm.grantItem(SHOP_ITEMS.find(i => i.id === 'item_tommy_gun')!)).toBe(true);
    expect(gm.getPlayer().cash).toBe(cash);
    expect(gm.getBagCount()).toBe(2);
  });

  it('a compra na loja continua exigindo o nível', async () => {
    const gm = await jogador();
    expect(gm.buyBlockReason(SHOP_ITEMS.find(i => i.id === 'item_bar_1918')!)).toBe('nivel');
  });

  it('só recusa o drop quando a Mala está cheia de verdade', async () => {
    const gm = await jogador();
    const whisky = SHOP_ITEMS.find(i => i.id === 'cons_whisky')!;
    for (let n = 0; n < gm.getBagCapacity(); n++) expect(gm.grantItem(whisky)).toBe(true);
    expect(gm.grantItem(SHOP_ITEMS.find(i => i.id === 'item_bar_1918')!)).toBe(false);
  });
});
