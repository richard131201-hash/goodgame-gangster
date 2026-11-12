import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// R-LAYOUT-5 (fundador, 2026-11-11): o "palco" do jogo e do login tem a proporção da imagem do login
// (1672 x 941), centralizado, e o resto da tela é PRETO, sem borda nem moldura.
// R-LAYOUT-6 (fundador, 2026-11-11): o jogo é TOTALMENTE proporcional à tela, nada em px fixo.
// Todo tamanho é em rem, e 1rem = 1/104,5 do palco (o palco é a maior área 16:9 que cabe na tela).
const PALCO_LARGURA_REM = 104.5; // 1672 / 16
const PALCO_ALTURA_REM = 58.8125; // 941 / 16

const raiz = process.cwd();
const ler = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8').replace(/\r\n/g, '\n');
const css = ler('src', 'web', 'style.css');
const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');

/** Corpo da primeira regra com este seletor, no nível de cima do arquivo. */
function regra(seletor: string): string {
  const i = css.indexOf(`\n${seletor} {`);
  expect(i, `regra ${seletor} não encontrada`).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf('}', i));
}

describe('palco do tamanho da imagem, preto em volta (R-LAYOUT-5)', () => {
  it('a imagem do login mede o que o palco assume (1672 x 941)', () => {
    const b = readFileSync(join(raiz, 'public', 'assets', 'login-bg.webp'));
    expect(b.toString('ascii', 12, 16)).toBe('VP8X');
    expect((1 + b.readUIntLE(24, 3)) / 16).toBe(PALCO_LARGURA_REM);
    expect((1 + b.readUIntLE(27, 3)) / 16).toBe(PALCO_ALTURA_REM);
  });

  it('o fundo da página é preto puro, sem degradê (o fora do palco é só preto)', () => {
    const body = regra('body');
    expect(body).toMatch(/background-color:\s*#000\b/);
    expect(body).not.toMatch(/background-image/);
  });

  it('o jogo (#app) tem a largura do palco, centralizado, sem borda nem arredondamento', () => {
    const app = regra('#app');
    expect(app).toContain(`max-width: ${PALCO_LARGURA_REM}rem`);
    expect(app).toContain('margin: 0 auto');
    expect(app).toContain('min-height: 100vh');
    expect(app).not.toMatch(/border/);
    expect(app).not.toMatch(/box-shadow/);
  });

  it('o login: tela preta cobrindo tudo e a imagem num palco da proporção do login, centralizado, sem borda', () => {
    const tela = regra('.auth-screen');
    expect(tela).toContain('inset: 0');
    expect(tela).toMatch(/background:\s*#000/);
    expect(tela).not.toMatch(/padding/);
    const frame = regra('.auth-frame');
    expect(frame).toContain(`min(100%, ${PALCO_LARGURA_REM}rem)`);
    expect(frame).toContain(`min(100%, ${PALCO_ALTURA_REM}rem)`);
    expect(frame).toContain('margin: auto');
    expect(frame).toContain('login-bg.webp');
    expect(frame).not.toMatch(/border-radius/);
    expect(frame).not.toMatch(/border:/);
  });

  it('as 8 abas ficam sempre numa linha só (tudo proporcional: se cabe no palco, cabe em qualquer tela)', () => {
    expect(css).toMatch(/\.game-main-nav\s*\{[^}]*flex-wrap:\s*nowrap/);
  });
});

describe('tela 100% proporcional: nada em px fixo (R-LAYOUT-6)', () => {
  it('a raiz define 1rem como 1/104,5 do palco, e o palco é a maior área 16:9 que cabe na tela', () => {
    expect(css).toMatch(/--stage-w:\s*min\(100vw,\s*177\.68vh\)/);
    expect(css).toMatch(/html\s*\{\s*font-size:\s*calc\(var\(--stage-w\)\s*\/\s*104\.5\)/);
  });

  it('o CSS não tem nenhum tamanho em px', () => {
    const achados = semComentarios(css).match(/-?\d*\.?\d+px\b/g) ?? [];
    expect(achados).toEqual([]);
  });

  it('o layout não depende da largura da tela: sem media query por largura', () => {
    const achados = css.match(/@media[^{]*(min|max)-(width|height)[^{]*/g) ?? [];
    expect(achados).toEqual([]);
  });

  it('o HTML e o código do jogo não têm tamanhos em px nos estilos', () => {
    for (const arq of [['index.html'], ['src', 'web', 'main.ts'], ['src', 'web', 'authUi.ts'], ['src', 'web', 'onboarding.ts']]) {
      const txt = ler(...arq).replace(/\/\/.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '');
      const achados = txt.match(/[\d.]+px\b/g) ?? [];
      expect(achados, arq.join('/')).toEqual([]);
    }
  });

  it('o boneco (SVG) é dimensionado em rem, não em px', () => {
    const p = ler('src', 'web', 'paperdoll.ts');
    expect(p).toContain('style="width:${width}rem;height:${height}rem"');
    expect(p).not.toMatch(/width="\$\{width\}"/);
  });
});

describe('Mala: 2 fileiras de 5 slots, slot 50% maior (R-MALA-1)', () => {
  it('grade de 5 colunas com slot de 6,86rem (73 px antigos x 1,5 = 110 px no palco de 1672)', () => {
    expect(css).toMatch(/\.inventory-slots-grid\s*\{\s*grid-template-columns:\s*repeat\(5,\s*6\.86rem\)/);
  });

  it('o painel se chama "Mala" na tela', () => {
    const html = ler('index.html');
    expect(html).toMatch(/class="sub-tab active"[^>]*data-pane="mala">Mala</); // a Mala é a primeira aba da subpasta do perfil (R-LAYOUT-10)
    expect(html).not.toContain('inv-capacity-count'); // sem cabeçalho nem contador de slots
    expect(html).not.toContain('Mochila');
  });
});
