import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SHOP_ITEMS } from '../../src/web/gameData.js';
import { buildGearItem } from '../../src/shared/gear.js';
import { bagEntries, bagCount } from '../../src/web/weaponSlot.js';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const peca = (id: string, slot: 'chapeu' | 'peitoral', atk = 1) =>
  buildGearItem(id, { slot, level: 1, points: { attack: atk, life: 0, astucia: 0, tenacidade: 0 }, variant: 0 });

describe('equipamento sempre vai primeiro para a Mala; equipado não ocupa lugar (R-MALA-7)', () => {
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
    gm.getPlayer().cash = 1_000_000;
    gm.getPlayer().level = 100;
    gm.getPlayer().inventory = gm.getPlayer().inventory.filter(i => i.weaponRefId); // só o Colt equipado
    return gm;
  }

  it('item ganho (drop) vai para a Mala e nunca é equipado sozinho', async () => {
    const gm = await jogador();
    expect(gm.grantItem(peca('g_chapeu_a', 'chapeu'))).toBe(true);
    expect(gm.getPlayer().equipped.gear.chapeu).toBeUndefined();
    expect(gm.getBagCount()).toBe(1);
  });

  it('equipar tira o item da Mala (não ocupa mais lugar) e desequipar devolve', async () => {
    const gm = await jogador();
    gm.grantItem(peca('g_chapeu_a', 'chapeu'));
    expect(gm.equipGear('g_chapeu_a')).toBe(true);
    expect(gm.getBagCount()).toBe(0);
    expect(gm.getBagLayout().every(c => c === null)).toBe(true); // nada aparece na Mala
    expect(gm.getPlayer().inventory.some(i => i.id === 'g_chapeu_a')).toBe(true); // continua no save (o servidor confere por aqui)
    expect(gm.unequipGear('chapeu')).toBe('ok');
    expect(gm.getBagCount()).toBe(1);
    expect(gm.getPlayer().equipped.gear.chapeu).toBeUndefined();
  });

  it('trocar o item de um slot devolve o antigo à Mala, sem precisar de espaço extra', async () => {
    const gm = await jogador();
    gm.grantItem(peca('g_chapeu_a', 'chapeu'));
    gm.grantItem(peca('g_chapeu_b', 'chapeu', 2));
    gm.equipGear('g_chapeu_a');
    expect(gm.getBagCount()).toBe(1); // só o b na Mala
    gm.equipGear('g_chapeu_b');
    expect(gm.getBagCount()).toBe(1); // agora só o a na Mala
    expect(bagEntries(gm.getPlayer().inventory, gm.getPlayer().equipped.weaponId, gm.equippedGearIds()).map(e => e.item.id)).toEqual(['g_chapeu_a']);
  });

  it('com 10 itens na Mala dá para equipar (abre espaço), mas não dá para guardar o equipado de volta', async () => {
    const gm = await jogador();
    gm.grantItem(peca('g_peitoral_a', 'peitoral'));
    gm.equipGear('g_peitoral_a'); // equipado: não conta
    const cons = SHOP_ITEMS.find(i => i.type === 'consumable')!;
    while (gm.bagHasRoom()) gm.grantItem(cons);
    expect(gm.getBagCount()).toBe(gm.getBagCapacity()); // Mala cheia
    expect(gm.unequipGear('peitoral')).toBe('sem_espaco'); // não há onde guardar
    expect(gm.getPlayer().equipped.gear.peitoral).toBe('g_peitoral_a'); // nada mudou
    gm.useConsumable(gm.getPlayer().inventory.find(i => i.type === 'consumable')!, gm.getPlayer().inventory.findIndex(i => i.type === 'consumable'));
    expect(gm.unequipGear('peitoral')).toBe('ok');
  });

  it('guardar o equipado num slot escolhido da Mala coloca nele; slot vazio do equipamento não faz nada', async () => {
    const gm = await jogador();
    gm.grantItem(peca('g_chapeu_a', 'chapeu'));
    gm.equipGear('g_chapeu_a');
    expect(gm.unequipGear('chapeu', 7)).toBe('ok');
    expect(gm.getBagLayout()[7]?.item.id).toBe('g_chapeu_a');
    expect(gm.unequipGear('calcado')).toBe('vazio');
  });

  it('comprar sem espaço na Mala é recusado, inclusive arma e equipamento (nada é cobrado)', async () => {
    const gm = await jogador();
    const cons = SHOP_ITEMS.find(i => i.type === 'consumable')!;
    while (gm.bagHasRoom()) gm.grantItem(cons);
    const cash = gm.getPlayer().cash;
    const alvo = gm.getShopStock()[0];
    expect(gm.buyGearFromStock(alvo.id)).toBe('mochila');
    expect(gm.buyItem(SHOP_ITEMS.find(i => i.weaponRefId === 'revolver_38')!)).toBe(false);
    expect(gm.getPlayer().cash).toBe(cash);
  });

  it('vender um item equipado o desequipa (ele deixa de valer no combate)', async () => {
    const gm = await jogador();
    gm.grantItem(peca('g_chapeu_a', 'chapeu'));
    gm.equipGear('g_chapeu_a');
    const antes = gm.getCombatPoints().attack;
    gm.sellItem(gm.getPlayer().inventory.findIndex(i => i.id === 'g_chapeu_a'));
    expect(gm.getPlayer().equipped.gear.chapeu).toBeUndefined();
    expect(gm.getCombatPoints().attack).toBe(antes - 1);
  });

  it('as funções puras da Mala escondem o equipado só quando o id é passado', () => {
    const inv = [peca('g_a', 'chapeu'), peca('g_b', 'peitoral')];
    expect(bagCount(inv, null)).toBe(2);
    expect(bagCount(inv, null, ['g_a'])).toBe(1);
    expect(bagEntries(inv, null, ['g_a']).map(e => e.item.id)).toEqual(['g_b']);
  });
});

