import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BAG_CAPACITY_INITIAL,
  BAG_CAPACITY_MAX,
  bagBuyableRow,
  bagCanBuySlot,
  bagOpenCost,
  bagOpenOf,
  bagSlotPrice,
  validBagOpen,
} from '../../src/shared/bag.js';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const faixa = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i);

async function novoJogo() {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  const { GameStateManager, createNewPlayer } = await import('../../src/web/state.js');
  const { defaultAppearance } = await import('../../src/web/characterOptions.js');
  const gm = new GameStateManager();
  Object.assign(gm.getPlayer(), createNewPlayer('Teste', 'malandro', defaultAppearance(), 'colt_1911'));
  return gm;
}

describe('compra de slots da Mala, um por vez (R-MALA-12)', () => {
  it('começa com 10 slots; o máximo hoje é 20; preços: 3ª fileira 60 (300 por 5), 4ª 500, 5ª 750, 6ª em diante 1000', () => {
    expect(BAG_CAPACITY_INITIAL).toBe(10);
    expect(BAG_CAPACITY_MAX).toBe(20);
    expect(bagSlotPrice(3)).toBe(0);
    expect(faixa(10, 15).every(s => bagSlotPrice(s) === 60)).toBe(true);
    expect(faixa(15, 20).every(s => bagSlotPrice(s) === 500)).toBe(true);
    expect(faixa(20, 25).every(s => bagSlotPrice(s) === 750)).toBe(true);
    expect([25, 30, 49].every(s => bagSlotPrice(s) === 1000)).toBe(true);
  });

  it('a 3ª fileira pode ser comprada em qualquer ordem; a 4ª só depois dos 5 da 3ª', () => {
    expect(bagBuyableRow([])).toBe(2);
    expect(bagCanBuySlot([], 12)).toBe(true);
    expect(bagCanBuySlot([12], 10)).toBe(true);
    expect(bagCanBuySlot([12], 12)).toBe(false); // já é seu
    expect(bagCanBuySlot([], 15)).toBe(false); // 4ª fileira ainda trancada
    expect(bagCanBuySlot([10, 11, 12, 13], 15)).toBe(false); // falta 1 da 3ª
    expect(bagBuyableRow(faixa(10, 15))).toBe(3);
    expect(bagCanBuySlot(faixa(10, 15), 17)).toBe(true);
    expect(bagBuyableRow(faixa(10, 20))).toBeNull(); // Mala no máximo hoje
    expect(bagCanBuySlot(faixa(10, 20), 19)).toBe(false);
  });

  it('lista de slots comprados: valida a regra da fileira, sem repetir e sem sair de 10 a 19', () => {
    expect(validBagOpen([])).toBe(true);
    expect(validBagOpen([14, 10])).toBe(true);
    expect(validBagOpen([...faixa(10, 15), 17])).toBe(true);
    expect(validBagOpen([15])).toBe(false);
    expect(validBagOpen([10, 11, 12, 13, 15])).toBe(false);
    expect(validBagOpen([10, 10])).toBe(false);
    expect(validBagOpen([9])).toBe(false);
    expect(validBagOpen([20])).toBe(false);
    expect(validBagOpen([10.5])).toBe(false);
  });

  it('save antigo (só a capacidade) vira a lista de slots; o custo conta só os novos', () => {
    expect(bagOpenOf({})).toEqual([]);
    expect(bagOpenOf({ bagCapacity: 15 })).toEqual(faixa(10, 15));
    expect(bagOpenOf({ bagCapacity: 15, bagOpen: [10] })).toEqual([10]);
    expect(bagOpenCost([10], [10, 11])).toBe(60);
    expect(bagOpenCost(faixa(10, 15), [...faixa(10, 15), 15, 16])).toBe(1000);
  });

  it('sem ouro não compra e não cobra; com ouro libera SÓ o slot escolhido', async () => {
    const gm = await novoJogo();
    gm.getPlayer().gold = 59;
    expect(gm.bagSlotBlockReason(12)).toBe('ouro');
    expect(gm.buyBagSlot(12)).toBe(false);
    expect(gm.getPlayer().gold).toBe(59);
    gm.getPlayer().gold = 100;
    expect(gm.buyBagSlot(12)).toBe(true);
    expect(gm.getPlayer().gold).toBe(40);
    expect(gm.getBagOpen()).toEqual([12]);
    expect(gm.getBagCapacity()).toBe(11);
    expect(gm.getBagLayout()[12]).toBeNull();
  });

  it('a 4ª fileira só abre depois de comprar os 5 da 3ª, e cada slot dela custa 500', async () => {
    const gm = await novoJogo();
    gm.getPlayer().gold = 60 * 5 + 500 * 2;
    expect(gm.buyBagSlot(15)).toBe(false); // fileira de baixo ainda trancada
    for (const s of [14, 10, 12, 11]) expect(gm.buyBagSlot(s)).toBe(true);
    expect(gm.buyBagSlot(15)).toBe(false); // falta o 13
    expect(gm.buyBagSlot(13)).toBe(true);
    expect(gm.getBagCapacity()).toBe(15);
    expect(gm.getPlayer().gold).toBe(1000);
    expect(gm.buyBagSlot(18)).toBe(true);
    expect(gm.getPlayer().gold).toBe(500);
    expect(gm.buyBagSlot(18)).toBe(false); // já é seu: não cobra de novo
    expect(gm.getPlayer().gold).toBe(500);
    expect(gm.getBagCapacity()).toBe(16);
  });

  it('item só vai para slot liberado: mover para slot bloqueado é recusado', async () => {
    const gm = await novoJogo();
    const i = gm.getPlayer().inventory.findIndex(x => x.type === 'weapon');
    if (i !== -1) expect(gm.moveBagItem(i, 12)).toBe(false);
    expect(gm.getBagLayout()).toHaveLength(20);
  });

  it('na tela: o slot bloqueado da fileira atual tem cadeado e preço; clicar oferece a compra daquele slot; fileira de baixo é "em breve"', () => {
    const main = ler('src/web/main.ts');
    expect(main).toContain('data-lock-slot="${i}"');
    expect(main).toContain('offerBagSlot(slotIdx)');
    expect(main).toContain('gameState.bagSlotBlockReason(slot)');
    expect(main).toContain('gameState.buyBagSlot(slot)');
    expect(main).toContain('inv-slot locked locked-soon');
    expect(main).toContain("kind: 'ouro', title: 'Faltam ouros'");
    expect(ler('index.html')).toContain('id="i-lock"');
    const css = ler('src/web/style.css');
    expect(css).toContain('.inv-slot.locked {');
    expect(css).not.toMatch(/\.inv-slot\.locked[^{]*\{[^}]*\dpx/);
  });
});
