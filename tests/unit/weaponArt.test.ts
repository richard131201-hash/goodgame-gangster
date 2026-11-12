import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WEAPONS_CATALOG } from '../../src/engine/weapons.js';
import { SHOP_ITEMS } from '../../src/web/gameData.js';
import { getWeaponSprite } from '../../src/web/weaponSprites.js';
import { FICHA_ICON_URL, MISSIONS_ICON_URL, WEAPON_ART, weaponArtImg, weaponArtUrl } from '../../src/web/weaponArt.js';

const pub = (url: string) => join(process.cwd(), 'public', url.replace(/^\//, ''));

describe('arte das armas (R-ARTE-1)', () => {
  it('cada imagem existe, é WebP com transparência e é leve', () => {
    for (const [id, url] of Object.entries(WEAPON_ART).concat([['chapeu', MISSIONS_ICON_URL], ['ficha', FICHA_ICON_URL]])) {
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
    for (const id of Object.keys(WEAPON_ART)) expect(WEAPONS_CATALOG.some(w => w.id === id), id).toBe(true);
    expect(Object.keys(WEAPON_ART).sort()).toEqual(['bar_1918', 'colt_1911', 'pump_trench', 'springfield_1903', 'tommy_gun']);
  });

  it('arma sem imagem devolve vazio (cai no desenho vetorial); com imagem devolve <img> que não atrapalha o arrastar', () => {
    expect(weaponArtUrl('revolver_38')).toBeNull();
    expect(weaponArtImg('revolver_38')).toBe('');
    expect(weaponArtUrl(null)).toBeNull();
    const html = weaponArtImg('colt_1911', 'inv-art');
    expect(html).toContain('src="/assets/weapons/colt_1911.webp"');
    expect(html).toContain('draggable="false"');
    expect(html).toContain('inv-art');
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
