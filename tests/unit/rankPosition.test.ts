import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { positionAmongNpcs, positionInRows, rankLabel } from '../../src/web/rankPosition.js';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('posição no Ranking mostrada no topo (R-RANK-3, R-ARTE-4)', () => {
  it('com servidor: a posição é o lugar do jogador na lista já ordenada por Respeito', () => {
    const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(positionInRows(rows, 'a')).toBe(1);
    expect(positionInRows(rows, 'c')).toBe(3);
    expect(positionInRows(rows, 'x')).toBeNull();
    expect(positionInRows(rows, null)).toBeNull();
  });

  it('sem servidor: 1 + quantos NPCs têm mais Respeito, e em empate o NPC fica acima', () => {
    const npcs = [4200, 3500, 2950, 2400, 1980, 1600];
    expect(positionAmongNpcs(npcs, 100)).toBe(7);
    expect(positionAmongNpcs(npcs, 1600)).toBe(7); // empate: o NPC fica acima
    expect(positionAmongNpcs(npcs, 1601)).toBe(6);
    expect(positionAmongNpcs(npcs, 5000)).toBe(1);
  });

  it('o texto do topo é "#N" ou "—" quando a posição ainda não é conhecida', () => {
    expect(rankLabel(3)).toBe('#3');
    expect(rankLabel(null)).toBe('—');
  });

  it('o 4º item do topo é o pódio chamado Ranking (não a estrela do Respeito) e não mostra mais o Respeito', () => {
    const html = ler('index.html');
    expect(html).toMatch(/res-respect" data-name="Ranking">\s*<img class="res-img" src="\/assets\/icons\/podio\.webp"/);
    expect(html).toContain('RANKING</span>');
    expect(ler('src/web/main.ts')).not.toContain("'hud-respect')!.textContent = p.respect");
  });

  it('Energia, Cash, Ouro e Ranking mostram o nome ao passar o mouse, no estilo das abas (sem title nativo)', () => {
    const html = ler('index.html');
    for (const n of ['Energia', 'Cash', 'Ouro', 'Ranking']) expect(html).toContain(`data-name="${n}"`);
    expect(html).not.toMatch(/class="res-card[^"]*" title=/);
    const css = ler('src/web/style.css');
    expect(css).toContain('.res-card[data-name]:hover::after { opacity: 1; }');
    expect(css).toMatch(/\.hud-header \{ position: relative; z-index: 40; \}/); // a etiqueta passa por cima da pasta
  });
});
