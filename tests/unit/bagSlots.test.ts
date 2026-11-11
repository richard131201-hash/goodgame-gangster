import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SHOP_ITEMS, type GameItem } from '../../src/web/gameData.js';
import { bagLayout, firstEmptyBagSlot } from '../../src/web/weaponSlot.js';

const item = (id: string, slot?: number): GameItem => {
  const base = SHOP_ITEMS.find(i => i.weaponRefId === id)!;
  return slot === undefined ? { ...base } : { ...base, slot };
};
const ids = (cells: ReturnType<typeof bagLayout>) => cells.map(c => c?.item.weaponRefId ?? null);

describe('Mala: cada item no seu slot (R-MALA-4)', () => {
  it('sem posição, os itens ocupam os primeiros slots em ordem (saves antigos)', () => {
    const inv = [item('tommy_gun'), item('double_barrel')];
    expect(ids(bagLayout(inv, null, 10)).slice(0, 4)).toEqual([inv[0].weaponRefId, inv[1].weaponRefId, null, null]);
  });

  it('um item no slot 0 e outro no slot 7 ficam exatamente ali, com vazios no meio', () => {
    const inv = [item('tommy_gun', 0), item('double_barrel', 7)];
    const cells = ids(bagLayout(inv, null, 10));
    expect(cells[0]).toBe(inv[0].weaponRefId);
    expect(cells[7]).toBe(inv[1].weaponRefId);
    expect(cells.filter(c => c === null)).toHaveLength(8);
  });

  it('posição ocupada ou fora da Mala: o item vai para o primeiro slot vazio', () => {
    const inv = [item('tommy_gun', 3), item('double_barrel', 3), item('colt_1911', 99)];
    const cells = ids(bagLayout(inv, null, 10));
    expect(cells[3]).toBe(inv[0].weaponRefId);
    expect(cells[0]).toBe(inv[1].weaponRefId);
    expect(cells[1]).toBe(inv[2].weaponRefId);
  });

  it('a arma equipada não aparece na Mala, e seu slot fica livre', () => {
    const inv = [item('colt_1911', 0), item('tommy_gun', 1)];
    const cells = ids(bagLayout(inv, 'colt_1911', 10));
    expect(cells[0]).toBe(null);
    expect(cells[1]).toBe(inv[1].weaponRefId);
  });

  it('firstEmptyBagSlot acha o primeiro buraco, e -1 com a Mala cheia', () => {
    const inv = [item('tommy_gun', 0), item('double_barrel', 2)];
    expect(firstEmptyBagSlot(inv, null, 10)).toBe(1);
    const cheia = Array.from({ length: 10 }, (_, i) => item('tommy_gun', i));
    expect(firstEmptyBagSlot(cheia, null, 10)).toBe(-1);
  });
});

