import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BAG_CAPACITY_INITIAL, BAG_CAPACITY_MAX, BAG_UPGRADE_SLOTS, BIG_BAG_PRICE_GOLD, validBagCapacity } from '../../src/shared/bag.js';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

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

describe('mala maior: fileira bloqueada liberada com ouro (R-MALA-10)', () => {
  it('a Mala começa com 10 slots, o máximo é 15 e só 10 ou 15 são capacidades válidas', () => {
    expect(BAG_CAPACITY_INITIAL).toBe(10);
    expect(BAG_CAPACITY_MAX).toBe(15);
    expect(BAG_UPGRADE_SLOTS).toBe(5);
    expect([10, 15].every(validBagCapacity)).toBe(true);
    expect([5, 11, 14, 16, 20, 10.5].some(validBagCapacity)).toBe(false);
  });

  it('sem ouro suficiente não compra e não cobra nada', async () => {
    const gm = await novoJogo();
    gm.getPlayer().gold = BIG_BAG_PRICE_GOLD - 1;
    expect(gm.bagUpgradeBlockReason()).toBe('ouro');
    expect(gm.buyBiggerBag()).toBe(false);
    expect(gm.getPlayer().gold).toBe(BIG_BAG_PRICE_GOLD - 1);
    expect(gm.getBagCapacity()).toBe(10);
  });

  it('com ouro: cobra o preço, libera 5 slots e a Mala passa a ter 15', async () => {
    const gm = await novoJogo();
    gm.getPlayer().gold = BIG_BAG_PRICE_GOLD + 40;
    expect(gm.bagUpgradeBlockReason()).toBeNull();
    expect(gm.buyBiggerBag()).toBe(true);
    expect(gm.getPlayer().gold).toBe(40);
    expect(gm.getBagCapacity()).toBe(15);
    expect(gm.getBagLayout()).toHaveLength(15);
  });

  it('não dá para comprar de novo no máximo, e o ouro não é cobrado', async () => {
    const gm = await novoJogo();
    gm.getPlayer().gold = BIG_BAG_PRICE_GOLD * 3;
    expect(gm.buyBiggerBag()).toBe(true);
    expect(gm.bagUpgradeBlockReason()).toBe('maximo');
    expect(gm.buyBiggerBag()).toBe(false);
    expect(gm.getPlayer().gold).toBe(BIG_BAG_PRICE_GOLD * 2);
  });

  it('na tela: a fileira bloqueada tem cadeado e clicar oferece a compra, com aviso se faltar ouro', () => {
    const main = ler('src/web/main.ts');
    expect(main).toContain('class="inv-slot locked"');
    expect(main).toContain("slot.addEventListener('click', offerBiggerBag)");
    expect(main).toContain("gameState.bagUpgradeBlockReason()");
    expect(main).toContain("kind: 'ouro', title: 'Faltam ouros'");
    expect(ler('index.html')).toContain('id="i-lock"');
    const css = ler('src/web/style.css');
    expect(css).toContain('.inv-slot.locked {');
    expect(css).not.toMatch(/\.inv-slot\.locked[^{]*\{[^}]*\dpx/);
  });
});
