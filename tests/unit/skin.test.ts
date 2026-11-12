import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_SKIN, FOLDER_HEADERS, SKIN_KEY, applySkin, readSkin, toggleSkin } from '../../src/web/skin.js';
import { ITEM_SLOTS } from '../../src/shared/itemRoll.js';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('tema da pasta: couro e dourado / bege (R-LAYOUT-9)', () => {
  let store: Map<string, string>;
  let attrs: Record<string, string>;
  beforeEach(() => {
    store = new Map();
    attrs = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.stubGlobal('document', { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } });
  });

  it('o padrão é couro e dourado', () => {
    expect(DEFAULT_SKIN).toBe('couro');
    expect(readSkin()).toBe('couro');
  });

  it('trocar alterna entre os dois, aplica na página e guarda no navegador', () => {
    expect(toggleSkin()).toBe('bege');
    expect(attrs['data-skin']).toBe('bege');
    expect(store.get(SKIN_KEY)).toBe('bege');
    expect(readSkin()).toBe('bege');
    expect(toggleSkin()).toBe('couro');
    expect(attrs['data-skin']).toBe('couro');
  });

  it('valor guardado inválido volta ao padrão, e armazenamento quebrado não derruba o jogo', () => {
    store.set(SKIN_KEY, 'neon');
    expect(readSkin()).toBe('couro');
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    });
    expect(readSkin()).toBe('couro');
    expect(toggleSkin()).toBe('bege'); // a troca vale na sessão mesmo sem guardar
    applySkin('couro');
    expect(attrs['data-skin']).toBe('couro');
  });
});

describe('casca em forma de pasta (R-LAYOUT-9)', () => {
  const html = ler('index.html');
  const css = ler('src/web/style.css');
  const tabs = [...html.matchAll(/class="game-nav-tab[^"]*"[^>]*data-tab="([a-z]+)"/g)].map(m => m[1]);

  it('as 8 abas ficam à esquerda, só com ícone (nome só no balão), e cada uma tem título e carimbo de pasta', () => {
    expect(tabs).toEqual(['perfil', 'missoes', 'duelos', 'loja', 'ranking', 'familia', 'eventos', 'simulador']);
    for (const t of tabs) expect(FOLDER_HEADERS[t], t).toBeDefined();
    expect(html).not.toContain('tab-emoji');
    for (const m of html.matchAll(/<button class="game-nav-tab[^>]*>([\s\S]*?)<\/button>/g)) expect(m[1].replace(/<[^>]*>/g, '').trim()).toBe(''); // sem texto, só o ícone
    expect(html).toContain('id="folder-title"');
    expect(html).toContain('id="folder-stamp"');
  });

  it('todo ícone usado existe no conjunto de ícones, inclusive o de cada um dos 8 slots', () => {
    const defined = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
    const used = [...html.matchAll(/<use href="#([^"]+)"/g)].map(m => m[1]);
    for (const u of used) expect(defined.has(u), u).toBe(true);
    for (const s of ITEM_SLOTS) expect(defined.has(`g-${s}`), `g-${s}`).toBe(true);
  });

  it('os dois temas definem exatamente as mesmas cores', () => {
    const tokens = (block: string) => [...block.matchAll(/(--[a-z0-9-]+):/g)].map(m => m[1]).sort();
    const couro = css.match(/:root \{\n  --font-sans[\s\S]*?\n\}/)![0];
    const bege = css.match(/html\[data-skin="bege"\] \{[\s\S]*?\n\}/)![0];
    const skinOnly = (t: string[]) => t.filter(x => !x.startsWith('--font-'));
    expect(skinOnly(tokens(bege))).toEqual(skinOnly(tokens(couro)));
    expect(skinOnly(tokens(bege)).length).toBeGreaterThan(18);
  });

  it('o tema vale só na casca: modais de combate e login não são afetados', () => {
    expect(css).toMatch(/\.hud-header, \.shell \{\n  --bg-primary: var\(--desk\);/);
    expect(css).not.toMatch(/html\[data-skin="bege"\] \.combat/);
  });
});
