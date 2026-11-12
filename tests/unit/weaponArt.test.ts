import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WEAPONS_CATALOG } from '../../src/engine/weapons.js';
import { SHOP_ITEMS } from '../../src/web/gameData.js';
import { getWeaponSprite } from '../../src/web/weaponSprites.js';
import { FICHA_ICON_URL, MISSIONS_ICON_URL, WEAPON_ART_IDS, WEAPON_FRAME, sellableInShop, weaponArtImg, weaponArtUrl, weaponFrame, type ArtFrame } from '../../src/web/weaponArt.js';

const pub = (url: string) => join(process.cwd(), 'public', url.replace(/^\//, ''));

describe('arte das armas (R-ARTE-1)', () => {
  it('cada imagem existe, é WebP com transparência e é leve', () => {
    const todas: [string, string][] = [['chapeu', MISSIONS_ICON_URL], ['ficha', FICHA_ICON_URL]];
    for (const id of WEAPON_ART_IDS) for (const f of ['comum', 'epico', 'lendario'] as const) todas.push([`${id}.${f}`, weaponArtUrl(id, f)!]);
    for (const [id, url] of todas) {
      const caminho = pub(url);
      expect(existsSync(caminho), `${id}: ${url}`).toBe(true);
      const b = readFileSync(caminho);
      expect(b.subarray(0, 4).toString('latin1')).toBe('RIFF');
      expect(b.subarray(8, 12).toString('latin1')).toBe('WEBP');
      expect(b.subarray(12, 16).toString('latin1')).toBe('VP8X'); // formato estendido: é o que carrega o canal de transparência
      expect(b[20] & 0x10, `${id} sem canal alfa`).toBe(0x10);
      expect(statSync(caminho).size, id).toBeLessThan(150 * 1024);
    }
  });

  it('só há imagem para armas que existem no catálogo, e as 5 do fundador estão ligadas', () => {
    for (const id of WEAPON_ART_IDS) expect(WEAPONS_CATALOG.some(w => w.id === id), id).toBe(true);
    expect([...WEAPON_ART_IDS].sort()).toEqual(['bar_1918', 'colt_1911', 'pump_trench', 'springfield_1903', 'tommy_gun']);
    for (const id of Object.keys(WEAPON_FRAME)) expect(WEAPON_ART_IDS.includes(id), id).toBe(true);
  });

  it('arma sem imagem devolve vazio (cai no desenho vetorial); com imagem devolve <img> que não atrapalha o arrastar', () => {
    expect(weaponArtUrl('revolver_38')).toBeNull();
    expect(weaponArtImg('revolver_38')).toBe('');
    expect(weaponArtUrl(null)).toBeNull();
    const html = weaponArtImg('colt_1911', 'inv-art');
    expect(html).toContain('src="/assets/weapons/colt_1911.comum.webp"');
    expect(html).toContain('draggable="false"');
    expect(html).toContain('inv-art');
  });
});

describe('origem por moldura: épico nunca na loja, lendário só por evento (R-ORIGEM-1)', () => {
  it('nenhuma arma vendida na loja tem moldura épica ou lendária', () => {
    for (const i of SHOP_ITEMS.filter(x => x.weaponRefId)) {
      expect(weaponFrame(i.weaponRefId!), i.id).toBe('comum');
      expect(sellableInShop(i.weaponRefId!), i.id).toBe(true);
    }
  });

  it('se uma arma virar épica ou lendária, a loja deixa de vendê-la (não lista e recusa a compra)', async () => {
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
    gm.getPlayer().cash = 10_000_000;
    gm.getPlayer().level = 100;
    const item = SHOP_ITEMS.find(i => i.weaponRefId === 'revolver_38')!;
    expect(gm.buyBlockReason(item)).toBeNull();
    const frames = WEAPON_FRAME as Record<string, ArtFrame>;
    try {
      for (const moldura of ['epico', 'lendario'] as const) {
        frames.revolver_38 = moldura;
        expect(sellableInShop('revolver_38'), moldura).toBe(false);
        expect(gm.buyBlockReason(item), moldura).toBe('indisponivel');
        expect(gm.buyItem(item), moldura).toBe(false);
      }
    } finally {
      delete frames.revolver_38;
    }
    expect(gm.buyBlockReason(item)).toBeNull();
  });
});

describe('molduras das armas no estilo do Goodgame antigo (R-ARTE-2)', () => {
  it('cada arma tem a comum (borda preta), a épica (borda branca e brilho vermelho) e a lendária (borda branca e brilho roxo); as com brilho têm mais pixels que a comum', async () => {
    for (const id of WEAPON_ART_IDS) {
      const c = readFileSync(pub(weaponArtUrl(id, 'comum')!));
      const e = readFileSync(pub(weaponArtUrl(id, 'epico')!));
      const l = readFileSync(pub(weaponArtUrl(id, 'lendario')!));
      expect(e.length, id).toBeGreaterThan(c.length); // o brilho acrescenta pixels
      expect(l.length, id).toBeGreaterThan(c.length);
    }
  });

  it('todas as imagens das armas são 4:3 (cabem direto nos slots 4:3) e a arma ocupa quase toda a altura', () => {
    for (const id of WEAPON_ART_IDS) {
      for (const f of ['comum', 'epico', 'lendario'] as const) {
        const b = readFileSync(pub(weaponArtUrl(id, f)!));
        const largura = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
        const altura = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
        expect(largura / altura, `${id}.${f}`).toBeCloseTo(4 / 3, 2);
      }
    }
  });

  it('a moldura padrão é a comum e hoje nenhuma arma do catálogo nasce épica ou lendária', () => {
    expect(weaponFrame('colt_1911')).toBe('comum');
    expect(weaponFrame('bar_1918')).toBe('comum');
    expect(weaponFrame('arma_que_nao_existe')).toBe('comum');
    expect(Object.keys(WEAPON_FRAME)).toEqual([]);
    expect(weaponArtUrl('bar_1918', 'epico')).toBe('/assets/weapons/bar_1918.epico.webp');
    expect(weaponArtUrl('bar_1918', 'lendario')).toBe('/assets/weapons/bar_1918.lendario.webp');
  });
});

describe('Springfield M1903 de Precisão (nova arma, valores provisórios)', () => {
  const w = WEAPONS_CATALOG.find(x => x.id === 'springfield_1903')!;

  it('entrou no catálogo como rifle, no fim, sem mudar o nível nem o preço das outras armas', () => {
    expect(w).toBeDefined();
    expect(w.category).toBe('rifle');
    expect(w.min).toBeLessThan(w.max);
    expect(WEAPONS_CATALOG[WEAPONS_CATALOG.length - 1].id).toBe('springfield_1903');
    const nivel = (id: string) => SHOP_ITEMS.find(i => i.weaponRefId === id)!.levelReq;
    expect(nivel('colt_1911')).toBe(4);
    expect(nivel('tommy_gun')).toBe(22);
    expect(nivel('bar_1918')).toBe(32);
    expect(SHOP_ITEMS.some(i => i.weaponRefId === 'springfield_1903')).toBe(true);
  });

  it('tem desenho para a mão e a arena (usa o do rifle até haver o próprio)', () => {
    const s = getWeaponSprite('springfield_1903', 'A');
    expect(s.svg.length).toBeGreaterThan(100);
  });
});

describe('ícones de Missões (chapéu) e Ficha (foto com clipe) (R-ARTE-1)', () => {
  it('as abas Missões e Ficha usam as imagens do fundador e as outras seguem com ícone de traço', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    expect(html).toMatch(/data-tab="missoes"[^>]*><img class="ico-img" src="\/assets\/icons\/chapeu\.webp"/);
    expect(html).toMatch(/data-tab="perfil"[^>]*><img class="ico-img ico-ficha" src="\/assets\/icons\/ficha\.webp"/);
    expect(html).toMatch(/data-tab="duelos"[^>]*><svg class="ico"/);
  });
});

describe('ícones de Energia, Cash e Ouro (R-ARTE-3)', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  it('as 3 imagens existem, são WebP com transparência e leves', () => {
    for (const n of ['energia', 'ouro', 'cash']) {
      const b = readFileSync(pub(`/assets/icons/${n}.webp`));
      expect(b.subarray(8, 12).toString('latin1'), n).toBe('WEBP');
      expect(b[20] & 0x10, `${n} sem alfa`).toBe(0x10);
      expect(b.length, n).toBeLessThan(100 * 1024);
    }
  });
  it('o topo usa as imagens (bateria, cash, ouro) no lugar do raio, da nota e da moeda de traço', () => {
    for (const n of ['energia', 'cash', 'ouro']) expect(html).toContain(`class="res-img" src="/assets/icons/${n}.webp"`);
    expect(html).not.toMatch(/class="ico res-icon"[^>]*><use href="#i-(bolt|cash|coin)"/);
  });
  it('os avisos de energia, cash e ouro mostram a mesma arte', async () => {
    const { NOTICE_KINDS } = await import('../../src/web/notice.js');
    expect(NOTICE_KINDS.energia.img).toBe('/assets/icons/energia.webp');
    expect(NOTICE_KINDS.cash.img).toBe('/assets/icons/cash.webp');
    expect(NOTICE_KINDS.ouro.img).toBe('/assets/icons/ouro.webp');
  });
});
