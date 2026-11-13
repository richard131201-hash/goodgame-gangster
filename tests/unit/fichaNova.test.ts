import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { chooseUi } from '../../src/web/fichaNova.js';

const css = readFileSync('src/web/style.css', 'utf8');
const main = readFileSync('src/web/main.ts', 'utf8');

describe('Ficha nova em teste (R-FICHA-ARTE-1)', () => {
  it('o Estilo 2 (v2) é o padrão; ?ui=ia e ?ui=antiga trocam, e o antigo ?ficha= ainda funciona', () => {
    expect(chooseUi('', null)).toBe('v2');
    expect(chooseUi('', 'lixo')).toBe('v2');
    expect(chooseUi('?ui=ia', null)).toBe('ia');
    expect(chooseUi('?ui=antiga', null)).toBe('antiga');
    expect(chooseUi('?ficha=nova', null)).toBe('ia');
    expect(chooseUi('?ficha=antiga', 'v2')).toBe('antiga');
    expect(chooseUi('', 'antiga')).toBe('antiga'); // escolha guardada de quem comparou
    expect(chooseUi('?ui=v2', 'antiga')).toBe('v2'); // religa
    expect(chooseUi('?ui=qualquer', 'ia')).toBe('ia'); // valor desconhecido não muda
  });

  it('as imagens da moldura existem e o jogo liga o modo de teste', () => {
    for (const f of ['moldura', 'slot-vazio', 'papel']) expect(existsSync(`public/assets/ficha/${f}.webp`)).toBe(true);
    expect(main).toContain('initUi();');
  });

  it('todo o visual novo fica atrás de html[data-ficha="nova"] na aba Ficha (nada muda na antiga)', () => {
    const i = css.indexOf('FICHA NOVA, EM TESTE');
    expect(i).toBeGreaterThan(0);
    const fim = css.indexOf('BARRA DE BOTÕES FLUTUANTE', i);
    const bloco = css.slice(i, fim > 0 ? fim : undefined);
    const regras = bloco.split('\n').filter(l => l.includes('{') && !l.trim().startsWith('/*') && !l.trim().startsWith('@'));
    expect(regras.length).toBeGreaterThan(20);
    for (const l of regras) expect(l.startsWith('html[data-ficha="nova"] #app[data-tab="perfil"]')).toBe(true);
    expect(bloco).toContain('aspect-ratio: 2000 / 1116');
  });

  it('o desenho fantasma some quando há item: slot cheio recebe o recorte de papel vazio', () => {
    expect(css).toMatch(/\.gear-slot\.filled::before \{[^}]*slot-vazio\.webp/);
    expect(css).toMatch(/\.inv-slot:nth-child\(n\+11\):not\(\.locked\)::before \{[^}]*slot-vazio\.webp/);
  });

  it('atributos: a seta fica no lugar (invisível) para o jogo alternar valor e efeito; o clipe e o VAZIO voltam', () => {
    expect(css).toMatch(/\.attr-c-arrow \{ display: block; visibility: hidden; position: absolute;/);
    expect(css).not.toMatch(/\.attr-c-arrow[^{]*\{[^}]*display: none/);
    expect(css).toMatch(/\.doll-clip \{ display: block; position: absolute;[^}]*z-index: 7;/);
    expect(css).toMatch(/\.inv-slot\.empty::after \{ color: #6b4a22;/);
  });

  it('Estilo 2 (R-UI-2): topo com retrato e energia comprida, Ficha em 3 colunas sem abas, barra com rótulos, área livre de duelo', () => {
    const html = readFileSync('index.html', 'utf8');
    for (const id of ['hud-energy-fill', 'hud-energy-timer', 'duel-free']) expect(html).toContain(`id="${id}"`);
    expect((html.match(/data-label="/g) ?? []).length).toBe(10);
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-header \{ display: grid;/);
    expect(css).toMatch(/html\[data-ui="v2"\] #app\[data-tab="perfil"\] \.stack \{[^}]*grid-template-columns: 300fr 960fr 840fr;/);
    // sem abas na Mala e sem o painel de detalhes (saíram por ora)
    expect(css).toMatch(/\.sub-tabs, [^{]*\.inv-item-details-box \{ display: none !important; \}/);
    // atributos ao lado do retrato (coluna 2) e arma embaixo do retrato (coluna 1, linha 2)
    expect(css).toMatch(/\.profile-stats-panel\.compact \{ grid-column: 2; grid-row: 1;/);
    expect(css).toMatch(/\.profile-weapon-panel \{ grid-column: 1; grid-row: 2;/);
    expect(css).toMatch(/\.inventory-slots-grid \{ grid-column: 2; grid-row: 2; display: grid; grid-template-columns: repeat\(5,/);
    // o perfil no canto (foto pequena, nível e XP) vale nas outras abas; na Ficha a foto sai, porque o retrato já está no card
    expect(css).toMatch(/html\[data-ui="v2"\] #app\[data-tab="perfil"\] \.hud-avatar-thumb \{ display: none; \}/);
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-avatar-thumb \{ width: 5rem; height: 5\.7rem;/);
    expect(main).toContain("setProperty('--xp'");
    expect(main).toContain("getElementById('hud-energy-fill')");
  });
});
