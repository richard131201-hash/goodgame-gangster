import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// R-LAYOUT-5 (fundador, 2026-11-11): o jogo e o login ocupam a tela inteira, SEM margem preta
// nem moldura. Isto revoga a R-LAYOUT-1 (margem de 6%). O teste impede a margem de voltar sem querer.
// o arquivo usa quebras de linha do Windows (CRLF): normaliza para os testes
const css = readFileSync(join(process.cwd(), 'src', 'web', 'style.css'), 'utf8').replace(/\r\n/g, '\n');

/** Corpo da primeira regra com este seletor, no nível de cima do arquivo. */
function regra(seletor: string): string {
  const i = css.indexOf(`\n${seletor} {`);
  expect(i, `regra ${seletor} não encontrada`).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf('}', i));
}

describe('tela cheia, sem margem preta (R-LAYOUT-5)', () => {
  it('não existe mais a variável de margem preta', () => {
    expect(css).not.toContain('--game-margin');
  });

  it('o jogo (#app) ocupa a largura como antes: centralizado, sem largura em % nem moldura', () => {
    const app = regra('#app');
    expect(app).toContain('max-width: 1440px');
    expect(app).toContain('margin: 0 auto');
    expect(app).not.toMatch(/calc\(100%/);
    expect(app).not.toMatch(/border-radius/);
    expect(app).not.toMatch(/box-shadow/);
  });

  it('nenhuma regra de desktop mexe no #app, no body ou na tela de login', () => {
    // todos os blocos @media (min-width: 1024px)
    let pos = 0;
    let blocos = 0;
    while ((pos = css.indexOf('@media (min-width: 1024px)', pos)) !== -1) {
      let fim = css.indexOf('\n}\n', pos);
      if (fim === -1) fim = css.length; // bloco no fim do arquivo
      blocos += 1;
      expect(blocos).toBeLessThan(50); // trava de segurança contra laço infinito
      const bloco = css.slice(pos, fim);
      expect(bloco).not.toMatch(/(^|\s)#app\s*\{/);
      expect(bloco).not.toMatch(/(^|\s)body\s*\{/);
      expect(bloco).not.toContain('.auth-screen');
      expect(bloco).not.toContain('.auth-frame');
      pos = fim + 1; // sempre avança
    }
  });

  it('o login cobre a tela inteira, e a imagem fica na moldura interna sem borda nem arredondamento', () => {
    const tela = regra('.auth-screen');
    expect(tela).toContain('inset: 0');
    expect(tela).not.toMatch(/padding/);
    const frame = regra('.auth-frame');
    expect(frame).toContain('login-bg.webp');
    expect(frame).not.toMatch(/border-radius/);
    expect(frame).not.toMatch(/border:/);
  });

  it('as 8 abas quebram em 2 linhas no desktop (não somem atrás de rolagem)', () => {
    const i = css.indexOf('@media (min-width: 1024px)');
    expect(i).toBeGreaterThan(-1);
    const bloco = css.slice(i, css.indexOf('\n}\n', i));
    expect(bloco).toContain('.game-main-nav');
    expect(bloco).toContain('flex-wrap: wrap');
  });
});
