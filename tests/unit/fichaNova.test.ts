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

  it('cash com espaço para 99.999.999, nome em papel atrás do card e carimbo inclinado para baixo (R-UI-6)', () => {
    expect(css).toMatch(/html\[data-ui="v2"\] \.res-card\.res-cash \{ min-width: 13\.5rem; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.hud-player-info \{ left: 15\.9rem; top: 8\.8rem; width: 16\.2rem; height: 6\.5rem;[^}]*background: linear-gradient\(#cdb98c, #b9a276\);/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.folder-stamp \{ transform: rotate\(9deg\); top: 1rem; right: 1\.6rem; \}/);
  });

  it('papel só com o nome, XP retangular e nível em selo (R-UI-7)', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).not.toContain('id="hud-style-badge"');
    expect(html).toContain('id="seal-nivel"');
    expect(html).toMatch(/<div class="hud-lvl-circle" title="Nível">\s*<svg class="seal-bg"[^>]*><use href="#seal-nivel"\/><\/svg>\s*<span class="seal-num" id="hud-lvl">/);
    expect(main).not.toContain("getElementById('hud-style-badge')");
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-xp-track \{ flex: 1; min-width: 0; height: 1\.25rem; border-radius: 0\.3rem; \}/);
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-lvl-circle \{ position: relative; flex: none; width: 2\.7rem; height: 2\.7rem;/);
  });

  it('aba da família no topo do papel, com "Sem família" quando não há (R-UI-8)', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toMatch(/<div class="hud-player-info">\s*<span class="hud-family-tab no-family" id="hud-family"[^>]*>SEM FAMÍLIA<\/span>/);
    expect(main).toContain("getElementById('hud-family')");
    expect(main).toContain("'Sem família'");
    expect(css).toMatch(/\.hud-family-tab \{ display: none; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.hud-family-tab \{ display: block; position: absolute; left: 3\.2rem; top: -2rem; box-sizing: border-box; min-width: 10rem;/);
  });

  it('controle único de botões do topo, ouro maior e Ficha sem fundo marrom (R-UI-9)', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toMatch(/<div class="hud-system-actions">(?:\s*<button[^>]*class="hud-btn-icon[^"]*"[^>]*>[\s\S]*?<\/button>){5}\s*<\/div>/);
    expect(html).not.toContain('hud-btn-outline');
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-system-actions \{ gap: 0; padding: 0\.25rem; background: var\(--paper-2\);/);
    expect(css).toMatch(/html\[data-ui="v2"\] \.hud-system-actions \.hud-btn-icon \{ width: 2\.4rem; height: 2\.4rem;/);
    expect(css).toMatch(/html\[data-ui="v2"\] \.res-card\.res-gold \{ min-width: 14rem;/);
    // metades iguais (30 + 14 + 1,2 = 45,2) e sem fundo/borda/costura da pasta na Ficha
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.stack \{ grid-template-columns: 30rem 14rem 45\.2rem; background: none; border: 0; border-radius: 0; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.stack::after \{ display: none; \}/);
  });

  it('controle e carimbo alinhados à borda do conteúdo, ouro só mais largo e fundo de teste na Ficha (R-UI-10)', () => {
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.hud-system-actions \{ margin-right: 3\.1rem; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.folder-stamp \{ right: 4\.4rem; \}/);
    expect(css).toMatch(/html\[data-ui="v2"\] \.res-card\.res-gold \{ min-width: 14rem; \}/);
    expect(css).not.toMatch(/\.res-gold \.res-img \{ width: 2\.6rem/);
    expect(css).toMatch(/html\[data-ui="v2"\] #app\[data-tab="perfil"\] \{ background-image: linear-gradient\(.*?\), url\("\/assets\/login-bg\.webp"\);/);
  });

  it('botão Convidar amigo no controle do topo (R-UI-11)', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('id="invite-friend-btn"');
    expect(html).toContain('id="i-invite"');
    expect(main).toContain("getElementById('invite-friend-btn')");
    expect(main).toContain('navigator.clipboard');
  });

  it('no Ouro, o + fica colado na direita e a largura extra é para os dígitos (R-UI-13)', () => {
    expect(css).toMatch(/\.res-card\.res-gold \.res-details \{ flex: 1 1 auto; min-width: 0; \}/);
    expect(css).toMatch(/\.res-card\.res-gold \.res-gold-plus \{ margin-left: auto; \}/);
  });

  it('Cash e Ouro com ponto de milhar em pt-BR e cards um pouco mais largos (R-UI-14)', () => {
    expect(main).toContain("`$${p.cash.toLocaleString('pt-BR')}`");
    expect(main).toContain("p.gold.toLocaleString('pt-BR')");
  });

  it('seção A com a arte de folhas: retrato, nota, classe/defesa, arma e atributos (R-UI-16)', () => {
    for (const n of ['retrato', 'nota', 'placa', 'arma', 'cartao']) expect(existsSync(`public/assets/ficha/a-${n}.webp`)).toBe(true);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.hud-avatar-thumb \{ box-sizing: border-box; padding: 1\.7rem 1\.5rem 3\.3rem 2\.1rem;/);
    expect(css).toMatch(/\.hud-player-info::before \{ left: 0; right: 0; top: -1\.9rem; bottom: 0; background-image: url\("\/assets\/ficha\/a-nota\.webp"\); \}/);
    expect(css).toMatch(/\.defense-crest::before \{ inset: 0; background-image: url\("\/assets\/ficha\/a-placa\.webp"\); \}/);
    expect(css).toMatch(/\.weapon-box \{ position: relative; padding: 0; background: none; border: 0; border-radius: 0; aspect-ratio: 1840 \/ 1709; \}/);
    expect(css).toMatch(/\.profile-stats-panel\.compact \{ aspect-ratio: 1262 \/ 426; background: none; border: 0; padding: 0; \}/);
  });

  it('seção B (equipamento) com a folha de 8 molduras e o desenho fantasma de cada item (R-UI-17)', () => {
    expect(existsSync('public/assets/ficha/b-equipamento.webp')).toBe(true);
    expect(css).toMatch(/\.profile-gear-panel::before \{ content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: url\("\/assets\/ficha\/b-equipamento\.webp"\) 0 0 \/ 100% 100% no-repeat;/);
    expect(css).toMatch(/\.equipped-slots-grid \{ position: absolute; left: 2\.5%; right: 2\.25%; top: 15\.2%; bottom: 3\.8%; display: grid; grid-template-columns: repeat\(4, 1fr\); grid-template-rows: 39\.3fr 37\.8fr; column-gap: 2\.35%; row-gap: 3\.9%; \}/);
    expect(css).toMatch(/\.gear-slot \.gear-ico\.ghost \{ display: none; \}/);
    expect(css).toMatch(/\.gear-slot \.slot-badge \{ display: none; \}/);
  });

  it('equipamento na proporção exata da folha e mais respiro para a seção de baixo (R-UI-17)', () => {
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.profile-gear-panel \{ aspect-ratio: 2000 \/ 927; align-self: start; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.profile-weapon-panel \{ align-self: stretch; justify-content: space-between; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.stack \{ row-gap: 1\.3rem; \}/);
  });

  it('seção C (Mala) com a folha de 20 molduras e o cadeado que abre ao passar o mouse (R-UI-18)', () => {
    for (const n of ['c-mala', 'c-cadeado-fechado', 'c-cadeado-aberto']) expect(existsSync(`public/assets/ficha/${n}.webp`)).toBe(true);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.inventory-slots-grid \{ position: relative; isolation: isolate; box-sizing: border-box; aspect-ratio: 1719 \/ 1079;/);
    expect(css).toMatch(/\.inventory-slots-grid::after \{ content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: url\("\/assets\/ficha\/c-mala\.webp"\)/);
    expect(css).toMatch(/\.inv-slot\.locked::before \{ content: ""; position: absolute; left: 30\.64%; top: 9\.91%; width: 38\.38%; height: 73\.42%; background: url\("\/assets\/ficha\/c-cadeado-aberto\.webp"\)/);
    expect(css).toMatch(/\.inv-slot\.empty::after \{ display: none; \}/);
    expect(css).toContain('@keyframes lock-pop');
  });

  it('Mala maior, em proporção, até perto da barra de abas; a área de duelo cede o espaço (R-UI-18)', () => {
    expect(css).toMatch(/\.inventory-slots-grid \{ --ms: 1\.09; width: calc\(100% \+ 4\.07rem\);/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.duel-free \{ width: calc\(100% - 4\.07rem\); justify-self: end; \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.stack \{ align-content: start; padding-top: 1\.97rem; \}/);
  });

  it('itens da Mala sem fundo: colados em cima da folha, com sombra; malinha só nos vazios (R-UI-18)', () => {
    expect(existsSync('public/assets/ficha/c-mala-vazia.webp')).toBe(true);
    expect(css).toMatch(/\.inv-slot\.empty \{ background: url\("\/assets\/ficha\/c-mala-vazia\.webp"\) 49\.3% 59\.5% \/ 51\.52% 62\.16% no-repeat; \}/);
    expect(css).toMatch(/\.inv-slot\[data-inv-idx\] > \* \{ position: relative; transform: rotate\(var\(--tilt, -2deg\)\); filter: drop-shadow\(0 0 0\.07rem/);
    expect(css).not.toMatch(/\.inv-slot\[data-inv-idx\]::before \{ content: ""; position: absolute; inset: 6% 5\.5%; background: #efe2c4;/);
  });

  it('Mala com linhas e colunas fixas (não mexe com itens), item centralizado e sem movimento ao passar o mouse (R-UI-18)', () => {
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.inventory-slots-grid \{ grid-template-columns: repeat\(5, minmax\(0, 1fr\)\); grid-template-rows: repeat\(4, minmax\(0, 1fr\)\); \}/);
    expect(css).toMatch(/#app\[data-tab="perfil"\] \.inv-slot > \.inv-art, [^{]*\.inv-slot > img \{ width: 100%; height: 100%;/);
    expect(css).not.toMatch(/\.inv-slot\[data-inv-idx\]:hover > \*/);
  });

  it('folha da Arma com a pistola de placeholder, que some com arma equipada (R-UI-19)', () => {
    for (const n of ['a-arma', 'a-arma-vazia']) expect(existsSync(`public/assets/ficha/${n}.webp`)).toBe(true);
    expect(css).toMatch(/\.weapon-box \{ position: relative; padding: 0; background: none; border: 0; border-radius: 0; aspect-ratio: 1840 \/ 1709; \}/);
    expect(css).toMatch(/\.weapon-box \.weapon-slot \{ position: absolute; left: 7\.17%; right: 7\.17%; top: 15\.68%; bottom: 9\.6%;/);
    expect(css).toMatch(/\.weapon-slot-art\.empty-weapon \{ background: url\("\/assets\/ficha\/a-arma-vazia\.webp"\) 51% 40\.7% \/ 68\.02% 56\.3% no-repeat;/);
    expect(css).toMatch(/\.weapon-slot-art\.empty-weapon > \* \{ display: none; \}/);
  });
});
