import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { validateConfig, type BalanceConfig } from '../engine/schema.js';
import { derivedStats } from '../engine/stats.js';
import { simulateFight } from '../engine/fight.js';
import { getBuildPoints, type BuildType } from '../sim/builds.js';
import { runFullSimulation, type SimulationReport } from '../sim/analyzer.js';
import type { StyleId, FighterInput, FightEvent } from '../engine/types.js';
import {
  renderPaperdollSVG,
  DEFAULT_CARRASCO,
  DEFAULT_MURALHA,
  DEFAULT_MALANDRO,
  generateRandomAppearance,
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHING_COLORS,
  type CharacterAppearance,
} from './paperdoll.js';
import { sound } from './sound.js';

const config: BalanceConfig = validateConfig(balanceJson);

// FIGHTER CONFIGS & APPEARANCE
interface FighterState {
  style: StyleId;
  level: number;
  build: BuildType;
  appearance: CharacterAppearance;
}

const fighterA: FighterState = {
  style: 'carrasco',
  level: 1,
  build: 'equilibrado',
  appearance: { ...DEFAULT_CARRASCO },
};

const fighterB: FighterState = {
  style: 'muralha',
  level: 1,
  build: 'equilibrado',
  appearance: { ...DEFAULT_MURALHA },
};

// ARENA RUNTIME STATE
let currentEvents: FightEvent[] = [];
let eventIdx = 0;
let fightTimer: number | null = null;
let speedMs = 450;
let customizerTargetSide: 'A' | 'B' = 'A';
let cachedReport: SimulationReport | null = null;
let activeMatrixLevel = 1;

// SOUND TOGGLE
const audioBtn = document.getElementById('audio-toggle-btn')!;
audioBtn.addEventListener('click', () => {
  const on = sound.toggle();
  audioBtn.textContent = on ? '🔊' : '🔇';
});

// NAVIGATION
const navArenaBtn = document.getElementById('nav-arena-btn')!;
const navCustomizerBtn = document.getElementById('nav-customizer-btn')!;
const navSimBtn = document.getElementById('nav-sim-btn')!;
const arenaView = document.getElementById('arena-view')!;
const customizerView = document.getElementById('customizer-view')!;
const simView = document.getElementById('sim-view')!;

function switchView(view: 'arena' | 'customizer' | 'sim') {
  navArenaBtn.classList.toggle('active', view === 'arena');
  navCustomizerBtn.classList.toggle('active', view === 'customizer');
  navSimBtn.classList.toggle('active', view === 'sim');

  arenaView.classList.toggle('active', view === 'arena');
  customizerView.classList.toggle('active', view === 'customizer');
  simView.classList.toggle('active', view === 'sim');

  if (view === 'customizer') {
    renderCustomizerForm();
  } else if (view === 'sim') {
    renderDashboard(activeMatrixLevel);
  }
}

navArenaBtn.addEventListener('click', () => switchView('arena'));
navCustomizerBtn.addEventListener('click', () => switchView('customizer'));
navSimBtn.addEventListener('click', () => switchView('sim'));

document.getElementById('open-customizer-btn')!.addEventListener('click', () => switchView('customizer'));
document.getElementById('apply-to-arena-btn')!.addEventListener('click', () => {
  updateArenaCard('A');
  updateArenaCard('B');
  switchView('arena');
});

// SPEED BUTTONS
document.querySelectorAll('.spd-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.spd-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    speedMs = parseInt(btn.getAttribute('data-speed') ?? '450', 10);
  });
});

