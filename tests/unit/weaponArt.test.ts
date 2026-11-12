import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WEAPONS_CATALOG } from '../../src/engine/weapons.js';
import { SHOP_ITEMS } from '../../src/web/gameData.js';
import { getWeaponSprite } from '../../src/web/weaponSprites.js';
import { FICHA_ICON_URL, MISSIONS_ICON_URL, WEAPON_ART_IDS, WEAPON_FRAME, weaponArtImg, weaponArtUrl, weaponFrame } from '../../src/web/weaponArt.js';

const pub = (url: string) => join(process.cwd(), 'public', url.replace(/^\//, ''));

describe('arte das armas (R-ARTE-1)', () => {
  it('cada imagem existe, é WebP com transparência e é leve', () => {
    const todas: [string, string][] = [['chapeu', MISSIONS_ICON_URL], ['ficha', FICHA_ICON_URL]];
    for (const id of WEAPON_ART_IDS) for (const f of ['comum', 'epico'] as const) todas.push([`${id}.${f}`, weaponArtUrl(id, f)!]);
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

describe('molduras das armas no estilo do Goodgame antigo (R-ARTE-2)', () => {
  it('cada arma tem a versão comum (borda preta) e a épica (borda branca e brilho vermelho); a épica não é menor que a comum', async () => {
    for (const id of WEAPON_ART_IDS) {
      const c = readFileSync(pub(weaponArtUrl(id, 'comum')!));
      const e = readFileSync(pub(weaponArtUrl(id, 'epico')!));
      expect(e.length, id).toBeGreaterThan(c.length); // o brilho acrescenta pixels
    }
  });

  it('a moldura padrão é a comum; só as armas marcadas usam a épica', () => {
    expect(weaponFrame('colt_1911')).toBe('comum');
    expect(weaponFrame('arma_que_nao_existe')).toBe('comum');
    for (const [id, f] of Object.entries(WEAPON_FRAME)) {
      expect(f).toBe('epico');
      expect(weaponArtUrl(id)).toBe(`/assets/weapons/${id}.epico.webp`);
    }
    expect(weaponArtUrl('bar_1918', 'comum')).toBe('/assets/weapons/bar_1918.comum.webp');
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
