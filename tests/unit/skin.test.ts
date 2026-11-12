import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_SKIN, FOLDER_HEADERS, SKIN_KEY, applySkin, readSkin, toggleSkin } from '../../src/web/skin.js';
import { ITEM_SLOTS } from '../../src/shared/itemRoll.js';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('tema da pasta: couro e dourado / bege (R-LAYOUT-9)', () => {
  let store: Map<string, string>;
  let attrs: Record<string, string>;
  beforeEach(() => {
    store = new Map();
    attrs = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.stubGlobal('document', { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } });
  });

  it('o padrão é couro e dourado', () => {
    expect(DEFAULT_SKIN).toBe('couro');
    expect(readSkin()).toBe('couro');
  });

  it('trocar alterna entre os dois, aplica na página e guarda no navegador', () => {
    expect(toggleSkin()).toBe('bege');
    expect(attrs['data-skin']).toBe('bege');
    expect(store.get(SKIN_KEY)).toBe('bege');
    expect(readSkin()).toBe('bege');
    expect(toggleSkin()).toBe('couro');
    expect(attrs['data-skin']).toBe('couro');
  });

  it('valor guardado inválido volta ao padrão, e armazenamento quebrado não derruba o jogo', () => {
    store.set(SKIN_KEY, 'neon');
    expect(readSkin()).toBe('couro');
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    });
    expect(readSkin()).toBe('couro');
    expect(toggleSkin()).toBe('bege'); // a troca vale na sessão mesmo sem guardar
    applySkin('couro');
    expect(attrs['data-skin']).toBe('couro');
  });
});