describe('tela da Mala e da loja (R-MALA-7, R-MALA-8, R-ARMA-7, R-SLOT-1)', () => {
  const main = ler('src/web/main.ts');
  const css = ler('src/web/style.css');
  const html = ler('index.html');

  it('o slot da Mala não mostra atributo da arma (só no balão) e não tem o selo USO', () => {
    const grade = main.slice(main.indexOf('function renderInventoryGrid'), main.indexOf('function showInventoryItemDetails'));
    expect(grade).not.toContain('inv-dmg');
    expect(grade).not.toContain('inv-slot-badge');
    expect(grade).toContain('data-bag-tip');
  });

  it('todos os slots são 4:3: Mala (8,8 x 6,6) e Equipamento', () => {
    expect(css).toMatch(/\.sub-sheet \.inventory-slots-grid \{ grid-template-columns: repeat\(5, 8\.8rem\); grid-auto-rows: 6\.6rem; \}/);
    expect(8.8 / 6.6).toBeCloseTo(4 / 3, 2);
    expect(css).toMatch(/\.equipped-slots-grid \.gear-slot \{ aspect-ratio: 4 \/ 3; \}/);
  });

  it('o painel da Arma é só a foto: sem nome, dano, categoria, dica nem botão', () => {
    const painel = html.slice(html.indexOf('id="slot-equipped-weapon"'), html.indexOf('profile-gear-panel'));
    expect(painel).not.toContain('ARMA EQUIPADA');
    expect(painel).not.toContain('Guardar na Mala');
    expect(painel).not.toContain('weapon-slot-hint');
    const arma = main.slice(main.indexOf('function renderWeaponSlot'), main.indexOf('function comparisonHtml'));
    expect(arma).not.toContain('wdmg');
    expect(arma).not.toContain('categoryName');
  });

  it('vender só na loja, arrastando para a zona de venda: o botão Vender do perfil saiu', () => {
    expect(html).toContain('id="sell-zone"');
    expect(main).not.toContain('btn-sell-inv');
    expect(main).toContain("sellZone?.addEventListener('drop'");
    expect(css).toMatch(/#app\[data-tab="loja"\] \.sub-folder \{/); // a Mala aparece na loja
    expect(main).toContain("activateSubPane('mala')");
  });

  it('equipar e guardar também por arrastar: soltar no slot certo equipa; soltar na Mala guarda', () => {
    expect(main).toContain("kind: 'gear'");
    expect(main).toContain('gearGrid?.addEventListener');
    expect(main).toContain('tryUnequipGear(slotName)');
  });
});

describe('slot vazio da Mala: carimbo VAZIO (R-MALA-9)', () => {
  it('o slot vazio mostra o carimbo "VAZIO" torto, sem px, e sem texto no HTML', () => {
    const css = readFileSync(join(process.cwd(), 'src/web/style.css'), 'utf8');
    const i = css.indexOf('.inv-slot.empty::after');
    expect(i).toBeGreaterThan(0);
    const bloco = css.slice(i, css.indexOf('}', i));
    expect(bloco).toContain("content: 'VAZIO'");
    expect(bloco).toContain('rotate(-8deg)');
    expect(bloco).toContain('dashed');
    expect(bloco).not.toMatch(/\dpx/);
  });
});