describe('Mala: mover e trocar itens (R-MALA-4)', () => {
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
    Object.assign(gm.getPlayer(), createNewPlayer('Teste', 'carrasco', defaultAppearance(), 'colt_1911'));
    gm.getPlayer().cash = 10_000_000;
    gm.getPlayer().gold = 1000;
    gm.getPlayer().level = 100;
    // o personagem novo começa com 1 uísque na Mala: tiramos para os testes de posição começarem com a Mala só com a arma
    gm.getPlayer().inventory = gm.getPlayer().inventory.filter(i => i.weaponRefId);
    return gm;
  }
  const posicaoDe = (gm: Awaited<ReturnType<typeof jogador>>, id: string) =>
    gm.getBagLayout().findIndex(c => c && c.item.weaponRefId === id);

  it('item novo vai para o primeiro slot vazio', async () => {
    const gm = await jogador();
    gm.buyItem(item('tommy_gun'));
    gm.buyItem(item('double_barrel'));
    expect(posicaoDe(gm, 'tommy_gun')).toBe(0); // o Colt equipado não ocupa slot visível
    expect(posicaoDe(gm, 'double_barrel')).toBe(1);
  });

  it('mover para um slot vazio: o item fica lá e os outros não se mexem', async () => {
    const gm = await jogador();
    gm.buyItem(item('tommy_gun'));
    gm.buyItem(item('double_barrel'));
    const idx = gm.getPlayer().inventory.findIndex(i => i.weaponRefId === 'tommy_gun');
    expect(gm.moveBagItem(idx, 7)).toBe(true);
    expect(posicaoDe(gm, 'tommy_gun')).toBe(7);
    expect(posicaoDe(gm, 'double_barrel')).toBe(1);
    // um terceiro item novo ocupa o primeiro vazio (slot 0), não o fim
    gm.buyItem(item('mauser_c96'));
    expect(posicaoDe(gm, 'mauser_c96')).toBe(0);
  });

  it('mover para um slot ocupado troca os dois de lugar', async () => {
    const gm = await jogador();
    gm.buyItem(item('tommy_gun'));
    gm.buyItem(item('double_barrel'));
    const idx = gm.getPlayer().inventory.findIndex(i => i.weaponRefId === 'tommy_gun');
    gm.moveBagItem(idx, 1);
    expect(posicaoDe(gm, 'tommy_gun')).toBe(1);
    expect(posicaoDe(gm, 'double_barrel')).toBe(0);
  });

  it('slot que não existe ou item que não existe: recusa e nada muda', async () => {
    const gm = await jogador();
    gm.buyItem(item('tommy_gun'));
    const idx = gm.getPlayer().inventory.findIndex(i => i.weaponRefId === 'tommy_gun');
    expect(gm.moveBagItem(idx, 10)).toBe(false);
    expect(gm.moveBagItem(idx, -1)).toBe(false);
    expect(gm.moveBagItem(99, 3)).toBe(false);
    expect(posicaoDe(gm, 'tommy_gun')).toBe(0);
  });

  it('vender um item não faz os outros mudarem de slot', async () => {
    const gm = await jogador();
    gm.buyItem(item('tommy_gun'));
    gm.buyItem(item('double_barrel'));
    const idxTommy = gm.getPlayer().inventory.findIndex(i => i.weaponRefId === 'tommy_gun');
    gm.sellItem(idxTommy);
    expect(posicaoDe(gm, 'double_barrel')).toBe(1);
  });

  it('guardar a arma equipada soltando num slot vazio: ela vai exatamente para ele', async () => {
    const gm = await jogador();
    expect(gm.unequipWeapon(6)).toBe(true);
    expect(posicaoDe(gm, 'colt_1911')).toBe(6);
  });

  it('guardar a arma equipada num slot ocupado: ela vai para um vazio, sem derrubar o outro', async () => {
    const gm = await jogador();
    gm.buyItem(item('tommy_gun'));
    expect(posicaoDe(gm, 'tommy_gun')).toBe(0);
    gm.unequipWeapon(0);
    expect(posicaoDe(gm, 'tommy_gun')).toBe(0);
    expect(posicaoDe(gm, 'colt_1911')).toBeGreaterThan(0);
  });
});

describe('atributos: um único "+" simétrico (R-ATRIBUTO-1)', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8').replace(/\r\n/g, '\n');
  const css = readFileSync(join(process.cwd(), 'src', 'web', 'style.css'), 'utf8').replace(/\r\n/g, '\n');

  it('cada um dos 4 atributos tem exatamente um botão "+", e não há mais botão de treinar nem "+1"', () => {
    const plus = html.match(/class="btn-attr-plus"/g) ?? [];
    expect(plus).toHaveLength(4);
    for (const k of ['attack', 'life', 'astucia', 'tenacidade']) expect(html).toContain(`data-plus="${k}"`);
    expect(html).not.toContain('btn-attr-train');
    expect(html).not.toContain('btn-attr-add');
    expect(html).not.toContain('Treinar <span');
  });

  it('as linhas são simétricas: mesma altura e colunas fixas (nome | valor | seta | +), como uma tabela', () => {
    expect(css).toMatch(/\.attr-c-row\s*\{[^}]*grid-template-columns:\s*1fr 3\.5rem 1rem 3\.5rem/);
    expect(css).toMatch(/\.attr-c-row\s*\{[^}]*height:\s*2\.75rem/);
    expect((html.match(/class="attr-c-arrow"/g) ?? []).length).toBe(4);
  });
});
