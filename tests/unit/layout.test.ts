import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// R-LAYOUT-5 (fundador, 2026-11-11): o "palco" do jogo e do login tem no máximo o tamanho da
// imagem do login (1672 x 941 px). Em telas menores ocupa a tela toda; em telas maiores fica
// centralizado e o resto é PRETO, sem borda nem moldura. (Revoga a margem de 6% e o limite de 1440 px.)
const PALCO_LARGURA = 1672;
const PALCO_ALTURA = 941;

// o arquivo usa quebras de linha do Windows (CRLF): normaliza para os testes
const css = readFileSync(join(process.cwd(), 'src', 'web', 'style.css'), 'utf8').replace(/\r\n/g, '\n');

/** Corpo da primeira regra com este seletor, no nível de cima do arquivo. */
function regra(seletor: string): string {
  const i = css.indexOf(`\n${seletor} {`);
  expect(i, `regra ${seletor} não encontrada`).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf('}', i));
}

describe('palco do tamanho da imagem, preto em volta (R-LAYOUT-5)', () => {
  it('a imagem do login mede o que o palco assume (1672 x 941)', () => {
    const b = readFileSync(join(process.cwd(), 'public', 'assets', 'login-bg.webp'));
    expect(b.toString('ascii', 12, 16)).toBe('VP8X');
    expect(1 + b.readUIntLE(24, 3)).toBe(PALCO_LARGURA);
    expect(1 + b.readUIntLE(27, 3)).toBe(PALCO_ALTURA);
  });

  it('não existe mais a variável de margem preta nem o limite de 1440 px', () => {
    expect(css).not.toContain('--game-margin');
    expect(regra('#app')).not.toContain('1440px');
  });

  it('o fundo da página é preto puro, sem degradê (o fora do palco é só preto)', () => {
    const body = regra('body');
    expect(body).toMatch(/background-color:\s*#000\b/);
    expect(body).not.toMatch(/background-image/);
  });

  it('o jogo (#app) tem no máximo a largura da imagem, centralizado, sem borda nem arredondamento', () => {
    const app = regra('#app');
    expect(app).toContain(`max-width: ${PALCO_LARGURA}px`);
    expect(app).toContain('margin: 0 auto');
    expect(app).toContain('min-height: 100vh');
    expect(app).not.toMatch(/border/);
    expect(app).not.toMatch(/box-shadow/);
  });

  it('o login: tela preta cobrindo tudo e a imagem num palco de no máximo 1672 x 941, centralizado, sem borda', () => {
    const tela = regra('.auth-screen');
    expect(tela).toContain('inset: 0');
    expect(tela).toMatch(/background:\s*#000/);
    expect(tela).not.toMatch(/padding/);
    const frame = regra('.auth-frame');
    expect(frame).toContain(`min(100%, ${PALCO_LARGURA}px)`);
    expect(frame).toContain(`min(100%, ${PALCO_ALTURA}px)`);
    expect(frame).toContain('margin: auto');
    expect(frame).toContain('login-bg.webp');
    expect(frame).not.toMatch(/border-radius/);
    expect(frame).not.toMatch(/border:/);
  });

  it('nenhuma regra de desktop mexe no #app, no body ou na tela de login', () => {
    let pos = 0;
    let blocos = 0;
    while ((pos = css.indexOf('@media (min-width: 1024px)', pos)) !== -1) {
      let fim = css.indexOf('\n}\n', pos);
      if (fim === -1) fim = css.length;
      blocos += 1;
      expect(blocos).toBeLessThan(50); // trava de segurança contra laço infinito
      const bloco = css.slice(pos, fim);
      expect(bloco).not.toMatch(/(^|\s)#app\s*\{/);
      expect(bloco).not.toMatch(/(^|\s)body\s*\{/);
      expect(bloco).not.toContain('.auth-screen');
      expect(bloco).not.toContain('.auth-frame');
      pos = fim + 1;
    }
  });

  it('as 8 abas quebram em 2 linhas no desktop (não somem atrás de rolagem)', () => {
    const i = css.indexOf('@media (min-width: 1024px)');
    expect(i).toBeGreaterThan(-1);
    const bloco = css.slice(i, css.indexOf('\n}\n', i));
    expect(bloco).toContain('.game-main-nav');
    expect(bloco).toContain('flex-wrap: wrap');
  });
});
