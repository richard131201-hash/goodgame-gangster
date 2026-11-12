// PROTÓTIPO da aba Missões (R-MISSAO-CENA-1): uma cena com 3 chefões; cada um oferece uma missão sorteada
// (leve, média e pesada: custo de energia e recompensa crescem). Os bonecos e as missões são provisórios,
// e "Aceitar" ainda não cumpre missão de verdade: as missões reais continuam na lista abaixo da cena.
import { notify } from './notice.js';

export interface SceneMission {
  tier: 0 | 1 | 2;
  title: string;
  energy: number;
  cash: number;
  xp: number;
}

const POOL: string[][] = [
  ['Cobrar o aluguel do açougue', 'Recuperar a carga roubada', 'Assustar o dono da padaria', 'Levar um recado ao porto'],
  ['Entregar a carga no porto', 'Escoltar o contador do Don', 'Invadir o armazém rival', 'Trocar o malote no hotel'],
  ['Calar a testemunha', 'Assaltar o banco da Rua 5', 'Derrubar a gangue do cais', 'Sequestrar o juiz suplente'],
];
export const SCENE_ENERGY = [5, 10, 20] as const;
export const SCENE_CASH: ReadonlyArray<readonly [number, number]> = [[150, 350], [400, 900], [1000, 2400]];
export const SCENE_XP = [10, 25, 60] as const;

/** Sorteia uma missão para cada chefão (leve, média, pesada). Quanto mais pesada, maior o custo e a recompensa. */
export function rollSceneMissions(rand: () => number = Math.random): SceneMission[] {
  return POOL.map((names, i) => {
    const [lo, hi] = SCENE_CASH[i];
    return {
      tier: i as 0 | 1 | 2,
      title: names[Math.min(names.length - 1, Math.floor(rand() * names.length))],
      energy: SCENE_ENERGY[i],
      cash: lo + Math.floor(rand() * (hi - lo)),
      xp: SCENE_XP[i],
    };
  });
}

// posição (centro, em % da largura da cena), altura (em % da altura da cena) e cores dos bonecos provisórios
const BOSSES = [
  { label: 'Trabalho leve', left: 30, h: 46, suit: '#b4b2a6', tie: '#5fa86a' },
  { label: 'Trabalho médio', left: 55, h: 53, suit: '#6f8a8c', tie: '#d4af37' },
  { label: 'Trabalho pesado', left: 79, h: 62, suit: '#5b5b63', tie: '#9c2a20' },
] as const;

const fmt = (n: number) => n.toLocaleString('pt-BR');

function bossSvg(suit: string, tie: string): string {
  return `<svg viewBox="0 0 50 80" aria-hidden="true"><path d="M5 80V45q0-15 20-15t20 15v35z" fill="${suit}" stroke="#2b2015" stroke-width="1.2"/><circle cx="25" cy="20" r="11" fill="#e9c9a0" stroke="#2b2015" stroke-width="1.2"/><path d="M11 17h28l-3-9q-11-6-22 0z" fill="#3a2d22" stroke="#2b2015" stroke-width="1.2"/><path d="M20 32l5 12 5-12z" fill="${tie}" stroke="#2b2015" stroke-width="1"/></svg>`;
}

function render(root: HTMLElement, missions: SceneMission[]) {
  const open = root.querySelector<HTMLElement>('.mscene-boss.open')?.dataset.i;
  root.innerHTML =
    '<span class="mscene-flag">PROTÓTIPO</span>' +
    BOSSES.map((b, i) => {
      const m = missions[i];
      return `<div class="mscene-boss${open === String(i) ? ' open' : ''}" data-i="${i}" style="left:${b.left}%;--h:${b.h}%" tabindex="0" role="button" aria-label="${b.label}: ${m.title}">
        <div class="mscene-card"><b>${m.title}</b><span>Custo: ${m.energy} de energia</span><div class="mscene-rw"><i>$${fmt(m.cash)}</i><i>${m.xp} XP</i></div><button type="button" class="mscene-accept" data-accept>Aceitar</button></div>
        ${bossSvg(b.suit, b.tie)}<span class="mscene-tag">${b.label}</span></div>`;
    }).join('');
}

export function initMissionScene(): void {
  const root = document.getElementById('mission-scene');
  if (!root) return;
  let missions = rollSceneMissions();
  render(root, missions);
  root.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-accept]')) {
      void notify({
        kind: 'info',
        title: 'Protótipo',
        stamp: 'EM TESTE',
        message: 'Esta cena é um protótipo visual: aceitar aqui ainda não cumpre a missão. As missões de verdade continuam na lista abaixo. Ao aceitar, as três missões da cena são sorteadas de novo, como será no jogo.',
      });
      missions = rollSceneMissions();
      render(root, missions);
      return;
    }
    const boss = t.closest<HTMLElement>('.mscene-boss');
    root.querySelectorAll('.mscene-boss.open').forEach(o => o !== boss && o.classList.remove('open'));
    boss?.classList.toggle('open');
  });
}