// RENDER ARENA CARDS
function updateArenaCard(side: 'A' | 'B') {
  const st = side === 'A' ? fighterA : fighterB;
  const pts = getBuildPoints(st.build, st.level, config);
  const input: FighterInput = { style: st.style, level: st.level, points: pts };
  const stats = derivedStats(input, config);

  const sideLower = side.toLowerCase();

  // Header & Info
  document.getElementById(`name-display-${sideLower}`)!.textContent = st.appearance.name;
  const styleBadge = document.getElementById(`style-badge-${sideLower}`)!;
  styleBadge.textContent = st.style.toUpperCase();
  styleBadge.className = `gg-style-badge badge-${st.style}`;

  document.getElementById(`level-badge-${sideLower}`)!.textContent = `NÍVEL ${st.level}`;
  document.getElementById(`build-badge-${sideLower}`)!.textContent = st.build.charAt(0).toUpperCase() + st.build.slice(1);

  // HP
  document.getElementById(`hp-text-${sideLower}`)!.textContent = `${stats.maxHp} / ${stats.maxHp} (100%)`;
  const hpFill = document.getElementById(`hp-fill-${sideLower}`)!;
  hpFill.style.width = '100%';
  hpFill.className = 'gg-hp-bar-fill';

  // 4 Attributes Footer
  document.getElementById(`stat-atk-${sideLower}`)!.textContent = Math.round(stats.attackPower).toLocaleString();
  document.getElementById(`stat-life-${sideLower}`)!.textContent = stats.maxHp.toLocaleString();
  document.getElementById(`stat-ast-${sideLower}`)!.textContent = `${(stats.critChance * 100).toFixed(1)}%`;
  document.getElementById(`stat-ten-${sideLower}`)!.textContent = `${(stats.critReduction * 100).toFixed(1)}%`;

  // Secondary
  document.getElementById(`stat-arm-${sideLower}`)!.textContent = `${(stats.armorReduction * 100).toFixed(0)}%`;
  document.getElementById(`stat-ddg-${sideLower}`)!.textContent = `${(stats.dodgeChance * 100).toFixed(0)}%`;

  // Avatar SVG
  const container = document.getElementById(`avatar-container-${sideLower}`)!;
  container.innerHTML = renderPaperdollSVG(st.appearance, { width: 280, height: 340, pose: 'idle' });

  // Passives
  renderPassivesBar(side, stats);
}

function renderPassivesBar(side: 'A' | 'B', stats: any) {
  const st = side === 'A' ? fighterA : fighterB;
  const bar = document.getElementById(`passives-bar-${side.toLowerCase()}`)!;

  const pills: string[] = [];
  if (st.style === 'carrasco') {
    pills.push('<span class="passive-pill pill-abertura">⚡ Golpe de Abertura</span>');
    pills.push('<span class="passive-pill pill-execucao">🗡️ Execução (-25% Arm.)</span>');
  } else if (st.style === 'muralha') {
    pills.push('<span class="passive-pill pill-intim">🛡️ Intimidação (-25%)</span>');
    pills.push('<span class="passive-pill pill-casca">🧱 Casca Grossa (x1.4)</span>');
  } else if (st.style === 'malandro') {
    pills.push('<span class="passive-pill pill-adapt">🔄 Adaptação (+0.2%/1% HP)</span>');
    pills.push('<span class="passive-pill pill-casca">⚡ Instinto (x1.2)</span>');
  }
  bar.innerHTML = pills.join('');
}

updateArenaCard('A');
updateArenaCard('B');

// ARENA COMBAT CONTROLS
const playBtn = document.getElementById('fight-play-btn')!;
const stepBtn = document.getElementById('fight-step-btn')!;
const skipBtn = document.getElementById('fight-skip-btn')!;
const resetBtn = document.getElementById('fight-reset-btn')!;
const roundDisplay = document.getElementById('arena-round-display')!;
const tickerContent = document.getElementById('latest-strike-ticker')!;
const fullLogList = document.getElementById('full-log-list')!;
const fullLogDrawer = document.getElementById('full-log-drawer')!;
const toggleLogBtn = document.getElementById('toggle-full-log-btn')!;

toggleLogBtn.addEventListener('click', () => {
  const isHidden = fullLogDrawer.style.display === 'none';
  fullLogDrawer.style.display = isHidden ? 'block' : 'none';
  toggleLogBtn.textContent = isHidden ? 'Ocultar Histórico ▴' : 'Ver Histórico Completo ▾';
});