describe('casca em forma de pasta (R-LAYOUT-9)', () => {
  const html = ler('index.html');
  const css = ler('src/web/style.css');
  const tabs = [...html.matchAll(/class="game-nav-tab[^"]*"[^>]*data-tab="([a-z]+)"/g)].map(m => m[1]);

  it('as 8 abas ficam à esquerda, só com ícone (nome só no balão), e cada uma tem título e carimbo de pasta', () => {
    expect(tabs).toEqual(['perfil', 'missoes', 'duelos', 'loja', 'ranking', 'familia', 'distritos', 'tarefas', 'eventos', 'simulador']);
    // nomes das abas (R-NAV-1)
    const nomes = [...html.matchAll(/class="game-nav-tab[^"]*"[^>]*data-name="([^"]+)"/g)].map(m => m[1]);
    expect(nomes).toEqual(['Ficha', 'Missões', 'Duelo', 'Mercado Negro', 'Ranking', 'Família', 'Distritos', 'Tarefas', 'Eventos', 'Simulador']);
    for (const t of tabs) expect(FOLDER_HEADERS[t], t).toBeDefined();
    expect(html).not.toContain('tab-emoji');
    for (const m of html.matchAll(/<button class="game-nav-tab[^>]*>([\s\S]*?)<\/button>/g)) expect(m[1].replace(/<[^>]*>/g, '').trim()).toBe(''); // sem texto, só o ícone
    expect(html).toContain('id="folder-title"');
    expect(html).toContain('id="folder-stamp"');
  });

  it('todo ícone usado existe no conjunto de ícones, inclusive o de cada um dos 8 slots', () => {
    const defined = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
    const used = [...html.matchAll(/<use href="#([^"]+)"/g)].map(m => m[1]);
    for (const u of used) expect(defined.has(u), u).toBe(true);
    for (const s of ITEM_SLOTS) expect(defined.has(`g-${s}`), `g-${s}`).toBe(true);
  });

  it('os dois temas definem exatamente as mesmas cores', () => {
    const tokens = (block: string) => [...block.matchAll(/(--[a-z0-9-]+):/g)].map(m => m[1]).sort();
    const couro = css.match(/:root \{\n  --font-sans[\s\S]*?\n\}/)![0];
    const bege = css.match(/html\[data-skin="bege"\] \{[\s\S]*?\n\}/)![0];
    const skinOnly = (t: string[]) => t.filter(x => !x.startsWith('--font-'));
    expect(skinOnly(tokens(bege))).toEqual(skinOnly(tokens(couro)));
    expect(skinOnly(tokens(bege)).length).toBeGreaterThan(18);
  });

  it('o tema vale só na casca: modais de combate e login não são afetados', () => {
    expect(css).toMatch(/\.hud-header, \.shell \{\n  --bg-primary: var\(--desk\);/);
    expect(css).not.toMatch(/html\[data-skin="bege"\] \.combat/);
  });
});

describe('segunda rodada da pasta (R-LAYOUT-10)', () => {
  const html = ler('index.html');
  const css = ler('src/web/style.css');
  const main = ler('src/web/main.ts');

  it('fontes escolhidas pelo fundador: títulos em Rye e números em Bebas Neue', () => {
    expect(html).toContain('family=Rye');
    expect(html).toContain('family=Bebas+Neue');
    expect(css).toMatch(/--font-type: 'Rye'/);
    expect(css).toMatch(/--font-num: 'Bebas Neue'/);
  });

  it('o HUD mostra só ícone e valor: o texto de Energia, Cash, Ouro e Respeito fica escondido', () => {
    expect(css).toMatch(/\.res-label \{ display: none; \}/);
    for (const id of ['hud-energy', 'hud-cash', 'hud-gold', 'hud-respect']) expect(html).toContain(`id="${id}"`);
    // Energia, Cash, Ouro e Ranking usam arte (R-ARTE-3); o Respeito virou o pódio do Ranking (R-ARTE-4)
    expect((html.match(/class="res-img"/g) ?? []).length).toBe(4);
    expect((html.match(/class="ico res-icon"/g) ?? []).length).toBe(0);
  });

  it('a subpasta do perfil tem as 4 abas, com a Mala primeiro, e só aparece no Perfil', () => {
    const panes = [...html.matchAll(/class="sub-tab[^"]*"[^>]*data-pane="([a-z]+)"/g)].map(m => m[1]);
    expect(panes).toEqual(['mala', 'familia', 'conquistas', 'honra']);
    expect(css).toMatch(/\.sub-folder \{ display: none; \}\n#app\[data-tab="perfil"\] \.sub-folder \{/);
    expect(main).toContain("setAttribute('data-tab', tab)");
  });

  it('a aba ativa (da esquerda e da subpasta) se liga direto à pasta, sem as curvas de encaixe', () => {
    expect(css).toMatch(/\.game-nav-tab\.active \{[^}]*width: 6\.2rem/);
    expect(css).toMatch(/\.sub-tab\.active \{[^}]*margin-bottom: -0\.2rem/);
    expect(css).not.toContain('fillet');
    expect(css).not.toMatch(/\.game-nav-tab\.active::before/);
  });

  it('o balão do nome da aba fica por cima de tudo, inclusive das orelhas da subpasta', () => {
    // sem z-index próprio na lista de abas: os balões (z 40) ficam acima da costura (z 20) e das orelhas
    expect(css).toMatch(/\.game-main-nav \{ z-index: auto; \}/);
    expect(css).toMatch(/\.stitch-svg \{[^}]*z-index: 20;/);
  });

  it('o chefão virou missão especial dentro de Missões (e não é mais uma aba); Distritos, Tarefas e Eventos são pastas em desenho', () => {
    const missoes = html.slice(html.indexOf('id="view-missoes"'), html.indexOf('id="view-duelos"'));
    expect(missoes).toContain('id="attack-raid-boss-btn"');
    expect(missoes).toContain('MISSÃO ESPECIAL DO SERVIDOR');
    expect(html).not.toContain('Operações & Chefão');
    for (const id of ['distritos', 'tarefas', 'eventos']) expect(html).toMatch(new RegExp(`id="view-${id}"[^>]*>\\s*<div class="soon-card">`));
    expect(main).toContain('renderRaidEvent();');
  });

  it('os painéis Família e Honra usam dados reais do jogador, e Conquistas avisa que ainda não existem', () => {
    expect(main).toContain('MAFIA_FAMILIES_LIST.find(f => f.id === p.familyId)');
    expect(main).toContain('p.statsRecord');
    expect(main).toContain('As conquistas ainda não existem');
  });
});

describe('Ficha mais baixa (R-LAYOUT-11)', () => {
  const html2 = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const css2 = readFileSync(join(process.cwd(), 'src/web/style.css'), 'utf8').replace(/\r\n/g, '\n');
  it('o card do personagem estica até a linha de baixo do Equipamento e a foto preenche o quadro', () => {
    expect(css2).toMatch(/\.profile-doll-panel \{ align-self: stretch;/);
    expect(css2).toMatch(/\.profile-avatar-frame \{ flex: 1 1 auto; height: auto;/);
    expect(css2).not.toMatch(/grid-template-columns: 14\.6rem/); // as colunas ficam como eram: o Equipamento não pode crescer
    expect(readFileSync(join(process.cwd(), 'src/web/main.ts'), 'utf8')).toContain("'xMidYMin slice'");
  });
  it('Atributos sem o título "Atributos" (só os pontos livres), mas com as 4 linhas', () => {
    expect(css2).toMatch(/\.profile-stats-panel\.compact \.panel-header-banner h3 \{ display: none; \}/);
    expect(css2).toMatch(/\.profile-stats-panel\.compact \.attr-compact-list \{ border-top: 0; \}/);
    expect(html2).toContain('id="free-points-indicator"');
    expect((html2.match(/class="attr-c-row"/g) ?? []).length).toBe(4);
  });
});

describe('Ficha compacta, Equipamento intacto (R-LAYOUT-12)', () => {
  const css3 = readFileSync(join(process.cwd(), 'src/web/style.css'), 'utf8').replace(/\r\n/g, '\n');
  it('o Equipamento tem largura fixa (37,8 rem) e os slots seguem 4:3, então o tamanho dos slots não muda', () => {
    expect(css3).toMatch(/\.profile-layout-grid \{ grid-template-columns: 14\.96rem minmax\(17\.6rem, 1fr\) 14\.96rem 37\.8rem; \}/);
    expect(css3).toMatch(/\.equipped-slots-grid \.gear-slot \{ aspect-ratio: 4 \/ 3; \}/);
    expect(css3).toMatch(/\.equipped-slots-grid \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/);
  });
  it('os 3 cards da esquerda encolhem e só o respiro do Equipamento e da pasta diminui', () => {
    expect(css3).toMatch(/\.profile-gear-panel \{ padding: 0\.5rem 0\.9rem; \}/);
    expect(css3).toMatch(/#app\[data-tab="perfil"\] \.stack > \.folder \{ padding: 0\.6rem 1\.2rem 0\.7rem; \}/);
    expect(css3).toMatch(/\.attr-c-row \{ grid-template-columns: 1fr 4\.6rem 0\.7rem 2\.3rem; height: 2\.07rem; \}/);
  });
});
