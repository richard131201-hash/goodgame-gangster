import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { cleanPoints, roundedPath, stitchOutline, STITCH_INSET_REM } from '../../src/web/stitch.js';

const css = readFileSync('src/web/style.css', 'utf8');
const main = readFileSync('src/web/main.ts', 'utf8');
const notice = readFileSync('src/web/notice.ts', 'utf8');

describe('costura que contorna a aba ativa (R-PASTA-1)', () => {
  const folder = { l: 100, t: 40, r: 900, b: 600 };

  it('sem abas, a costura é só o retângulo da pasta', () => {
    expect(stitchOutline(folder, 10)).toEqual([[110, 50], [890, 50], [890, 590], [110, 590]]);
  });

  it('com aba no topo e aba na esquerda, vira UMA linha fechada que dá a volta nas duas abas', () => {
    const pts = stitchOutline(folder, 10, { l: 120, t: 5, r: 260, b: 42 }, { l: 20, t: 200, r: 105, b: 260 });
    // sobe pela aba do topo
    expect(pts).toContainEqual([130, 15]);
    expect(pts).toContainEqual([250, 15]);
    // sai da pasta para a esquerda, dá a volta na aba e volta
    expect(pts).toContainEqual([30, 250]);
    expect(pts).toContainEqual([30, 210]);
    const d = roundedPath(pts, 8);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect((d.match(/M/g) ?? []).length).toBe(1);
  });

  it('pontos repetidos e em linha reta são removidos', () => {
    expect(cleanPoints([[0, 0], [0, 0], [5, 0], [10, 0], [10, 10], [0, 10]])).toEqual([[0, 0], [10, 0], [10, 10], [0, 10]]);
  });

  it('está ligada à pasta principal, à subpasta da Mala e aos avisos; a costura antiga some', () => {
    expect(main).toContain('attachStitch({');
    expect(main).not.toContain("left: () => shell.querySelector"); // as abas de ícone saíram da lateral: a costura só contorna o título e as subabas
    expect(main).toContain("top: () => sub.querySelector<HTMLElement>('.sub-tab.active')");
    expect(notice).toContain("top: () => card.querySelector<HTMLElement>('.notice-ear')");
    expect(css).toMatch(/\.folder\.has-stitch::after, \.sub-folder\.has-stitch::after, \.notice-card\.has-stitch::after \{ display: none; \}/);
  });

  it('a costura fica rente à borda, com o mesmo respiro em todo o jogo, e a 1ª aba começa na linha do topo da pasta', () => {
    expect(STITCH_INSET_REM).toBe(0.25);
    expect(main).not.toMatch(/insetRem: 0\.[0-9]+[,}]/);
    expect(notice).not.toMatch(/insetRem: 0\.[0-9]+[,}]/);
    expect(css).toMatch(/\.game-main-nav \{ padding-top: 0; \}/);
    expect(css).toMatch(/\.game-nav-tab\.active, \.sub-tab\.active \{ border-color: var\(--cover-edge\); \}/);
  });

  it('o selo é o "Papel" (R-SELO-1): fundo de papel opaco que cobre o que estiver atrás, moldura dupla, tinta falhada', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).not.toContain('stamp-grunge');
    expect(css).toMatch(/\.folder-stamp, \.notice-stamp \{[^}]*background: var\(--paper\);[^}]*opacity: 1;[^}]*mask-image: url\(\"data:image\/svg\+xml,[^}]*feTurbulence[^}]*mask-size: 100% 100%;/);
    expect(css).toMatch(/\.folder-stamp::before, \.notice-stamp::before \{/);
  });

  it('o "+" do ouro (R-OURO-2) existe no card do Ouro, é retângulo com brilho e avisa que a compra não está liberada', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toMatch(/id="hud-gold"[\s\S]{0,120}id="buy-gold-btn"/);
    expect(css).toMatch(/\.res-gold-plus \{[^}]*width: 2\.5rem;[^}]*height: 1\.55rem;/);
    expect(css).toContain('@keyframes gold-shine');
    expect(css).toContain('.res-card.res-gold { padding: 0.4rem 0.8rem; }'); // simetria: mesmo respiro dos dois lados
    expect(css).toMatch(/html\[data-skin="bege"\] \.res-gold-plus \{ background-color: #d9c690;/);
    expect(main).toContain("getElementById('buy-gold-btn')");
    expect(main).toContain('A compra de Ouro ainda não está liberada');
  });
});