function resetCombat() {
  if (fightTimer) {
    clearTimeout(fightTimer);
    fightTimer = null;
  }
  currentEvents = [];
  eventIdx = 0;
  roundDisplay.textContent = 'PRONTO PARA O DUELO';
  tickerContent.textContent = 'Aguardando início do combate. Clique em "INICIAR COMBATE" acima.';
  fullLogList.innerHTML = '';

  updateArenaCard('A');
  updateArenaCard('B');
}

resetBtn.addEventListener('click', resetCombat);

function startCombat() {
  resetCombat();

  const seed = Math.floor(Math.random() * 1000000);
  const ptsA = getBuildPoints(fighterA.build, fighterA.level, config);
  const ptsB = getBuildPoints(fighterB.build, fighterB.level, config);

  const inputA: FighterInput = { style: fighterA.style, level: fighterA.level, points: ptsA };
  const inputB: FighterInput = { style: fighterB.style, level: fighterB.level, points: ptsB };

  const result = simulateFight(inputA, inputB, config, seed, { withEvents: true });
  currentEvents = result.events ?? [];
  eventIdx = 0;

  const firstFighter = result.firstAttacker === 'A' ? fighterA.appearance.name : fighterB.appearance.name;
  roundDisplay.textContent = `INICIATIVA: ${firstFighter.toUpperCase()} COMEÇA!`;

  playNextStrike();
}

playBtn.addEventListener('click', startCombat);

skipBtn.addEventListener('click', () => {
  if (currentEvents.length === 0) {
    startCombat();
  }
  while (eventIdx < currentEvents.length) {
    applyStrike(currentEvents[eventIdx], false);
    eventIdx++;
  }
  const last = currentEvents[currentEvents.length - 1];
  finishCombat(last.attacker);
});

stepBtn.addEventListener('click', () => {
  if (currentEvents.length === 0) {
    startCombat();
  } else if (eventIdx < currentEvents.length) {
    applyStrike(currentEvents[eventIdx], true);
    eventIdx++;
    if (eventIdx >= currentEvents.length) {
      const last = currentEvents[currentEvents.length - 1];
      finishCombat(last.attacker);
    }
  }
});

function playNextStrike() {
  if (eventIdx >= currentEvents.length) {
    const last = currentEvents[currentEvents.length - 1];
    finishCombat(last.attacker);
    return;
  }

  const ev = currentEvents[eventIdx];
  applyStrike(ev, true);
  eventIdx++;

  fightTimer = window.setTimeout(playNextStrike, speedMs);
}

