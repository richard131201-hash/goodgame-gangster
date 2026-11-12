import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { rollSceneMissions, SCENE_CASH, SCENE_ENERGY } from '../../src/web/missionScene.js';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/web/style.css', 'utf8');
const main = readFileSync('src/web/main.ts', 'utf8');

describe('cena da aba Missões, protótipo (R-MISSAO-CENA-1)', () => {
  it('sorteia 3 missões: leve, média e pesada; custo e recompensa só crescem', () => {
    for (let k = 0; k < 200; k++) {
      const m = rollSceneMissions();
      expect(m.map(x => x.tier)).toEqual([0, 1, 2]);
      expect(m.map(x => x.energy)).toEqual([...SCENE_ENERGY]);
      for (let i = 0; i < 3; i++) {
        expect(m[i].cash).toBeGreaterThanOrEqual(SCENE_CASH[i][0]);
        expect(m[i].cash).toBeLessThan(SCENE_CASH[i][1]);
      }
      expect(m[0].energy).toBeLessThan(m[1].energy);
      expect(m[1].energy).toBeLessThan(m[2].energy);
      expect(m[0].cash).toBeLessThan(m[1].cash);
      expect(m[1].cash).toBeLessThan(m[2].cash);
      expect(m[0].xp).toBeLessThan(m[2].xp);
    }
  });

  it('é determinístico com a mesma aleatoriedade (sorteio testável)', () => {
    const a = rollSceneMissions(() => 0.5);
    const b = rollSceneMissions(() => 0.5);
    expect(a).toEqual(b);
  });

  it('a cena existe na aba Missões, usa a imagem de fundo e está ligada ao jogo', () => {
    const missoes = html.slice(html.indexOf('id="view-missoes"'), html.indexOf('id="view-duelos"'));
    expect(missoes).toContain('id="mission-scene"');
    expect(existsSync('public/assets/scenes/missoes-bg.webp')).toBe(true);
    expect(css).toContain('/assets/scenes/missoes-bg.webp');
    expect(css).toMatch(/\.mscene \{[^}]*aspect-ratio: 1916 \/ 821;/);
    expect(main).toContain('initMissionScene();');
  });
});
