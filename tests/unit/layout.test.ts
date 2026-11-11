import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Regra do fundador (R-LAYOUT-1, 2026-11-11): no desktop o jogo não ocupa a tela toda;
// há uma margem preta padrão, em %, igual para todos os desktops.
const css = readFileSync(join(process.cwd(), 'src', 'web', 'style.css'), 'utf8');

describe('margem preta do desktop (R-LAYOUT-1)', () => {
  it('a margem lateral é definida em % por uma variável única', () => {
    expect(css).toMatch(/--game-margin:\s*6%;/);
  });

  it('a margem vertical também é em %', () => {
    expect(css).toMatch(/--game-margin-v:\s*2%;/);
  });

  it('vale a partir de 1024 px (desktop) e usa a variável no #app', () => {
    const bloco = css.slice(css.indexOf('@media (min-width: 1024px)'));
    expect(bloco).toContain('width: calc(100% - 2 * var(--game-margin))');
    expect(bloco).toContain('margin: var(--game-margin-v) auto');
    expect(bloco).toMatch(/body\s*\{[^}]*background-color:\s*#000/);
  });

  it('a tela de login também usa a mesma margem (moldura da imagem)', () => {
    const idx = css.indexOf('.auth-frame {');
    expect(idx).toBeGreaterThan(-1);
    const bloco = css.slice(css.indexOf('@media (min-width: 1024px)', idx));
    expect(bloco).toContain('padding: var(--game-margin-v) var(--game-margin)');
    // a imagem fica na moldura, não na tela inteira
    const tela = css.slice(css.indexOf('.auth-screen {'), css.indexOf('.auth-frame {'));
    expect(tela).not.toContain('login-bg.webp');
    expect(css.slice(css.indexOf('.auth-frame {'))).toContain("login-bg.webp");
  });

  it('não há limite fixo de largura no #app do desktop (a margem é sempre em %)', () => {
    const bloco = css.slice(css.indexOf('@media (min-width: 1024px)'));
    expect(bloco).toMatch(/max-width:\s*none/);
  });
});