function applyStrike(ev: FightEvent, playFx: boolean) {
  roundDisplay.textContent = `RODADA ${ev.round} • TURNO ${ev.turn}`;

  const defSide = ev.defender;
  const defCard = document.getElementById(`gg-card-${defSide.toLowerCase()}`)!;
  const floatZone = document.getElementById(`float-zone-${defSide.toLowerCase()}`)!;
  const hpFill = document.getElementById(`hp-fill-${defSide.toLowerCase()}`)!;
  const hpText = document.getElementById(`hp-text-${defSide.toLowerCase()}`)!;

  const defState = defSide === 'A' ? fighterA : fighterB;
  const defStats = derivedStats({ style: defState.style, level: defState.level, points: getBuildPoints(defState.build, defState.level, config) }, config);

  const pct = Math.max(0, (ev.defenderHpRemaining / defStats.maxHp) * 100);
  hpFill.style.width = `${pct}%`;
  hpText.textContent = `${ev.defenderHpRemaining} / ${defStats.maxHp} (${pct.toFixed(0)}%)`;

  if (pct < 25) {
    hpFill.className = 'gg-hp-bar-fill danger';
  } else if (pct < 50) {
    hpFill.className = 'gg-hp-bar-fill warning';
  }

  const atkName = ev.attacker === 'A' ? fighterA.appearance.name : fighterB.appearance.name;
  const defName = ev.defender === 'A' ? fighterA.appearance.name : fighterB.appearance.name;

  // Floating Numbers & Avatar Animation
  if (playFx) {
    const floatEl = document.createElement('div');
    if (ev.isDodge) {
      floatEl.className = 'floating-damage-text dodge';
      floatEl.textContent = 'ESQUIVOU!';
      sound.playDodge();
    } else if (ev.isCrit) {
      floatEl.className = 'floating-damage-text crit';
      floatEl.textContent = `💥 CRÍTICO! -${ev.finalDamage}`;
      defCard.classList.remove('shake');
      void defCard.offsetWidth;
      defCard.classList.add('shake');
      sound.playCrit();
    } else {
      floatEl.className = 'floating-damage-text normal';
      floatEl.textContent = `-${ev.finalDamage}`;
      defCard.classList.remove('shake');
      void defCard.offsetWidth;
      defCard.classList.add('shake');
      sound.playHit();
    }
    floatZone.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1200);
  }

  // Ticker text
  const tagList: string[] = [];
  if (ev.isCrit) tagList.push(`Crítico (+${((ev.critBonus ?? 0) * 100).toFixed(0)}%)`);
  if (ev.openingStrikeBonus) tagList.push(`Abertura (+${((ev.openingStrikeBonus) * 100).toFixed(0)}%)`);
  if (ev.adaptationBonus) tagList.push(`Adaptação (+${((ev.adaptationBonus) * 100).toFixed(1)}%)`);
  if (ev.intimidationReductionApplied) tagList.push(`Intimidação (-${((ev.intimidationReductionApplied) * 100).toFixed(0)}%)`);

  const tagStr = tagList.length > 0 ? ` [${tagList.join(', ')}]` : '';
  const strikeMsg = ev.isDodge
    ? `${atkName} atacou, mas ${defName} ESQUIVOU agilmente!`
    : `${atkName} desferiu golpe em ${defName} causando ${ev.finalDamage} de dano!${tagStr}`;

  tickerContent.textContent = `[R${ev.round}] ${strikeMsg}`;

  // Full Log entry
  const logRow = document.createElement('div');
  logRow.className = `log-item-row ${ev.isCrit ? 'crit' : ''} ${ev.isDodge ? 'dodge' : ''}`;
  logRow.innerHTML = `
    <span><strong>[R${ev.round} T${ev.turn}]</strong> ${strikeMsg}</span>
    <span>HP rest.: <strong>${ev.defenderHpRemaining}</strong></span>
  `;
  fullLogList.prepend(logRow);
}

function finishCombat(winnerSide: 'A' | 'B') {
  sound.playVictory();
  const winner = winnerSide === 'A' ? fighterA.appearance.name : fighterB.appearance.name;
  roundDisplay.textContent = `🏆 VITÓRIA DE ${winner.toUpperCase()}!`;
  tickerContent.textContent = `COMBATE FINALIZADO: ${winner} venceu o duelo de honra!`;
}

// ========================================================
// CUSTOMIZER (CRIADOR DE GANGSTER)
// ========================================================

const sideBtns = document.querySelectorAll('.target-side-btn');
sideBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sideBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    customizerTargetSide = btn.getAttribute('data-target') as 'A' | 'B';
    renderCustomizerForm();
  });
});

function getActiveCustomizerState(): FighterState {
  return customizerTargetSide === 'A' ? fighterA : fighterB;
}

