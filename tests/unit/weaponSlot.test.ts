import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FISTS, WEAPONS_CATALOG, getWeaponById } from '../../src/engine/weapons.js';
import { simulateFight } from '../../src/engine/fight.js';
import { validateConfig } from '../../src/engine/schema.js';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import type { FighterInput } from '../../src/engine/types.js';
import { getWeaponSprite } from '../../src/web/weaponSprites.js';
import { SHOP_ITEMS, type GameItem } from '../../src/web/gameData.js';
import {
  damageText,
  damageShort,
  damageAverage,
  formatDelta,
  compareWeapons,
  equippedInventoryIndex,
  equippedWeaponDef,
  bagEntries,
  bagSlotCount,
  isWeaponItem,
} from '../../src/web/weaponSlot.js';

const item = (weaponId: string): GameItem => {
  const it = SHOP_ITEMS.find(i => i.weaponRefId === weaponId);
  if (!it) throw new Error('item de loja não encontrado: ' + weaponId);
  return { ...it };
};

describe('dano mínimo e máximo sempre visível (R-ARMA-1)', () => {
  it('toda arma do catálogo tem dano mínimo e máximo válidos para mostrar', () => {
    for (const w of WEAPONS_CATALOG) {
      expect(Number.isInteger(w.min), w.id).toBe(true);
      expect(Number.isInteger(w.max), w.id).toBe(true);
      expect(w.min, w.id).toBeGreaterThan(0);
      expect(w.max, w.id).toBeGreaterThanOrEqual(w.min);
    }
  });

  it('formata como "12 mín – 22 máx" e a versão curta "12–22"', () => {
    const colt = getWeaponById('colt_1911');
    expect(damageText(colt)).toBe('12 mín – 22 máx');
    expect(damageShort(colt)).toBe('12–22');
    expect(damageAverage(colt)).toBe(17);
  });

  it('toda arma da loja aponta para uma arma do catálogo (e portanto tem dano a mostrar)', () => {
    const armas = SHOP_ITEMS.filter(i => i.type === 'weapon');
    expect(armas.length).toBe(WEAPONS_CATALOG.length);
    for (const a of armas) expect(WEAPONS_CATALOG.some(w => w.id === a.weaponRefId), a.id).toBe(true);
  });
});

describe('comparação com a arma equipada (R-ARMA-2)', () => {
  const revolver = getWeaponById('revolver_38'); // 8–16
  const colt = getWeaponById('colt_1911'); // 12–22

  it('mostra a diferença de mínimo, máximo e média', () => {
    const c = compareWeapons(colt, revolver);
    expect(c.deltaMin).toBe(4);
    expect(c.deltaMax).toBe(6);
    expect(c.deltaAvg).toBe(5);
    expect(c.verdict).toBe('melhor');
  });

  it('a mais fraca é "pior" e a igual é "igual"', () => {
    expect(compareWeapons(revolver, colt).verdict).toBe('pior');
    expect(compareWeapons(colt, colt).verdict).toBe('igual');
  });

  it('ganha num extremo e perde no outro: "misto"', () => {
    expect(compareWeapons({ min: 5, max: 30 }, { min: 10, max: 20 }).verdict).toBe('misto');
  });

  it('formata a diferença com sinal', () => {
    expect(formatDelta(4)).toBe('+4');
    expect(formatDelta(-6)).toBe('−6');
    expect(formatDelta(0)).toBe('0');
    expect(formatDelta(2.5)).toBe('+2.5');
  });

  it('comparar com os punhos mostra o ganho total da arma', () => {
    const c = compareWeapons(colt, equippedWeaponDef(null));
    expect(c.deltaMin).toBe(12);
    expect(c.deltaMax).toBe(22);
  });
});

