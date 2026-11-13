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

  it('Estilo 2 (R-UI-2): topo estilo GGG, Ficha com atributos embaixo do card, Mala horizontal, barra com rótulos, área livre de duelo', () => {
    const html = readFileSync('index.html', 'utf8');
    for (const id of ['hud-energy-fill', 'hud-energy-timer', 'duel-free']) expect(html).toContain(`id="${id}"`);
    expect((html.match(/data-label="/g) ?? []).length).toBe(10);
    // card grande no canto, sem faixa de fundo; nome, nível e XP ao lado do card; recursos no centro
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-header \{[^}]*display: grid;[^}]*background: none;/);
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-avatar-thumb \{ position: absolute; left: 1\.1rem; top: 0\.2rem; width: 8\.4rem; height: 9\.2rem;/);
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-player-info \{ position: absolute; left: 10\.2rem;/);
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-resources \{ grid-column: 2; justify-self: center;/);
    // Ficha: 3 colunas (atributos | arma | equipamento) e Mala horizontal + área livre; sem abas nem detalhes do item
    expect(css).toMatch(/html\[data-ui="v2"\] #app\[data-tab="perfil"\] \.stack \{[^}]*grid-template-columns: 560fr 340fr 840fr 320fr;/);
    expect(css).toMatch(/\.sub-tabs, [^{]*\.inv-item-details-box[^{]*\{ display: none !important; \}/);
    expect(css).toMatch(/\.profile-stats-panel\.compact \{ grid-column: 1; grid-row: 1; margin-top: 2\.8rem;/);
    expect(css).toMatch(/\.profile-weapon-panel \{ grid-column: 2; grid-row: 1;/);
    expect(css).toMatch(/\.inventory-slots-grid \{ grid-column: 1 \/ 3; grid-row: 2; display: grid; grid-template-columns: repeat\(5,/);
    // o card do retrato sai da Ficha (a foto está no topo), mas o botão de personalizar fica sobre o card
    expect(css).toMatch(/\.profile-doll-panel, [^{]*\.profile-avatar-frame \{ display: contents; \}/);
    expect(css).toMatch(/\.avatar-edit-btn \{ position: absolute;/);
    expect(main).toContain("setProperty('--xp'");
    expect(main).toContain("getElementById('hud-energy-fill')");
  });

  it('tamanho (R-UI-3): no Estilo 2 o jogo todo fica menor em proporção (zoom) e o palco se alarga na mesma medida', () => {
    expect(css).toMatch(/html\[data-ui="v2"\] #app \{ zoom: 0\.86; max-width: calc\(104\.5rem \/ 0\.86\); height: calc\(var\(--stage-w\) \* 9 \/ 16 \/ 0\.86\); \}/);
  });

  it('simetria (R-UI-4): coluna central de 100 rem, conteúdo da Ficha centralizado com slots menores, card maior na Ficha', () => {
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-header, html\[data-ui="v2"\] \.shell \{ width: 100%; max-width: 100rem; margin-left: auto; margin-right: auto; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.hud-avatar-thumb \{ left: 8\.8rem; top: 1\.4rem; width: 13\.8rem; height: 16rem; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.stack \{ grid-template-columns: 30rem 14rem 36rem; grid-template-rows: max-content max-content; justify-content: center;/);
    expect(css).toMatch(/\.profile-stats-panel\.compact \{ margin-top: 0; height: auto; align-self: end; padding: 0 0\.7rem;/);
    expect(css).toMatch(/\.attr-compact-list \{ height: auto; grid-template-rows: repeat\(4, 2\.3rem\); \}/);
    expect(css).toMatch(/\.equipped-slots-grid \{[^}]*grid-template-rows: repeat\(2, minmax\(0, 1fr\)\);/); // os slots do Equipamento preenchem a altura do painel
    expect(css).toMatch(/\.inventory-slots-grid \{[^}]*grid-auto-rows: 6\.6rem;/);
  });

  it('brasão de defesa acima da arma e Mala com 4 fileiras (R-UI-5, R-MALA-11)', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toMatch(/<div class="profile-weapon-panel">\s*<div class="defense-crest" id="defense-crest"/);
    expect(html).toContain('id="defense-val"');
    expect(css).toMatch(/\.defense-crest, \.inv-slot\.locked-soon \{ display: none; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.defense-crest \{ position: relative; display: grid; grid-template-columns: 1fr 1fr; box-sizing: border-box; width: 100%; height: 6\.6rem;/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.inv-slot\.locked-soon \{ display: flex;/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.duel-free \{ height: 31\.8rem; \}/);
    // a 4ª fileira é só desenho: o clique de compra não vale para ela
    expect(main).toContain('const BAG_DISPLAY_SLOTS = 20;');
    expect(main).toContain(".inv-slot.locked:not(.locked-soon)");
  });

  it('Ficha: card maior; nome, nível e XP ao lado do card, dentro da pasta; atributos descem até perto da Mala', () => {
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.hud-player-info \{ left: 25rem; top: 11\.4rem; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.folder-tab \{ display: none; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.avatar-edit-btn \{ left: 20\.1rem; top: 9\.3rem; \}/);
  });

  it('Mala com título, brasão em caixa própria acima da arma (R-UI-5)', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toMatch(/<div class="weapon-box">\s*<div class="panel-header-banner"><h3>Arma<\/h3><\/div>/);
    expect(css).toMatch(/\.inventory-slots-grid::before \{ content: "MALA"; grid-column: 1 \/ -1;/);
    expect(css).toMatch(/\.weapon-box \{ display: contents; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.profile-weapon-panel \{ display: flex; flex-direction: column; gap: 0\.9rem;/);
  });

  it('títulos padronizados (Arma, Equipamento, Mala): mesma fonte, tamanho, espaçamento e fio pontilhado', () => {
    expect(css).toMatch(/\.inventory-slots-grid::before \{[^}]*border-bottom: 0\.0723rem dotted var\(--line\);[^}]*font-size: 1\.1rem;[^}]*letter-spacing: 0\.05rem; text-transform: uppercase;/);
  });

  it('brasão em 2 metades (classe | defesa) e a Mala em painel igual ao do Equipamento', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('id="class-icon-use"');
    for (const c of ['carrasco', 'malandro', 'muralha']) expect(html).toContain(`id="cls-${c}"`);
    expect(css).toMatch(/\.crest-class \{ border-right: 0\.0723rem dotted var\(--line\);/);
    expect(css).toMatch(/\.inventory-slots-grid \{ box-sizing: border-box; padding: 0\.5rem 0\.9rem; background: var\(--paper-2\); border: 0\.0723rem solid var\(--line\);/);
    expect(main).toContain("getElementById('class-icon-use')");
  });

  it('Ficha sem o título da pasta (layout sobe) e título da Arma com respiro menor', () => {
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.shell \{ padding-top: 0\.6rem; \}/);
    expect(css).toMatch(/\.weapon-box \.panel-header-banner \{ padding-bottom: 0\.2rem; margin-bottom: 0\.4rem; \}/);
  });

  it('todos os slots são 4:3 (equipamento, Mala e arma) e a área livre acompanha a altura da Mala', () => {
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.stack \{ grid-template-columns: 30rem 14rem 45rem; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.gear-slot \{ aspect-ratio: 4 \/ 3; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.inv-slot \{ aspect-ratio: 4 \/ 3; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.weapon-slot \{ aspect-ratio: 4 \/ 3; height: auto; box-sizing: border-box; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.duel-free \{ height: auto; align-self: stretch; \}/);
  });
});