function renderCustomizerForm() {
  const st = getActiveCustomizerState();
  const app = st.appearance;

  // Name & Class
  (document.getElementById('cust-name-input') as HTMLInputElement).value = app.name;
  (document.getElementById('cust-style-select') as HTMLSelectElement).value = st.style;
  (document.getElementById('cust-lvl-slider') as HTMLInputElement).value = st.level.toString();
  document.getElementById('cust-lvl-val')!.textContent = st.level.toString();
  (document.getElementById('cust-build-select') as HTMLSelectElement).value = st.build;

  // Swatches: Skin
  const skinContainer = document.getElementById('swatches-skin')!;
  skinContainer.innerHTML = SKIN_TONES.map(s => `
    <button class="swatch-btn ${s.value === app.skinTone ? 'active' : ''}" style="background-color: ${s.value};" data-prop="skinTone" data-val="${s.value}" title="${s.name}"></button>
  `).join('');

  // Swatches: Eyes
  const eyesContainer = document.getElementById('swatches-eyes')!;
  eyesContainer.innerHTML = EYE_COLORS.map(e => `
    <button class="swatch-btn ${e.value === app.eyeColor ? 'active' : ''}" style="background-color: ${e.value};" data-prop="eyeColor" data-val="${e.value}" title="${e.name}"></button>
  `).join('');

  // Swatches: Hair
  const hairContainer = document.getElementById('swatches-hair')!;
  hairContainer.innerHTML = HAIR_COLORS.map(h => `
    <button class="swatch-btn ${h.value === app.hairColor ? 'active' : ''}" style="background-color: ${h.value};" data-prop="hairColor" data-val="${h.value}" title="${h.name}"></button>
  `).join('');

  // Swatches: Clothing
  const clothingContainer = document.getElementById('swatches-clothing')!;
  clothingContainer.innerHTML = CLOTHING_COLORS.map(c => `
    <button class="swatch-btn ${c.main === app.clothingColor ? 'active' : ''}" style="background: linear-gradient(135deg, ${c.main} 50%, ${c.sec} 50%);" data-prop="clothingColor" data-val="${c.main}" data-sec="${c.sec}" title="${c.name}"></button>
  `).join('');

  // Toggle buttons active state
  updateToggleButtons('gender', app.gender);
  updateToggleButtons('hairStyle', app.hairStyle);
  updateToggleButtons('facialHair', app.facialHair);
  updateToggleButtons('clothing', app.clothing);
  updateToggleButtons('accessory', app.accessory);
  updateToggleButtons('cardBackground', app.cardBackground);

  // Live SVG Preview
  updateCustomizerPreview();
}

function updateToggleButtons(prop: string, val: string) {
  document.querySelectorAll(`.choice-btn[data-prop="${prop}"]`).forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-val') === val);
  });
}

function updateCustomizerPreview() {
  const st = getActiveCustomizerState();
  const box = document.getElementById('customizer-live-avatar')!;
  box.innerHTML = renderPaperdollSVG(st.appearance, { width: 280, height: 340 });
  document.getElementById('customizer-live-name')!.textContent = st.appearance.name;
}

// BIND CUSTOMIZER INPUTS
document.getElementById('cust-name-input')!.addEventListener('input', (e) => {
  const st = getActiveCustomizerState();
  st.appearance.name = (e.target as HTMLInputElement).value;
  updateCustomizerPreview();
});

document.getElementById('cust-style-select')!.addEventListener('change', (e) => {
  const st = getActiveCustomizerState();
  st.style = (e.target as HTMLSelectElement).value as StyleId;
  updateArenaCard(customizerTargetSide);
});

document.getElementById('cust-lvl-slider')!.addEventListener('input', (e) => {
  const st = getActiveCustomizerState();
  st.level = parseInt((e.target as HTMLInputElement).value, 10);
  document.getElementById('cust-lvl-val')!.textContent = st.level.toString();
  updateArenaCard(customizerTargetSide);
});

document.getElementById('cust-build-select')!.addEventListener('change', (e) => {
  const st = getActiveCustomizerState();
  st.build = (e.target as HTMLSelectElement).value as BuildType;
  updateArenaCard(customizerTargetSide);
});

// Click delegation for buttons and swatches
document.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('[data-prop]') as HTMLElement;
  if (!target) return;

  const prop = target.getAttribute('data-prop');
  const val = target.getAttribute('data-val');
  if (!prop || !val) return;

  const st = getActiveCustomizerState();

  if (prop === 'clothingColor') {
    st.appearance.clothingColor = val;
    st.appearance.clothingSecondaryColor = target.getAttribute('data-sec') ?? '#e74c3c';
  } else if (prop in st.appearance) {
    (st.appearance as any)[prop] = val;
    if (prop === 'hairColor') {
      st.appearance.facialHairColor = val;
    }
  }

  renderCustomizerForm();
});