describe('a arma equipada fica no espaço da arma, não na mochila (R-ARMA-3)', () => {
  it('a cópia da arma equipada some da mochila; as outras continuam', () => {
    const inv = [item('revolver_38'), item('colt_1911'), item('tommy_gun')];
    expect(equippedInventoryIndex(inv, 'colt_1911')).toBe(1);
    const bag = bagEntries(inv, 'colt_1911');
    expect(bag.map(b => b.item.weaponRefId)).toEqual(['revolver_38', 'tommy_gun']);
    expect(bag.map(b => b.index)).toEqual([0, 2]); // posições reais, para as ações
  });

  it('desarmado: mochila mostra tudo', () => {
    const inv = [item('revolver_38'), item('colt_1911')];
    expect(bagEntries(inv, null).length).toBe(2);
  });

  it('com duas cópias da mesma arma, só uma fica no espaço da arma', () => {
    const inv = [item('colt_1911'), item('colt_1911')];
    expect(bagEntries(inv, 'colt_1911').length).toBe(1);
  });

  it('a mochila mostra no mínimo 12 espaços e cresce de 4 em 4 (antes, itens além de 12 ficavam invisíveis)', () => {
    expect(bagSlotCount(0)).toBe(12);
    expect(bagSlotCount(12)).toBe(12);
    expect(bagSlotCount(13)).toBe(16);
    expect(bagSlotCount(17)).toBe(20);
  });

  it('só arma é arma', () => {
    expect(isWeaponItem(item('colt_1911'))).toBe(true);
    const cons = SHOP_ITEMS.find(i => i.type === 'consumable');
    expect(isWeaponItem(cons)).toBe(false);
    expect(isWeaponItem(undefined)).toBe(false);
  });
});

describe('desarmado luta com os punhos (R-ARMA-4)', () => {
  const config = validateConfig(balanceJson);

  it('sem arma equipada vale FISTS: dano 0 a 0, fora do catálogo da loja', () => {
    expect(equippedWeaponDef(null)).toBe(FISTS);
    expect(getWeaponById('fists')).toBe(FISTS);
    expect(FISTS.min).toBe(0);
    expect(FISTS.max).toBe(0);
    expect(WEAPONS_CATALOG.some(w => w.id === 'fists')).toBe(false);
    expect(SHOP_ITEMS.some(i => i.weaponRefId === 'fists')).toBe(false);
  });

  it('os punhos têm desenho próprio (não caem no da pistola)', () => {
    const fist = getWeaponSprite('fists', 'preview').svg;
    expect(fist).not.toBe(getWeaponSprite('colt_1911', 'preview').svg);
    expect(fist).toContain('<svg');
  });

  it('a luta funciona de mãos vazias e é determinística', () => {
    const a: FighterInput = { style: 'carrasco', level: 1, points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 }, weapon: FISTS };
    const b: FighterInput = { style: 'muralha', level: 1, points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 }, weapon: getWeaponById('colt_1911') };
    const r1 = simulateFight(a, b, config, 7, { withEvents: true });
    const r2 = simulateFight(a, b, config, 7, { withEvents: true });
    expect(r1.winner).toBe(r2.winner);
    expect(r1.events!.length).toBe(r2.events!.length);
    expect(r1.events!.length).toBeGreaterThan(0);
  });

  it('desarmado causa menos dano que armado, com os mesmos atributos', () => {
    const base = { style: 'carrasco' as const, level: 1, points: { attack: 10, life: 10, astucia: 10, tenacidade: 10 } };
    const alvo: FighterInput = { ...base, style: 'muralha' };
    const dano = (w: FighterInput['weapon']) => {
      const fight = simulateFight({ ...base, weapon: w }, alvo, config, 99, { withEvents: true });
      const golpes = fight.events!.filter(e => e.attacker === 'A' && !e.isDodge);
      return golpes.reduce((soma, e) => soma + e.finalDamage, 0) / Math.max(1, golpes.length);
    };
    expect(dano(getWeaponById('colt_1911'))).toBeGreaterThan(dano(FISTS));
  });
});

