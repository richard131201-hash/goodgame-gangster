import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { chooseFicha } from '../../src/web/fichaNova.js';

const css = readFileSync('src/web/style.css', 'utf8');
const main = readFileSync('src/web/main.ts', 'utf8');

describe('Ficha nova em teste (R-FICHA-ARTE-1)', () => {
  it('só liga com ?ficha=nova; sem isso, a Ficha antiga continua', () => {
    expect(chooseFicha('', null)).toBe('antiga');
    expect(chooseFicha('?ficha=nova', null)).toBe('nova');
    expect(chooseFicha('', 'nova')).toBe('nova'); // fica guardado no navegador
    expect(chooseFicha('?ficha=antiga', 'nova')).toBe('antiga'); // desliga
    expect(chooseFicha('?ficha=qualquer', 'nova')).toBe('nova'); // valor desconhecido não muda
    expect(chooseFicha('?x=1', 'lixo')).toBe('antiga');
  });

  it('as imagens da moldura existem e o jogo liga o modo de teste', () => {
    for (const f of ['moldura', 'slot-vazio', 'papel']) expect(existsSync(`public/assets/ficha/${f}.webp`)).toBe(true);
    expect(main).toContain('initFichaNova();');
  });

  it('todo o visual novo fica atrás de html[data-ficha="nova"] na aba Ficha (nada muda na antiga)', () => {
    const i = css.indexOf('FICHA NOVA, EM TESTE');
    expect(i).toBeGreaterThan(0);
    const bloco = css.slice(i);
    const regras = bloco.split('\n').filter(l => l.includes('{') && !l.trim().startsWith('/*') && !l.trim().startsWith('@'));
    expect(regras.length).toBeGreaterThan(20);
    for (const l of regras) expect(l.startsWith('html[data-ficha="nova"] #app[data-tab="perfil"]')).toBe(true);
    expect(bloco).toContain('aspect-ratio: 2000 / 1116');
  });

  it('o desenho fantasma some quando há item: slot cheio recebe o recorte de papel vazio', () => {
    expect(css).toMatch(/\.gear-slot\.filled::before \{[^}]*slot-vazio\.webp/);
    expect(css).toMatch(/\.inv-slot:nth-child\(n\+11\):not\(\.locked\)::before \{[^}]*slot-vazio\.webp/);
  });
});