// RANDOMIZE AVATAR
document.getElementById('randomize-avatar-btn')!.addEventListener('click', () => {
  const st = getActiveCustomizerState();
  st.appearance = generateRandomAppearance(st.style);
  renderCustomizerForm();
});

// ========================================================
// DASHBOARD SIMULATOR (VIEW 3)
// ========================================================

function renderDashboard(level: number) {
  activeMatrixLevel = level;
  if (!cachedReport) {
    cachedReport = runFullSimulation([1, 10, 50, 100], 1000, 42, config);
  }

  const matrixObj = cachedReport.baseMatrices.find(m => m.level === level);
  if (!matrixObj) return;

  // Heatmap 3x3 Table
  const tableContainer = document.getElementById('matrix-table-container')!;
  let tableHtml = `
    <table class="matrix-heatmap-table">
      <thead>
        <tr>
          <th>Atacante \ Defensor</th>
          <th>Carrasco</th>
          <th>Muralha</th>
          <th>Malandro</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const sA of matrixObj.styles) {
    tableHtml += `<tr><th>${sA.toUpperCase()}</th>`;
    for (const sB of matrixObj.styles) {
      const wr = matrixObj.matrix[sA][sB];
      const wrPct = (wr * 100).toFixed(1);
      let cls = 'cell-balanced';
      if (wr > 0.55) cls = 'cell-high';
      else if (wr < 0.45) cls = 'cell-low';
      tableHtml += `<td><span class="cell-rate ${cls}">${wrPct}%</span></td>`;
    }
    tableHtml += `</tr>`;
  }
  tableHtml += `</tbody></table>`;
  tableContainer.innerHTML = tableHtml;

  // Details Table
  const detailsContainer = document.getElementById('matchup-details-container')!;
  let detailsHtml = `
    <table>
      <thead>
        <tr>
          <th>Confronto</th>
          <th>Vit. A</th>
          <th>1º Atk</th>
          <th>Média Rod.</th>
          <th>Mediana</th>
          <th>Crítico %</th>
          <th>Esquiva %</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const m of matrixObj.matchups) {
    detailsHtml += `
      <tr>
        <td><strong>${m.styleA.toUpperCase()} × ${m.styleB.toUpperCase()}</strong></td>
        <td>${(m.winRateA * 100).toFixed(1)}%</td>
        <td>${(m.firstAttackerWinRate * 100).toFixed(1)}%</td>
        <td>${m.rounds.avg}</td>
        <td>${m.rounds.p50}</td>
        <td>${(m.observedCritRate * 100).toFixed(1)}%</td>
        <td>${(m.observedDodgeRate * 100).toFixed(1)}%</td>
      </tr>
    `;
  }
  detailsHtml += `</tbody></table>`;
  detailsContainer.innerHTML = detailsHtml;

  // Alerts
  const alertsList = document.getElementById('dashboard-alerts-list')!;
  alertsList.innerHTML = cachedReport.alerts.map(a => `
    <div class="alert-item">
      <span class="alert-tag">${a.type} (L${a.level})</span>
      <span>${a.description}</span>
    </div>
  `).join('');
}

document.querySelectorAll('.matrix-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.matrix-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const lvl = parseInt(btn.getAttribute('data-lvl') ?? '1', 10);
    renderDashboard(lvl);
  });
});

const runBrowserSimBtn = document.getElementById('run-browser-sim-btn')!;
const simLiveStatus = document.getElementById('sim-live-status')!;
runBrowserSimBtn.addEventListener('click', () => {
  simLiveStatus.textContent = 'Simulando 3.000 lutas por célula...';
  setTimeout(() => {
    const t0 = performance.now();
    cachedReport = runFullSimulation([1, 10, 50, 100], 3000, Date.now(), config);
    const elapsed = (performance.now() - t0).toFixed(0);
    simLiveStatus.textContent = `Concluído em ${elapsed}ms! Matrizes atualizadas.`;
    renderDashboard(activeMatrixLevel);
  }, 50);
});