// ---- ações do jogador (estado) ----
describe('trocar e guardar a arma (R-ARMA-3, R-ARMA-5)', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });

  async function novoJogador() {
    const { GameStateManager, createNewPlayer } = await import('../../src/web/state.js');
    const { defaultAppearance } = await import('../../src/web/characterOptions.js');
    const gm = new GameStateManager();
    Object.assign(gm.getPlayer(), createNewPlayer('Teste', 'carrasco', defaultAppearance(), 'colt_1911'));
    return gm;
  }

  it('começa com a arma inicial equipada e na mochila (por referência)', async () => {
    const gm = await novoJogador();
    const p = gm.getPlayer();
    expect(p.equipped.weaponId).toBe('colt_1911');
    expect(equippedInventoryIndex(p.inventory, p.equipped.weaponId)).toBeGreaterThanOrEqual(0);
  });

  it('arrastar outra arma para o espaço da arma substitui; a anterior volta para a mochila', async () => {
    const gm = await novoJogador();
    gm.getPlayer().cash = 100000; gm.getPlayer().level = 100;
    expect(gm.buyItem(item('tommy_gun'))).toBe(true);
    const p = gm.getPlayer();
    expect(p.equipped.weaponId).toBe('colt_1911'); // compra NÃO troca sozinha (R-ARMA-5)
    const idx = p.inventory.findIndex(i => i.weaponRefId === 'tommy_gun');
    expect(gm.equipWeaponFromBag(idx)).toBe(true);
    expect(p.equipped.weaponId).toBe('tommy_gun');
    const bag = bagEntries(p.inventory, p.equipped.weaponId).map(b => b.item.weaponRefId);
    expect(bag).toContain('colt_1911'); // a antiga está na mochila
    expect(bag).not.toContain('tommy_gun'); // a nova saiu da mochila
  });

  it('arrastar a arma equipada para a mochila: ela sai e o jogador fica desarmado', async () => {
    const gm = await novoJogador();
    expect(gm.unequipWeapon()).toBe(true);
    const p = gm.getPlayer();
    expect(p.equipped.weaponId).toBeNull();
    expect(bagEntries(p.inventory, p.equipped.weaponId).some(b => b.item.weaponRefId === 'colt_1911')).toBe(true);
    expect(gm.unequipWeapon()).toBe(false); // já estava desarmado
  });

  it('desarmado, equipar uma arma da mochila funciona', async () => {
    const gm = await novoJogador();
    gm.unequipWeapon();
    const p = gm.getPlayer();
    const idx = p.inventory.findIndex(i => i.weaponRefId === 'colt_1911');
    expect(gm.equipWeaponFromBag(idx)).toBe(true);
    expect(p.equipped.weaponId).toBe('colt_1911');
  });

  it('comprar arma com o espaço vazio equipa sozinha', async () => {
    const gm = await novoJogador();
    gm.unequipWeapon();
    gm.getPlayer().cash = 100000; gm.getPlayer().level = 100;
    gm.buyItem(item('revolver_38'));
    expect(gm.getPlayer().equipped.weaponId).toBe('revolver_38');
  });

  it('item que não é arma não equipa no espaço da arma', async () => {
    const gm = await novoJogador();
    const cons = SHOP_ITEMS.find(i => i.type === 'consumable')!;
    gm.getPlayer().inventory.push({ ...cons });
    expect(gm.equipWeaponFromBag(gm.getPlayer().inventory.length - 1)).toBe(false);
    expect(gm.equipWeaponFromBag(999)).toBe(false);
    expect(gm.getPlayer().equipped.weaponId).toBe('colt_1911');
  });

  it('nunca perde a arma: se a equipada não estava na mochila, ela entra ao sair', async () => {
    const gm = await novoJogador();
    const p = gm.getPlayer();
    p.inventory = p.inventory.filter(i => i.weaponRefId !== 'colt_1911'); // save antigo, sem a cópia
    p.equipped.weaponId = 'colt_1911';
    gm.unequipWeapon();
    expect(p.inventory.some(i => i.weaponRefId === 'colt_1911')).toBe(true);
  });

  it('vender a cópia equipada deixa desarmado; vender outra cópia não mexe na equipada', async () => {
    const gm = await novoJogador();
    const p = gm.getPlayer();
    p.inventory.push(item('colt_1911')); // segunda cópia
    const equipada = equippedInventoryIndex(p.inventory, 'colt_1911');
    const outra = p.inventory.findIndex((i, n) => i.weaponRefId === 'colt_1911' && n !== equipada);
    gm.sellItem(outra);
    expect(p.equipped.weaponId).toBe('colt_1911');
    gm.sellItem(equippedInventoryIndex(p.inventory, 'colt_1911'));
    expect(p.equipped.weaponId).toBeNull();
  });
});
