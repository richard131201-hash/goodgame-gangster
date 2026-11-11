import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { validateConfig, type BalanceConfig } from '../engine/schema.js';
import { derivedStats } from '../engine/stats.js';
import { simulateFight } from '../engine/fight.js';
import { getBuildPoints } from '../sim/builds.js';
import { runFullSimulation, type SimulationReport } from '../sim/analyzer.js';
import type { StyleId, FighterInput, FightEvent } from '../engine/types.js';
import { WEAPONS_CATALOG, getWeaponById, type WeaponDef } from '../engine/weapons.js';
import {
  renderPaperdollSVG,
  type CharacterAppearance,
} from './paperdoll.js';
import { sound } from './sound.js';
import { msToNextEnergy } from './energy.js';
import { cloudEnabled, supabase } from './supabaseClient.js';
import { initAuthUi, showAuthScreen, signOutAccount, startCharacterCreation, reopenNameStep, type CreatedCharacter } from './authUi.js';
import {
  startSync,
  stopSync,
  syncEnabled,
  markDirty,
  flushSave,
  fetchMe,
  createOnServer,
  fetchRanking,
  fetchRivals,
  duelOnServer,
  serverUnavailable,
  type PublicPlayer,
  type DuelReply,
} from './cloudSync.js';
import { DUEL, duelBounty } from '../shared/duel.js';
import { playWeaponAttackVisual, clearAllImpacts } from './animations.js';
import { getWeaponSprite } from './weaponSprites.js';
import {
  equippedWeaponDef,
  damageText,
  damageShort,
  damageAverage,
  compareWeapons,
  formatDelta,
  bagEntries,
  bagSlotCount,
  isWeaponItem,
  type WeaponComparison,
} from './weaponSlot.js';
import {
  attributeInfluence,
  formatInfluenceValue,
  formatPerPoint,
  influenceTitle,
  type AttrKey,
  type AttrInfluence,
} from './attributeInfluence.js';
import {
  gameState,
  createNewPlayer,
  getStatTrainingCost,
  type PlayerState,
} from './state.js';
import {
  SHOP_ITEMS,
  MISSIONS_LIST,
  generateRivalPool,
  MAFIA_FAMILIES_LIST,
  CURRENT_RAID_EVENT,
  type GameItem,
  type MissionDef,
  type DuelRival,
} from './gameData.js';

const config: BalanceConfig = validateConfig(balanceJson);

// ========================================================
// COMBAT RUNTIME STATE (ARENA MODAL)
// ========================================================
let currentEvents: FightEvent[] = [];
let eventIdx = 0;
let fightTimer: number | null = null;
let speedMs = 450;
let activeCombatCallback: ((won: boolean) => void) | null = null;
let currentCombatFighterA: FighterInput | null = null;
let currentCombatFighterB: FighterInput | null = null;
let combatSideAName = '';
let combatSideBName = '';

// SIMULATOR RUNTIME
let cachedReport: SimulationReport | null = null;
let activeMatrixLevel = 1;

// ========================================================
// INITIALIZATION
// ========================================================
let gameInitialized = false;
let bootStarted = false;

/** Mostra o jogo para o save atual: criação de personagem se for novo, senão o perfil. */
function enterGame() {
  const player = gameState.getPlayer();
  if (!player.hasCreatedCharacter) {
    startCharacterCreation(finishCharacterCreation);
  } else {
    updateHUD();
    renderActiveTab('perfil');
  }
}

function initGame() {
  if (gameInitialized) return;
  gameInitialized = true;

  enterGame();

  gameState.subscribe(() => {
    updateHUD();
    const activeNav = document.querySelector('.game-nav-tab.active') as HTMLElement | null;
    const tabName = activeNav?.getAttribute('data-tab') || 'perfil';
    renderActiveTab(tabName);
  });
}

/** Id da conta logada (usado para marcar "você" no ranking e para listar rivais). */
let currentUserId: string | null = null;

/** Desenha um aviso fixo quando o jogo roda sem servidor (só neste navegador). */
function setOfflineNotice(on: boolean) {
  let el = document.getElementById('offline-notice');
  if (!el && on) {
    el = document.createElement('div');
    el.id = 'offline-notice';
    el.style.cssText = 'position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:9999;background:#7a4a00;color:#fff;padding:6px 14px;border-radius:6px;font-size:12px;';
    el.textContent = 'Servidor indisponível: seu progresso está só neste navegador e não aparece no ranking.';
    document.body.appendChild(el);
  }
  if (el) el.style.display = on ? 'block' : 'none';
}

let lastRejectAlertAt = 0;
function beginSync() {
  startSync(
    () => gameState.getPlayer(),
    (serverSave, message) => {
      gameState.adoptServerSave(serverSave); // volta ao que o servidor considera válido
      if (Date.now() - lastRejectAlertAt > 10000) {
        lastRejectAlertAt = Date.now();
        alert(message);
      }
    },
  );
  gameState.setPersistHook(markDirty);
  setOfflineNotice(false);
}

function endSync() {
  stopSync();
  gameState.setPersistHook(null);
}

/** O que o servidor precisa para criar o personagem (o visual sem o nome, que vai à parte). */
function characterPayload(created: CreatedCharacter) {
  const { name: _ignored, ...appearance } = created.draft.appearance;
  return { name: created.name, style: created.draft.style, weapon: created.draft.weapon, appearance };
}

/** Entra no jogo (primeira vez ou depois de uma criação de personagem). */
function openGame() {
  if (gameInitialized) enterGame();
  else initGame();
}

/**
 * Fim da criação do personagem. Com servidor: ele cria, confere o nome único e devolve o save.
 * Sem servidor (modo local ou servidor fora do ar): cria só neste navegador.
 */
async function finishCharacterCreation(created: CreatedCharacter) {
  if (!cloudEnabled || !currentUserId) {
    applyCreatedCharacter(created, false);
    openGame();
    return;
  }
  const r = await createOnServer(characterPayload(created));
  if (r.body.ok && r.body.save) {
    gameState.adoptServerSave(r.body.save);
    sound.playCrit();
    openGame();
    if (gameInitialized) {
      updateHUD();
      renderActiveTab('perfil');
    }
    return;
  }
  if (serverUnavailable(r)) {
    endSync();
    setOfflineNotice(true);
    applyCreatedCharacter(created, false);
    openGame();
    return;
  }
  reopenNameStep(created, r.body.message ?? 'Não foi possível criar o personagem. Tente de novo.', finishCharacterCreation);
}

/** Login concluído (ou sessão já existente): o servidor diz quem é o personagem desta conta. */
async function onLoggedIn(session: { user: { id: string; email?: string } }, created?: CreatedCharacter) {
  currentUserId = session.user.id;
  endSync();
  gameState.setAccount(session.user.id);
  const logout = document.getElementById('logout-btn');
  if (logout) logout.title = session.user.email ? `Sair da conta (${session.user.email})` : 'Sair da conta';

  if (!cloudEnabled) {
    if (created) applyCreatedCharacter(created, false);
    document.body.classList.remove('auth-open');
    openGame();
    return;
  }

  const me = await fetchMe();
  if (serverUnavailable(me)) {
    // Servidor fora do ar (ou ainda não configurado): joga só neste navegador, sem ranking nem duelo.
    setOfflineNotice(true);
    if (created) applyCreatedCharacter(created, false);
    document.body.classList.remove('auth-open');
    openGame();
    return;
  }

  if (me.body.exists && me.body.save) {
    gameState.adoptServerSave(me.body.save);
    beginSync();
    document.body.classList.remove('auth-open');
    openGame();
    return;
  }

  // A conta ainda não tem personagem no servidor: qualquer save local não conferido é descartado.
  gameState.resetAllProgress();
  beginSync();
  if (created) {
    await finishCharacterCreation(created);
    document.body.classList.remove('auth-open');
    return;
  }
  document.body.classList.remove('auth-open');
  openGame(); // abre a criação de personagem
}

/**
 * Ponto de entrada. Com Supabase configurado, exige conta. Sem as chaves (modo local),
 * o jogo abre direto, como antes.
 */
async function boot() {
  if (bootStarted) return;
  bootStarted = true;

  if (!cloudEnabled || !supabase) {
    initAuthUi({ onLoggedIn });
    initGame();
    return;
  }

  document.body.classList.add('auth-open'); // esconde o jogo até saber se há sessão
  const logout = document.getElementById('logout-btn');
  if (logout) {
    logout.style.display = '';
    logout.addEventListener('click', () => {
      if (confirm('Sair da conta?')) {
        void flushSave().finally(() => {
          endSync();
          void signOutAccount();
        });
      }
    });
  }
  initAuthUi({ onLoggedIn });
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      endSync();
      showAuthScreen();
    }
  });

  const { data } = await supabase.auth.getSession();
  if (data.session) onLoggedIn(data.session);
  else showAuthScreen();
}

// ========================================================
// TOP HUD UPDATES
// ========================================================
function updateHUD() {
  const p = gameState.getPlayer();
  if (!p.hasCreatedCharacter) return;

  document.getElementById('hud-name')!.textContent = p.name;
  const badge = document.getElementById('hud-style-badge')!;
  badge.textContent = p.style.toUpperCase();
  badge.className = `gg-style-badge badge-${p.style}`;

  document.getElementById('hud-lvl')!.textContent = p.level.toString();
  const xpPct = Math.min(100, (p.xp / p.xpToNextLevel) * 100);
  document.getElementById('hud-xp-fill')!.style.width = `${xpPct}%`;
  document.getElementById('hud-xp-text')!.textContent = `${p.xp} / ${p.xpToNextLevel} XP`;

  updateEnergyHUD();
  document.getElementById('hud-cash')!.textContent = `$${p.cash.toLocaleString()}`;
  document.getElementById('hud-gold')!.textContent = p.gold.toString();
  document.getElementById('hud-respect')!.textContent = p.respect.toLocaleString();

  // Mini avatar thumb
  const thumb = document.getElementById('hud-avatar-thumb');
  if (thumb) {
    thumb.innerHTML = renderPaperdollSVG(p.appearance, { width: 52, height: 60 });
  }
}

// ENERGY: texto do HUD (com contagem até o próximo ponto) e regeneração por tempo
function updateEnergyHUD() {
  const p = gameState.getPlayer();
  const el = document.getElementById('hud-energy');
  if (!el || !p.hasCreatedCharacter) return;
  const family = p.familyId ? MAFIA_FAMILIES_LIST.find(f => f.id === p.familyId) : undefined;
  const bonus = family ? family.buffs.energyRegenBonusPct : 0;
  const ms = msToNextEnergy(p.energy, p.maxEnergy, p.lastEnergyAt, Date.now(), bonus);
  const secs = Math.ceil(ms / 1000);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  el.textContent = `${p.energy} / ${p.maxEnergy}`;
  el.title = ms > 0 ? `Próxima energia em ${clock}` : 'Energia cheia';
}

setInterval(() => {
  gameState.tickEnergy();
  updateEnergyHUD();
}, 1000);

// ENERGY REFILL BUTTON
document.getElementById('quick-refill-energy-btn')?.addEventListener('click', () => {
  const p = gameState.getPlayer();
  if (p.energy >= p.maxEnergy) {
    alert('Sua energia já está no máximo!');
    return;
  }
  if (p.gold >= 5) {
    if (confirm('Recarregar energia completamente por 5 Ouros?')) {
      gameState.spendGold(5);
      gameState.addEnergy(100);
      alert('Energia restaurada para 100!');
    }
  } else {
    alert('Você precisa de 5 Ouros para recarga instantânea de energia!');
  }
});

// SOUND TOGGLE
document.getElementById('audio-toggle-btn')?.addEventListener('click', () => {
  const on = sound.toggle();
  document.getElementById('audio-toggle-btn')!.textContent = on ? '🔊' : '🔇';
});

// NEW CHARACTER BUTTON
document.getElementById('new-character-btn')?.addEventListener('click', () => {
  if (syncEnabled()) {
    alert('Cada conta tem um personagem só. Para jogar com outro, crie outra conta.');
    return;
  }
  if (confirm('Deseja criar um novo gangster? Seu progresso atual será reiniciado.')) {
    gameState.resetAllProgress();
    startCharacterCreation(finishCharacterCreation);
  }
});

// ========================================================
// NAVIGATION TABS CONTROLLER
// ========================================================
document.querySelectorAll('.game-nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.game-nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const tabName = tab.getAttribute('data-tab') || 'perfil';
    renderActiveTab(tabName);
  });
});

function renderActiveTab(tabName: string) {
  // Hide all sections
  document.querySelectorAll('.game-view-section, .view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const targetSec = document.getElementById(`view-${tabName}`);
  if (targetSec) {
    targetSec.classList.add('active');
  }

  switch (tabName) {
    case 'perfil':
      renderProfileView();
      break;
    case 'missoes':
      renderMissionsView();
      break;
    case 'duelos':
      renderDuelsView();
      break;
    case 'loja':
      renderShopView();
      break;
    case 'ranking':
      renderRankingView();
      break;
    case 'familia':
      renderFamilyView();
      break;
    case 'eventos':
      renderEventsView();
      break;
    case 'simulador':
      renderDashboard(activeMatrixLevel);
      break;
  }
}

// ========================================================
// VIEW 1: PERFIL & ATRIBUTOS
// ========================================================
function renderProfileView() {
  const p = gameState.getPlayer();
  if (!p.hasCreatedCharacter) return;

  // 1. Paperdoll & Wielded Weapon
  const avatarSvg = document.getElementById('profile-avatar-svg');
  if (avatarSvg) {
    avatarSvg.innerHTML = renderPaperdollSVG(p.appearance, { width: 260, height: 320 });
  }

  const weaponHolder = document.getElementById('profile-weapon-holder');
  if (weaponHolder) {
    weaponHolder.innerHTML = p.equipped.weaponId ? getWeaponSprite(p.equipped.weaponId, 'A').svg : '';
  }

  // 2. Espaço da arma (abaixo do personagem) e outros equipamentos
  const currentWeapon = equippedWeaponDef(p.equipped.weaponId);
  renderWeaponSlot();

  const armorItem = SHOP_ITEMS.find(i => i.id === p.equipped.armorId);
  document.getElementById('equipped-armor-display')!.textContent = armorItem ? `${armorItem.icon} ${armorItem.name}` : 'Nenhum';

  const accItem = SHOP_ITEMS.find(i => i.id === p.equipped.accessoryId);
  document.getElementById('equipped-acc-display')!.textContent = accItem ? `${accItem.icon} ${accItem.name}` : 'Nenhum';

  // 3. Stats & Evolution
  const combatPoints = gameState.getCombatPoints();
  const input: FighterInput = {
    style: p.style,
    level: p.level,
    points: combatPoints,
    weapon: currentWeapon,
  };
  const stats = derivedStats(input, config);

  document.getElementById('free-points-val')!.textContent = p.freePoints.toString();
  const freeBadge = document.getElementById('free-points-indicator')!;
  freeBadge.style.display = p.freePoints > 0 ? 'inline-block' : 'none';

  // Pontos de cada atributo (o que cada um influencia aparece no balão ao passar o mouse)
  attrInfluence = attributeInfluence(input, config);
  document.getElementById('prof-atk-pts')!.textContent = p.points.attack.toString();
  document.getElementById('prof-life-pts')!.textContent = p.points.life.toString();
  document.getElementById('prof-ast-pts')!.textContent = p.points.astucia.toString();
  document.getElementById('prof-ten-pts')!.textContent = p.points.tenacidade.toString();

  // Training costs
  (['attack', 'life', 'astucia', 'tenacidade'] as const).forEach(stat => {
    const cost = getStatTrainingCost(stat, p.trainedPoints[stat], p.level);
    const costEl = document.getElementById(`train-cost-${stat}`);
    if (costEl) costEl.textContent = `$${cost.toLocaleString()}`;
  });

  // Derived stats summary
  document.getElementById('prof-armor-val')!.textContent = `${(stats.armorReduction * 100).toFixed(0)}%`;
  document.getElementById('prof-dodge-val')!.textContent = `${(stats.dodgeChance * 100).toFixed(0)}%`;

  const [cMin, cMax] = config.styles[p.style].critBonus;
  document.getElementById('prof-critbonus-val')!.textContent = `+${Math.round(cMin * 100)}% a +${Math.round(cMax * 100)}%`;

  let passivesStr = '';
  if (p.style === 'carrasco') passivesStr = 'Golpe de Abertura (+10-100%), Execução (-25% Arm.)';
  else if (p.style === 'muralha') passivesStr = 'Intimidação (-25%), Casca Grossa (x1.4 Ten.)';
  else passivesStr = 'Adaptação (+0.2%/1% HP), Instinto (x1.2 Ast.)';
  document.getElementById('prof-passives-summary')!.textContent = passivesStr;

  // 4. Inventory Slots (12 slots)
  renderInventoryGrid();
}

// STAT BUTTONS (FREE POINTS & CASH TRAINING)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;

  // Free Point Distribute
  const addStat = target.getAttribute('data-stat') as 'attack' | 'life' | 'astucia' | 'tenacidade' | null;
  if (addStat) {
    if (gameState.distributeFreePoint(addStat)) {
      renderProfileView();
    } else {
      alert('Você não possui pontos livres. Suba de nível para obter mais pontos!');
    }
    return;
  }

  // Train with Cash
  const trainStat = target.getAttribute('data-train') as 'attack' | 'life' | 'astucia' | 'tenacidade' | null;
  if (trainStat) {
    const p = gameState.getPlayer();
    const cost = getStatTrainingCost(trainStat, p.trainedPoints[trainStat], p.level);
    if (gameState.trainStatWithCash(trainStat)) {
      sound.playHit();
      renderProfileView();
    } else {
      alert(`Cash insuficiente! Você precisa de $${cost.toLocaleString()} para este treino.`);
    }
    return;
  }
});

// ========================================================
// ESPAÇO DA ARMA, MOCHILA, COMPARAÇÃO E ARRASTAR E SOLTAR
// (R-ARMA-1..5, docs/REGRAS_DO_JOGO.md)
// ========================================================
const escHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Desenha o espaço da arma, abaixo do personagem: arma equipada (ou "desarmado") com dano mínimo e máximo. */
function renderWeaponSlot() {
  const p = gameState.getPlayer();
  const slot = document.getElementById('slot-equipped-weapon');
  const body = document.getElementById('equipped-wep-display');
  const unequipBtn = document.getElementById('btn-unequip-weapon');
  if (!slot || !body) return;

  const armed = !!p.equipped.weaponId;
  const w = equippedWeaponDef(p.equipped.weaponId);
  slot.classList.toggle('empty', !armed);
  body.setAttribute('draggable', armed ? 'true' : 'false');
  if (armed) body.setAttribute('data-weapon-id', w.id);
  else body.removeAttribute('data-weapon-id');
  if (unequipBtn) unequipBtn.style.display = armed ? '' : 'none';

  body.innerHTML = `
    <div class="weapon-slot-art">${getWeaponSprite(w.id, 'preview').svg}</div>
    <div class="weapon-slot-info">
      <strong>${w.icon} ${escHtml(armed ? w.name : 'Desarmado')}</strong>
      <span class="wdmg">Dano: ${damageText(w)}</span>
      <span class="wmeta">${armed ? escHtml(w.categoryName) : 'Só o seu Ataque base causa dano.'}</span>
    </div>`;
}

/** Texto e cores da comparação entre uma arma e a equipada (usado no balão e nos detalhes). */
function comparisonHtml(weaponId: string): string {
  const p = gameState.getPlayer();
  const candidate = getWeaponById(weaponId);
  const equipped = equippedWeaponDef(p.equipped.weaponId);
  const armed = !!p.equipped.weaponId;
  const c: WeaponComparison = compareWeapons(candidate, equipped);
  const cls = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'same');
  const verdictText: Record<WeaponComparison['verdict'], string> = {
    melhor: 'Causa mais dano que a equipada',
    pior: 'Causa menos dano que a equipada',
    igual: 'Mesmo dano da equipada',
    misto: 'Dano mínimo e máximo se comportam diferente',
  };
  return `
    <div class="wtip-vs">Comparada com ${armed ? escHtml(equipped.name) : 'estar desarmado'}:</div>
    <table class="wtip-table">
      <tr><td></td><td>Equipada</td><td>Esta</td><td>Diferença</td></tr>
      <tr><td>Mínimo</td><td>${equipped.min}</td><td>${candidate.min}</td><td class="${cls(c.deltaMin)}">${formatDelta(c.deltaMin)}</td></tr>
      <tr><td>Máximo</td><td>${equipped.max}</td><td>${candidate.max}</td><td class="${cls(c.deltaMax)}">${formatDelta(c.deltaMax)}</td></tr>
      <tr><td>Média</td><td>${damageAverage(equipped)}</td><td>${damageAverage(candidate)}</td><td class="${cls(c.deltaAvg)}">${formatDelta(c.deltaAvg)}</td></tr>
    </table>
    <div class="wtip-verdict ${c.verdict}">${verdictText[c.verdict]}</div>`;
}

function renderInventoryGrid() {
  hideWeaponTooltip();
  const p = gameState.getPlayer();
  const grid = document.getElementById('inventory-grid');
  if (!grid) return;

  const bag = bagEntries(p.inventory, p.equipped.weaponId);
  const capacity = gameState.getBagCapacity();
  const totalSlots = bagSlotCount(bag.length, capacity);
  let html = '';

  for (let i = 0; i < totalSlots; i++) {
    const entry = bag[i];
    if (entry) {
      const { item, index } = entry;
      const weaponDef = isWeaponItem(item) ? getWeaponById(item.weaponRefId) : null;
      const isEquipped = !weaponDef && (item.id === p.equipped.armorId || item.id === p.equipped.accessoryId);

      html += `
        <div class="inv-slot ${isEquipped ? 'equipped' : ''} ${weaponDef ? 'is-weapon' : ''}" data-inv-idx="${index}"
             ${weaponDef ? `draggable="true" data-weapon-id="${weaponDef.id}"` : `title="${escHtml(item.name)}"`}>
          <span>${item.icon}</span>
          ${weaponDef ? `<span class="inv-dmg">${damageShort(weaponDef)}</span>` : ''}
          ${isEquipped ? '<span class="inv-slot-badge">USO</span>' : ''}
        </div>
      `;
    } else {
      html += `<div class="inv-slot empty" title="Slot vazio"></div>`;
    }
  }

  grid.innerHTML = html;
  document.getElementById('inv-capacity-count')!.textContent = `${bag.length} / ${capacity} slots${bag.length >= capacity ? ' (cheia)' : ''}`;

  grid.querySelectorAll('.inv-slot[data-inv-idx]').forEach(slot => {
    slot.addEventListener('click', () => {
      const idx = parseInt(slot.getAttribute('data-inv-idx') || '0', 10);
      showInventoryItemDetails(idx);
    });
  });
}

function showInventoryItemDetails(index: number) {
  const p = gameState.getPlayer();
  const item = p.inventory[index];
  const detailsBox = document.getElementById('inv-details-card')!;
  if (!item) {
    detailsBox.innerHTML = '<span class="text-muted" style="font-size: 12px;">Selecione um item da mochila para ver detalhes, equipar ou vender.</span>';
    return;
  }

  const weaponDef = isWeaponItem(item) ? getWeaponById(item.weaponRefId) : null;
  const isEquipped = !weaponDef && (item.id === p.equipped.armorId || item.id === p.equipped.accessoryId);
  const refund = Math.round(item.priceCash * 0.5);

  detailsBox.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <strong style="color: #f1c40f; font-size: 14px;">${item.icon} ${escHtml(item.name)}</strong>
      <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">${item.type}</span>
    </div>
    ${weaponDef ? `<div class="inv-detail-dmg">Dano: ${damageText(weaponDef)}</div>` : ''}
    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">${escHtml(item.description)}</p>
    ${weaponDef ? `<div class="inv-detail-vs">${comparisonHtml(weaponDef.id)}</div>` : ''}
    <div style="display: flex; gap: 8px;">
      ${item.type !== 'consumable' ? `
        <button id="btn-equip-inv" class="arena-btn-primary" style="flex: 1; padding: 6px; font-size: 11px;">
          ${isEquipped ? '✓ Equipado' : weaponDef ? 'Equipar (troca a arma atual)' : 'Equipar'}
        </button>
      ` : `
        <button id="btn-use-inv" class="arena-btn-primary" style="flex: 1; padding: 6px; font-size: 11px;">
          Usar Agora
        </button>
      `}
      <button id="btn-sell-inv" class="arena-btn-secondary" style="padding: 6px 12px; font-size: 11px; color: #e74c3c;">
        Vender (+$${refund})
      </button>
    </div>
  `;

  document.getElementById('btn-equip-inv')?.addEventListener('click', () => {
    if (isWeaponItem(item)) {
      gameState.equipWeaponFromBag(index);
      renderProfileView();
      showInventoryItemDetails(-1); // a arma saiu da mochila: limpa o cartão de detalhes
      return;
    } else if (item.type === 'armor') {
      gameState.equipArmor(item.id);
    } else if (item.type === 'accessory') {
      gameState.equipAccessory(item.id);
    }
    renderProfileView();
  });

  document.getElementById('btn-use-inv')?.addEventListener('click', () => {
    if (gameState.useConsumable(item, index)) {
      renderProfileView();
      showInventoryItemDetails(-1);
    }
  });

  document.getElementById('btn-sell-inv')?.addEventListener('click', () => {
    gameState.sellItem(index);
    renderProfileView();
    detailsBox.innerHTML = '<span class="text-muted" style="font-size: 12px;">Item vendido com sucesso!</span>';
  });
}

// ---------- balão ao passar o mouse (qualquer arma: mochila, loja ou espaço da arma) ----------
const weaponTooltip = document.createElement('div');
weaponTooltip.id = 'weapon-tooltip';
weaponTooltip.className = 'wtip';
weaponTooltip.style.display = 'none';
document.body.appendChild(weaponTooltip);

function hideWeaponTooltip() {
  weaponTooltip.style.display = 'none';
}

function showWeaponTooltip(el: HTMLElement) {
  const id = el.getAttribute('data-weapon-id');
  if (!id) return;
  const w = getWeaponById(id);
  const isEquippedSlot = el.id === 'equipped-wep-display';
  weaponTooltip.innerHTML = `
    <div class="wtip-title">${w.icon} ${escHtml(w.name)}</div>
    <div class="wtip-cat">${escHtml(w.categoryName)}${isEquippedSlot ? ' · equipada' : ''}</div>
    <div class="wtip-dmg">Dano: <b>${w.min}</b> mín – <b>${w.max}</b> máx</div>
    ${isEquippedSlot ? '' : comparisonHtml(id)}`;
  weaponTooltip.style.display = 'block';
}

function moveWeaponTooltip(x: number, y: number) {
  const pad = 14;
  const r = weaponTooltip.getBoundingClientRect();
  let left = x + pad;
  let top = y + pad;
  if (left + r.width > window.innerWidth - 8) left = Math.max(8, x - r.width - pad);
  if (top + r.height > window.innerHeight - 8) top = Math.max(8, y - r.height - pad);
  weaponTooltip.style.left = `${left}px`;
  weaponTooltip.style.top = `${top}px`;
}

let weaponDragActive = false;

/** Influência de cada atributo, recalculada a cada desenho do perfil (usada pelo balão). */
let attrInfluence: Record<AttrKey, AttrInfluence> | null = null;

function showAttrTooltip(el: HTMLElement) {
  const key = el.getAttribute('data-attr-tip') as AttrKey | null;
  if (!key || !attrInfluence) return;
  const i = attrInfluence[key];
  const cappedNote = i.capped ? '<div class="wtip-verdict misto">Teto de 50% atingido</div>' : '';
  const weaponNote =
    key === 'attack'
      ? `<div class="wtip-vs">O dano da arma equipada (${damageText(equippedWeaponDef(gameState.getPlayer().equipped.weaponId))}) é somado a este valor.</div>`
      : '';
  weaponTooltip.innerHTML = `
    <div class="wtip-title">${i.label}: ${i.points} pontos</div>
    <div class="wtip-cat">${i.effect}</div>
    <div class="wtip-dmg">${influenceTitle(i)}: <b>${formatInfluenceValue(i)}</b></div>
    <div class="wtip-vs">Cada ponto a mais: <b class="up">${formatPerPoint(i)}</b></div>
    ${weaponNote}${cappedNote}`;
  weaponTooltip.style.display = 'block';
}

/** Encerra o modo "arrastando". O item arrastado some da tela na troca, e o dragend nunca chega: por isso é chamado também no soltar e no mouse. */
function endWeaponDrag() {
  weaponDrag = null;
  weaponDragActive = false;
  document.body.classList.remove('dragging-weapon');
  document.querySelectorAll('.dragging, .drop-ok, .drop-bad').forEach(n => n.classList.remove('dragging', 'drop-ok', 'drop-bad'));
}

document.addEventListener('mouseover', e => {
  // Durante um arrastar de verdade o navegador não envia eventos de mouse; se chegou um com o botão solto, o arrastar já acabou.
  if (weaponDragActive && (e as MouseEvent).buttons === 0) endWeaponDrag();
  if (weaponDragActive) return;
  const el = (e.target as HTMLElement).closest?.('[data-weapon-id], [data-attr-tip]') as HTMLElement | null;
  if (!el) return;
  if (el.hasAttribute('data-attr-tip')) showAttrTooltip(el);
  else showWeaponTooltip(el);
  moveWeaponTooltip((e as MouseEvent).clientX, (e as MouseEvent).clientY);
});
document.addEventListener('mousemove', e => {
  if (weaponTooltip.style.display === 'none') return;
  moveWeaponTooltip((e as MouseEvent).clientX, (e as MouseEvent).clientY);
});
document.addEventListener('mouseout', e => {
  const el = (e.target as HTMLElement).closest?.('[data-weapon-id], [data-attr-tip]') as HTMLElement | null;
  if (!el) return;
  const to = (e as MouseEvent).relatedTarget as Node | null;
  if (to && el.contains(to)) return;
  hideWeaponTooltip();
});
window.addEventListener('blur', hideWeaponTooltip);

// ---------- arrastar e soltar ----------
type WeaponDrag = { kind: 'inv'; index: number } | { kind: 'slot' };
let weaponDrag: WeaponDrag | null = null;

document.addEventListener('dragstart', e => {
  const el = (e.target as HTMLElement).closest?.('[draggable="true"]') as HTMLElement | null;
  if (!el) return;
  if (el.id === 'equipped-wep-display') weaponDrag = { kind: 'slot' };
  else if (el.classList.contains('is-weapon') && el.dataset.invIdx !== undefined) weaponDrag = { kind: 'inv', index: parseInt(el.dataset.invIdx, 10) };
  else return;
  weaponDragActive = true;
  hideWeaponTooltip();
  e.dataTransfer?.setData('text/plain', JSON.stringify(weaponDrag));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  el.classList.add('dragging');
  document.body.classList.add('dragging-weapon');
});

document.addEventListener('dragend', endWeaponDrag);

/** Guarda a arma na mochila; se estiver cheia, avisa em vez de falhar calado. */
function tryUnequipWeapon() {
  if (gameState.getPlayer().equipped.weaponId && !gameState.bagHasRoom()) {
    alert(`Mochila cheia (${gameState.getBagCount()}/${gameState.getBagCapacity()}). Venda ou use um item para abrir espaço antes de guardar a arma.`);
    return;
  }
  gameState.unequipWeapon();
  renderProfileView();
}

function bindWeaponDropZones() {
  const slot = document.getElementById('slot-equipped-weapon');
  const bagPanel = document.querySelector('.profile-inventory-panel') as HTMLElement | null;
  if (!slot || !bagPanel) return;

  // Espaço da arma: aceita arma vinda da mochila (troca)
  slot.addEventListener('dragover', e => {
    if (!weaponDrag) return;
    const ok = weaponDrag.kind === 'inv' && isWeaponItem(gameState.getPlayer().inventory[weaponDrag.index]);
    slot.classList.toggle('drop-ok', ok);
    slot.classList.toggle('drop-bad', !ok);
    if (ok) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    }
  });
  slot.addEventListener('dragleave', e => {
    if (!slot.contains(e.relatedTarget as Node | null)) slot.classList.remove('drop-ok', 'drop-bad');
  });
  slot.addEventListener('drop', e => {
    e.preventDefault();
    slot.classList.remove('drop-ok', 'drop-bad');
    if (weaponDrag && weaponDrag.kind === 'inv') {
      const index = weaponDrag.index;
      endWeaponDrag();
      gameState.equipWeaponFromBag(index);
      renderProfileView();
    }
  });

  // Mochila: aceita a arma equipada (guardar)
  bagPanel.addEventListener('dragover', e => {
    if (!weaponDrag || weaponDrag.kind !== 'slot') return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    bagPanel.classList.add('drop-ok');
  });
  bagPanel.addEventListener('dragleave', e => {
    if (!bagPanel.contains(e.relatedTarget as Node | null)) bagPanel.classList.remove('drop-ok');
  });
  bagPanel.addEventListener('drop', e => {
    e.preventDefault();
    bagPanel.classList.remove('drop-ok');
    if (weaponDrag && weaponDrag.kind === 'slot') {
      endWeaponDrag();
      tryUnequipWeapon();
    }
  });

  document.getElementById('btn-unequip-weapon')?.addEventListener('click', tryUnequipWeapon);
}
bindWeaponDropZones();

// ========================================================
// VIEW 2: MISSÕES DO DON (GODFATHER QUESTS)
// ========================================================
function renderMissionsView() {
  const container = document.getElementById('missions-list-container');
  if (!container) return;

  const player = gameState.getPlayer();

  container.innerHTML = MISSIONS_LIST.map(m => {
    const oppWeapon = getWeaponById(m.opponent.weaponId);
    return `
      <div class="mission-card-item">
        <span class="mission-chapter-tag">${m.chapter} • ${m.location}</span>
        <div class="mission-title-row">
          <h4>${m.icon} ${m.title}</h4>
          <span class="mission-energy-badge">-${m.energyCost} Energia</span>
        </div>
        <p class="mission-brief-text">${m.briefing}</p>

        <div style="font-size: 11px; color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px;">
          Inimigo: <strong>${m.opponent.name}</strong> (${m.opponent.style.toUpperCase()} Nv.${m.opponent.level}) • Arma: ${oppWeapon.icon} ${oppWeapon.name}
        </div>

        <div class="mission-rewards-row">
          <span style="color: #2ecc71;">+${m.xpReward} XP</span>
          <span style="color: #f1c40f;">+$${m.cashReward} Cash</span>
          <span style="color: #3498db;">${Math.round(m.itemDropChance * 100)}% Chance de Drop</span>
        </div>

        <button class="arena-btn-primary btn-start-mission" data-mis-id="${m.id}" style="width: 100%; margin-top: 6px;">
          ⚡ Executar Missão (-${m.energyCost}⚡)
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-start-mission').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-mis-id');
      const mission = MISSIONS_LIST.find(m => m.id === id);
      if (!mission) return;

      if (!gameState.consumeEnergy(mission.energyCost)) {
        alert('Energia insuficiente! Aguarde a recarga ou recarregue com Ouro na barra superior.');
        return;
      }

      startMissionCombat(mission);
    });
  });
}

function startMissionCombat(mission: MissionDef) {
  const p = gameState.getPlayer();
  const playerCombatPoints = gameState.getCombatPoints();
  const playerWeapon = equippedWeaponDef(p.equipped.weaponId);

  const inputA: FighterInput = {
    style: p.style,
    level: p.level,
    points: playerCombatPoints,
    weapon: playerWeapon,
  };

  const oppWeapon = getWeaponById(mission.opponent.weaponId);
  const inputB: FighterInput = {
    style: mission.opponent.style,
    level: mission.opponent.level,
    points: mission.opponent.points,
    weapon: oppWeapon,
  };

  launchArenaCombatModal(
    inputA,
    inputB,
    p.appearance,
    mission.opponent.appearance,
    (won) => {
      if (won) {
        let dropMsg = '';
        if (Math.random() < mission.itemDropChance && mission.possibleDropId) {
          const dropItem = SHOP_ITEMS.find(i => i.id === mission.possibleDropId);
          if (dropItem) {
            const coube = gameState.buyItem({ ...dropItem, priceCash: 0, priceGold: 0 });
            dropMsg = coube
              ? `<div style="margin-top: 8px; color: #f1c40f;">🎁 Drop de Item Raro: <strong>${dropItem.icon} ${dropItem.name}</strong> adicionado à mochila!</div>`
              : `<div style="margin-top: 8px; color: #e67e22;">🎁 Caiu <strong>${dropItem.icon} ${dropItem.name}</strong>, mas a mochila está cheia (${gameState.getBagCount()}/${gameState.getBagCapacity()}) e o item foi perdido. Abra espaço antes da próxima missão.</div>`;
          }
        }

        const leveledUp = gameState.addXp(mission.xpReward);
        gameState.addCash(mission.cashReward);
        gameState.addRespect(15);
        gameState.recordMissionCompleted();

        showOutcomePopup(
          '🏆 MISSÃO CUMPRIDA!',
          `Você neutralizou ${mission.opponent.name} e executou a missão com perfeição.`,
          `
            <div style="font-size: 14px; font-weight: 700; color: #2ecc71;">+${mission.xpReward} XP Ganho</div>
            <div style="font-size: 14px; font-weight: 700; color: #f1c40f;">+$${mission.cashReward} Cash Saqueado</div>
            <div style="font-size: 13px; font-weight: 700; color: #e67e22;">+15 Respeito para a Família</div>
            ${dropMsg}
            ${leveledUp ? '<div style="margin-top: 10px; font-size: 16px; color: #d4af37; font-weight: 900;">⭐ VOCÊ SUBIU DE NÍVEL! (+4 Pontos Livres)</div>' : ''}
          `
        );
      } else {
        showOutcomePopup(
          '💀 MISSÃO FALHOU!',
          `Você foi emboscado e superado por ${mission.opponent.name}. Recupere suas energias e prepare melhor seu armamento antes de tentar novamente.`,
          `<span style="color: #e74c3c; font-size: 13px;">Nenhuma recompensa obtida. A Família espera mais de você.</span>`
        );
      }
    }
  );
}

// ========================================================
// VIEW 3: DUELOS (ARENA PvP MATCHMAKING)
// ========================================================
let cachedRivals: DuelRival[] = [];

let realRivalsCache: { at: number; rows: PublicPlayer[]; error: string | null } | null = null;
const REAL_CACHE_MS = 20000;

function renderDuelsView() {
  if (!syncEnabled()) return renderNpcDuelsView();
  const container = document.getElementById('duels-rivals-container');
  if (!container) return;
  const lvl = gameState.getPlayer().level;
  if (!realRivalsCache) container.innerHTML = '<p style="padding:12px;color:var(--text-muted);">Procurando rivais...</p>';
  else paintRealRivals(container, lvl);
  if (!realRivalsCache || Date.now() - realRivalsCache.at > REAL_CACHE_MS) void loadRealRivals();
}

async function loadRealRivals() {
  if (!currentUserId) return;
  const r = await fetchRivals(currentUserId, gameState.getPlayer().level, DUEL.levelRange);
  realRivalsCache = { at: Date.now(), rows: r.rows, error: r.error };
  const container = document.getElementById('duels-rivals-container');
  const active = document.querySelector('.game-nav-tab.active')?.getAttribute('data-tab');
  if (container && active === 'duelos') paintRealRivals(container, gameState.getPlayer().level);
}

function paintRealRivals(container: HTMLElement, myLevel: number) {
  const cache = realRivalsCache;
  if (!cache) return;
  if (cache.error) {
    container.innerHTML = `<p style="padding:12px;color:#e67e22;">Não deu para carregar os rivais agora. Se o problema continuar, o banco pode estar sem a migração 002. Detalhe: ${escHtml(cache.error)}</p>`;
    return;
  }
  if (cache.rows.length === 0) {
    container.innerHTML = `<p style="padding:12px;color:var(--text-muted);">Nenhum outro jogador entre os níveis ${Math.max(1, myLevel - DUEL.levelRange)} e ${myLevel + DUEL.levelRange} ainda. Chame um amigo para criar uma conta!</p>`;
    return;
  }
  container.innerHTML = cache.rows.map(r => {
    const rWep = equippedWeaponDef(r.weapon_id);
    return `
      <div class="rival-card-item">
        <div class="rival-thumb-wrap">
          ${renderPaperdollSVG(r.appearance, { width: 68, height: 75 })}
        </div>
        <div class="rival-info-col">
          <div class="rival-name">${escHtml(r.name)}</div>
          <div class="rival-meta-badges">
            <span class="gg-style-badge badge-${r.style}">${r.style.toUpperCase()}</span>
            <span class="gg-level-badge">NV ${r.level}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">
            Arma: ${rWep.icon ?? ''} ${rWep.name} • Respeito: ⭐${r.respect} • ${r.duels_won}V / ${r.duels_lost}D
          </div>
          <button class="arena-btn-primary btn-challenge-real" data-riv-id="${r.id}" style="padding: 6px 14px; font-size: 12px; width: 100%;">
            ⚔️ Desafiar Duelo • Saquear $${duelBounty(r.level)}
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll<HTMLButtonElement>('.btn-challenge-real').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-riv-id');
      if (id) void challengeRealRival(id, btn);
    });
  });
}

/** Duelo de verdade: o servidor luta e paga; aqui só se reproduz o replay e se mostra o resultado. */
async function challengeRealRival(opponentId: string, btn?: HTMLButtonElement) {
  if (btn) btn.disabled = true;
  await flushSave(); // o servidor usa o seu personagem salvo: manda o que estiver pendente
  const r = await duelOnServer(opponentId);
  const d = r.body;
  if (!d.ok || !d.events || !d.attacker || !d.defender || !d.save || !d.rewards || d.firstAttacker === undefined) {
    alert(d.message ?? 'Não foi possível duelar agora. Tente de novo.');
    realRivalsCache = null;
    renderDuelsView();
    return;
  }
  const reply = d as DuelReply;
  launchArenaCombatModal(
    reply.attacker.input,
    reply.defender.input,
    gameState.getPlayer().appearance,
    reply.defender.appearance,
    won => {
      gameState.adoptServerSave(reply.save); // só agora o resultado aparece no HUD
      const rw = reply.rewards;
      if (won) {
        showOutcomePopup(
          '🏆 DUELO VENCIDO!',
          `Você derrotou ${reply.defender.name} na Arena Clandestina.`,
          `
            <div style="font-size: 14px; font-weight: 700; color: #f1c40f;">+$${rw.cash} Cash Saqueado</div>
            <div style="font-size: 14px; font-weight: 700; color: #e67e22;">+${rw.respect} Respeito ⭐</div>
            <div style="font-size: 13px; font-weight: 700; color: #2ecc71;">+${rw.xp} XP de Duelo</div>
            ${rw.leveledUp ? '<div style="margin-top: 10px; font-size: 16px; color: #d4af37; font-weight: 900;">⭐ VOCÊ SUBIU DE NÍVEL!</div>' : ''}
          `,
        );
      } else {
        showOutcomePopup(
          '💀 DERROTA NO DUELO',
          `${reply.defender.name} venceu esta luta.`,
          `<span style="color: #e74c3c;">${rw.respect} Respeito. Treine seus atributos e melhore sua arma!</span>`,
        );
      }
      realRivalsCache = null;
      rankingCache = null;
    },
    { events: reply.events, firstAttacker: reply.firstAttacker },
  );
}

function renderNpcDuelsView() {
  const container = document.getElementById('duels-rivals-container');
  if (!container) return;

  const player = gameState.getPlayer();
  if (cachedRivals.length === 0) {
    cachedRivals = generateRivalPool(player.level);
  }

  container.innerHTML = cachedRivals.map(r => {
    const rWep = getWeaponById(r.weaponId);
    return `
      <div class="rival-card-item">
        <div class="rival-thumb-wrap">
          ${renderPaperdollSVG(r.appearance, { width: 68, height: 75 })}
        </div>
        <div class="rival-info-col">
          <div class="rival-name">${r.name}</div>
          <div class="rival-meta-badges">
            <span class="gg-style-badge badge-${r.style}">${r.style.toUpperCase()}</span>
            <span class="gg-level-badge">NV ${r.level}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">
            Arma: ${rWep.icon} ${rWep.name} • Respeito: ⭐${r.respect}
          </div>
          <button class="arena-btn-primary btn-challenge-rival" data-riv-id="${r.id}" style="padding: 6px 14px; font-size: 12px; width: 100%;">
            ⚔️ Desafiar Duelo • Saquear $${r.bountyCash}
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-challenge-rival').forEach(btn => {
    btn.addEventListener('click', () => {
      const rivId = btn.getAttribute('data-riv-id');
      const rival = cachedRivals.find(r => r.id === rivId);
      if (!rival) return;

      startDuelCombat(rival); // duelo não gasta energia (decisão do fundador)
    });
  });
}

document.getElementById('refresh-rivals-btn')?.addEventListener('click', () => {
  if (syncEnabled()) {
    realRivalsCache = null;
    renderDuelsView();
    return;
  }
  const player = gameState.getPlayer();
  cachedRivals = generateRivalPool(player.level);
  renderDuelsView();
});

function startDuelCombat(rival: DuelRival) {
  const p = gameState.getPlayer();
  const playerCombatPoints = gameState.getCombatPoints();
  const playerWeapon = equippedWeaponDef(p.equipped.weaponId);

  const inputA: FighterInput = {
    style: p.style,
    level: p.level,
    points: playerCombatPoints,
    weapon: playerWeapon,
  };

  const rivalWeapon = getWeaponById(rival.weaponId);
  const inputB: FighterInput = {
    style: rival.style,
    level: rival.level,
    points: rival.points,
    weapon: rivalWeapon,
  };

  launchArenaCombatModal(
    inputA,
    inputB,
    p.appearance,
    rival.appearance,
    (won) => {
      if (won) {
        gameState.addCash(rival.bountyCash);
        gameState.addRespect(25);
        const leveledUp = gameState.addXp(60);
        gameState.recordDuelResult(true, 500);

        showOutcomePopup(
          '🏆 DUELO VENCIDO!',
          `Você derrotou ${rival.name} na Arena Clandestina e humilhou a facção rival!`,
          `
            <div style="font-size: 14px; font-weight: 700; color: #f1c40f;">+$${rival.bountyCash} Cash Roubado do Rival</div>
            <div style="font-size: 14px; font-weight: 700; color: #e67e22;">+25 Respeito Conquistado ⭐</div>
            <div style="font-size: 13px; font-weight: 700; color: #2ecc71;">+60 XP de Duelo</div>
            ${leveledUp ? '<div style="margin-top: 10px; font-size: 16px; color: #d4af37; font-weight: 900;">⭐ VOCÊ SUBIU DE NÍVEL!</div>' : ''}
          `
        );
      } else {
        gameState.recordDuelResult(false, 200);
        showOutcomePopup(
          '💀 DERROTA NO DUELO',
          `${rival.name} superou seus reflexos nesta luta. Você perdeu 10 pontos de Respeito no submundo.`,
          `<span style="color: #e74c3c;">-10 Respeito. Treine seus atributos e melhore sua arma!</span>`
        );
      }
    }
  );
}

// ========================================================
// VIEW 4: MERCADO CLANDESTINO (LOJA DE ARMAS & ITENS)
// ========================================================
let activeShopFilter = 'all';

function renderShopView() {
  const container = document.getElementById('shop-items-container');
  if (!container) return;
  hideWeaponTooltip();

  const player = gameState.getPlayer();

  const filtered = activeShopFilter === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(i => i.type === activeShopFilter);

  container.innerHTML = filtered.map(item => {
    const meetsLevel = player.level >= item.levelReq;
    const canAffordCash = player.cash >= item.priceCash;
    const canAffordGold = player.gold >= item.priceGold;
    const canBuy = meetsLevel && canAffordCash && canAffordGold;
    const shopWeapon = item.weaponRefId ? getWeaponById(item.weaponRefId) : null;

    return `
      <div class="shop-item-card" ${shopWeapon ? `data-weapon-id="${shopWeapon.id}"` : ''}>
        <div class="shop-item-header">
          <span class="shop-item-title">${item.icon} ${item.name}</span>
          <span style="font-size: 10px; color: ${meetsLevel ? '#2ecc71' : '#e74c3c'}; font-weight: 700;">
            Nv. Mínimo: ${item.levelReq}
          </span>
        </div>
        <p style="font-size: 12px; color: var(--text-muted);">${item.description}</p>
        ${shopWeapon ? `<div class="shop-item-dmg">Dano: ${damageText(shopWeapon)}</div>` : ''}
        <div class="shop-item-price-row">
          <span style="font-weight: 800; color: #f1c40f; font-size: 13px;">
            ${item.priceCash > 0 ? `$${item.priceCash.toLocaleString()} ` : ''}
            ${item.priceGold > 0 ? `🪙 ${item.priceGold}` : ''}
          </span>
          <button class="arena-btn-primary btn-buy-shop-item" data-item-id="${item.id}" ${canBuy ? '' : 'disabled'} style="padding: 4px 12px; font-size: 11px;">
            Comprar
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-buy-shop-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-item-id');
      const item = SHOP_ITEMS.find(i => i.id === id);
      if (!item) return;

      const reason = gameState.buyBlockReason(item);
      if (reason === null && gameState.buyItem(item)) {
        sound.playCrit();
        alert(`Você adquiriu ${item.name}.`);
        renderShopView();
      } else {
        const msg: Record<string, string> = {
          nivel: `Você precisa do nível ${item.levelReq} para comprar este item.`,
          ouro: 'Ouro insuficiente para esta compra.',
          cash: 'Cash insuficiente para esta compra.',
          mochila: `Mochila cheia (${gameState.getBagCount()}/${gameState.getBagCapacity()}). Venda ou use um item para abrir espaço.`,
        };
        alert(msg[reason ?? 'cash']);
      }
    });
  });
}

// SHOP CATEGORY TABS
document.querySelectorAll('#shop-category-filters .choice-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#shop-category-filters .choice-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeShopFilter = btn.getAttribute('data-scat') || 'all';
    renderShopView();
  });
});

// ========================================================
// VIEW 5: RANKING DA CIDADE
// ========================================================
let rankingCache: { at: number; rows: PublicPlayer[]; error: string | null } | null = null;

function renderRankingView() {
  if (!syncEnabled()) return renderNpcRankingView();
  const tbody = document.getElementById('ranking-table-body');
  if (!tbody) return;
  const note = document.querySelector('#view-ranking .npc-note');
  if (note) note.textContent = 'Ranking de jogadores reais, ordenado por Respeito. Duelos e missões dão Respeito.';
  if (!rankingCache) tbody.innerHTML = '<tr><td colspan="7" style="padding:14px;">Carregando o ranking...</td></tr>';
  else paintRealRanking(tbody);
  if (!rankingCache || Date.now() - rankingCache.at > REAL_CACHE_MS) void loadRanking();
}

async function loadRanking() {
  const r = await fetchRanking();
  rankingCache = { at: Date.now(), rows: r.rows, error: r.error };
  const tbody = document.getElementById('ranking-table-body');
  const active = document.querySelector('.game-nav-tab.active')?.getAttribute('data-tab');
  if (tbody && active === 'ranking') paintRealRanking(tbody);
}

function paintRealRanking(tbody: HTMLElement) {
  const cache = rankingCache;
  if (!cache) return;
  if (cache.error) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:14px;color:#e67e22;">Não deu para carregar o ranking agora. Detalhe: ${escHtml(cache.error)}</td></tr>`;
    return;
  }
  const myLevel = gameState.getPlayer().level;
  tbody.innerHTML = cache.rows.map((r, i) => {
    const me = r.id === currentUserId;
    const fam = MAFIA_FAMILIES_LIST.find(f => f.id === r.family_id);
    const inRange = !me && Math.abs(r.level - myLevel) <= DUEL.levelRange;
    const action = me
      ? '<span style="font-size: 11px; color: #2ecc71;">Seu Personagem</span>'
      : inRange
        ? `<button class="arena-btn-primary rank-duel-btn" data-riv-id="${r.id}" style="padding: 3px 10px; font-size: 11px;">⚔️ Duelar</button>`
        : '<span style="font-size: 11px; color: var(--text-muted);">fora da faixa de nível</span>';
    return `
      <tr class="${me ? 'player-rank-row' : ''}">
        <td><strong${me ? ' style="color: #f1c40f;"' : ''}>#${i + 1}</strong></td>
        <td>${me ? '<strong>' : ''}${escHtml(r.name)}${me ? ' (Você)</strong>' : ''}</td>
        <td><span class="gg-style-badge badge-${r.style}">${r.style.toUpperCase()}</span></td>
        <td>Nv. ${r.level}</td>
        <td>${fam ? escHtml(fam.name) : 'Sem Família'}</td>
        <td style="color: #f1c40f; font-weight: 700;">⭐ ${r.respect.toLocaleString()} <span style="font-size: 10px; color: var(--text-muted);">(${r.duels_won}V/${r.duels_lost}D)</span></td>
        <td>${action}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="7" style="padding:14px;">Ninguém no ranking ainda.</td></tr>';

  tbody.querySelectorAll<HTMLButtonElement>('.rank-duel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-riv-id');
      if (id) void challengeRealRival(id, btn);
    });
  });
}

function renderNpcRankingView() {
  const tbody = document.getElementById('ranking-table-body');
  if (!tbody) return;

  const player = gameState.getPlayer();

  const mockRankings = [
    { rank: 1, name: 'Don Carmine Falcone', style: 'carrasco', level: 32, family: 'Família Falcone', respect: 4200 },
    { rank: 2, name: 'Salvatore "A Muralha"', style: 'muralha', level: 28, family: 'Família Corleone', respect: 3500 },
    { rank: 3, name: 'Lucky Luciano', style: 'malandro', level: 25, family: 'Sindicato Luciano', respect: 2950 },
    { rank: 4, name: 'Vito "Carcereiro"', style: 'muralha', level: 22, family: 'Família Gambino', respect: 2400 },
    { rank: 5, name: 'Tony "Garganta de Aço"', style: 'carrasco', level: 19, family: 'Família Corleone', respect: 1980 },
    { rank: 6, name: 'Gina "Dama de Espadas"', style: 'malandro', level: 16, family: 'Sindicato Luciano', respect: 1600 },
  ];

  // Posição do jogador: conta quantos NPCs têm mais Respeito (empate favorece o NPC)
  const playerFamily = MAFIA_FAMILIES_LIST.find(f => f.id === player.familyId);
  type RankRow = { name: string; style: string; level: number; family: string; respect: number; isPlayer: boolean };
  const rows: RankRow[] = [
    ...mockRankings.map(r => ({ name: r.name, style: r.style, level: r.level, family: r.family, respect: r.respect, isPlayer: false })),
    {
      name: player.name,
      style: player.style,
      level: player.level,
      family: playerFamily ? playerFamily.name : 'Sem Família',
      respect: player.respect,
      isPlayer: true,
    },
  ];
  // Ordenação estável: em empate, o NPC (que veio primeiro na lista) fica acima do jogador
  rows.sort((a, b) => b.respect - a.respect);

  const html = rows.map((r, i) => r.isPlayer ? `
      <tr class="player-rank-row">
        <td><strong style="color: #f1c40f;">#${i + 1}</strong></td>
        <td><strong>${r.name} (Você)</strong></td>
        <td><span class="gg-style-badge badge-${r.style}">${r.style.toUpperCase()}</span></td>
        <td><strong>Nv. ${r.level}</strong></td>
        <td>${r.family}</td>
        <td style="color: #f1c40f; font-weight: 800;">⭐ ${r.respect.toLocaleString()}</td>
        <td><span style="font-size: 11px; color: #2ecc71;">Seu Personagem</span></td>
      </tr>
    ` : `
      <tr>
        <td><strong>#${i + 1}</strong></td>
        <td>${r.name}</td>
        <td><span class="gg-style-badge badge-${r.style}">${r.style.toUpperCase()}</span></td>
        <td>Nv. ${r.level}</td>
        <td>${r.family}</td>
        <td style="color: #f1c40f; font-weight: 700;">⭐ ${r.respect.toLocaleString()}</td>
        <td><span style="font-size: 11px; color: var(--text-muted);">NPC</span></td>
      </tr>
    `).join('');

  tbody.innerHTML = html;
}

// ========================================================
// VIEW 6: FAMÍLIA MAFIOSA (CLÃS)
// ========================================================
function renderFamilyView() {
  const banner = document.getElementById('family-header-banner');
  const grid = document.getElementById('family-content-grid');
  if (!banner || !grid) return;

  const player = gameState.getPlayer();
  const currentFam = MAFIA_FAMILIES_LIST.find(f => f.id === player.familyId);

  if (currentFam) {
    banner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <span style="font-size: 11px; color: #2ecc71; font-weight: 700;">✓ VOCÊ É MEMBRO OFICIAL</span>
          <h2 style="color: #d4af37; font-family: var(--font-serif);">${currentFam.emblem} ${currentFam.name}</h2>
          <p style="font-style: italic; color: var(--text-muted); font-size: 13px;">${currentFam.motto}</p>
        </div>
        <div style="display: flex; gap: 14px;">
          <div style="background: rgba(0,0,0,0.4); padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 10px; color: var(--text-muted);">COFRE DA FAMÍLIA</div>
            <div style="font-weight: 800; color: #f1c40f;">$${currentFam.treasuryCash.toLocaleString()}</div>
          </div>
          <button id="donate-clan-cash-btn" class="arena-btn-primary" style="padding: 8px 14px;">
            💵 Doar $500 ao Cofre
          </button>
        </div>
      </div>
      <div style="display: flex; gap: 16px; margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px;">
        <span style="color: #2ecc71;">Bônus Ativo: <strong>+${currentFam.buffs.xpBonusPct}% XP em Missões</strong></span>
        <span style="color: #e74c3c;">Bônus de Ataque: <strong>+${currentFam.buffs.attackBonusPct}% Dano</strong></span>
        <span style="color: #3498db;">Regeneração: <strong>+${currentFam.buffs.energyRegenBonusPct}% Energia</strong></span>
      </div>
    `;

    document.getElementById('donate-clan-cash-btn')?.addEventListener('click', () => {
      if (gameState.spendCash(500)) {
        currentFam.treasuryCash += 500;
        gameState.addRespect(20);
        alert('Você doou $500 para o cofre da Família e ganhou +20 de Respeito!');
        renderFamilyView();
      } else {
        alert('Cash insuficiente para doar!');
      }
    });
  } else {
    banner.innerHTML = `
      <h3>Junte-se a uma Família Mafiosa</h3>
      <p>Filie-se a um sindicato criminoso para obter bônus permanentes de dano, ganho de XP e regeneração de energia.</p>
    `;
  }

  const familyNote = `<p class="npc-note" style="grid-column: 1 / -1;">Por enquanto as Famílias são NPCs e os membros e cofres são ilustrativos. As Famílias com jogadores reais chegam com o servidor.</p>`;

  grid.innerHTML = familyNote + MAFIA_FAMILIES_LIST.map(fam => {
    const isMember = player.familyId === fam.id;
    return `
      <div class="family-card-item">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="font-size: 16px; color: #fff;">${fam.emblem} ${fam.name}</h4>
          <span style="font-size: 11px; color: var(--text-muted);">Membros: ${fam.membersCount}/${fam.maxMembers}</span>
        </div>
        <div style="font-size: 12px; color: #d4af37;">Líder: <strong>${fam.leaderName}</strong></div>
        <p style="font-size: 12px; font-style: italic; color: var(--text-muted);">${fam.motto}</p>
        <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;">
          <span style="color: #2ecc71;">+${fam.buffs.xpBonusPct}% XP de Missões</span>
          <span style="color: #e74c3c;">+${fam.buffs.attackBonusPct}% Bônus de Dano</span>
          <span style="color: #3498db;">+${fam.buffs.energyRegenBonusPct}% Regeneração de Energia</span>
        </div>
        ${isMember ? `
          <button class="arena-btn-secondary" disabled style="width: 100%; border-color: #2ecc71; color: #2ecc71;">
            ✓ Família Atual
          </button>
        ` : `
          <button class="arena-btn-primary btn-join-family" data-fam-id="${fam.id}" style="width: 100%;">
            Jurar Lealdade à Família
          </button>
        `}
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.btn-join-family').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-fam-id');
      if (!id) return;
      gameState.joinFamily(id);
      sound.playCrit();
      alert('Parabéns! Você agora é um membro oficial da Família Mafiosa!');
      renderFamilyView();
    });
  });
}

// ========================================================
// VIEW 7: EVENTOS & CHEFÃO MUNDIAL
// ========================================================
function renderEventsView() {
  const event = CURRENT_RAID_EVENT;
  document.getElementById('raid-title')!.textContent = event.name;
  document.getElementById('raid-desc')!.textContent = event.description;
  document.getElementById('raid-boss-name')!.textContent = event.bossName;

  const hpPct = Math.max(0, (event.bossCurrentHp / event.bossMaxHp) * 100);
  document.getElementById('raid-boss-hp-fill')!.style.width = `${hpPct}%`;
  document.getElementById('raid-boss-hp-text')!.textContent = `${event.bossCurrentHp.toLocaleString()} / ${event.bossMaxHp.toLocaleString()} HP`;

  const attackBtn = document.getElementById('attack-raid-boss-btn');
  if (attackBtn) {
    attackBtn.onclick = () => {
      if (!gameState.consumeEnergy(25)) {
        alert('Você precisa de 25 Energia para desferir um ataque contra o Chefão!');
        return;
      }

      startRaidBossCombat(event);
    };
  }
}

function startRaidBossCombat(event: typeof CURRENT_RAID_EVENT) {
  const p = gameState.getPlayer();
  const playerCombatPoints = gameState.getCombatPoints();
  const playerWeapon = equippedWeaponDef(p.equipped.weaponId);

  const inputA: FighterInput = {
    style: p.style,
    level: p.level,
    points: playerCombatPoints,
    weapon: playerWeapon,
  };

  const bossWeapon = getWeaponById(event.bossWeaponId);
  const inputB: FighterInput = {
    style: event.bossStyle,
    level: 25,
    points: { attack: 80, life: 350, astucia: 40, tenacidade: 60 },
    weapon: bossWeapon,
  };

  const bossAppearance: CharacterAppearance = {
    name: event.bossName,
    gender: 'male',
    skinTone: '#e2b38f',
    hairStyle: 'buzz',
    hairColor: '#eceff1',
    eyeColor: '#546e7a',
    facialHair: 'beard',
    facialHairColor: '#eceff1',
    clothing: 'classic_suit',
    clothingColor: '#102a43',
    clothingSecondaryColor: '#d4af37',
    accessory: 'sunglasses',
    cardBackground: 'bar',
  };

  launchArenaCombatModal(
    inputA,
    inputB,
    p.appearance,
    bossAppearance,
    (won) => {
      // Inflict 4,500 damage to collective raid boss HP
      event.bossCurrentHp = Math.max(0, event.bossCurrentHp - 4500);

      gameState.addXp(180);
      gameState.addCash(1200);
      gameState.addRespect(50);

      showOutcomePopup(
        '💥 ATAQUE DE RAID EXECUTADO!',
        `Você desferiu um ataque devastador causando 4.500 de dano na vida coletiva do Chefão Mundial!`,
        `
          <div style="font-size: 14px; font-weight: 700; color: #2ecc71;">+180 XP Coletivo</div>
          <div style="font-size: 14px; font-weight: 700; color: #f1c40f;">+$1.200 Cash de Saque</div>
          <div style="font-size: 14px; font-weight: 700; color: #e67e22;">+50 Respeito Mundial ⭐</div>
        `
      );
    }
  );
}

// ========================================================
// ARENA COMBAT MODAL ENGINE (REUSABLE FOR MISSIONS, DUELS & EVENTS)
// ========================================================
function launchArenaCombatModal(
  fighterAInput: FighterInput,
  fighterBInput: FighterInput,
  appearanceA: CharacterAppearance,
  appearanceB: CharacterAppearance,
  onFinish: (playerWon: boolean) => void,
  fixed?: { events: FightEvent[]; firstAttacker: 'A' | 'B' }
) {
  currentCombatFighterA = fighterAInput;
  currentCombatFighterB = fighterBInput;
  combatSideAName = appearanceA.name;
  combatSideBName = appearanceB.name;
  activeCombatCallback = onFinish;

  const modal = document.getElementById('combat-overlay-modal')!;
  modal.style.display = 'flex';
  document.getElementById('fight-close-btn')!.style.display = 'none';
  document.getElementById('combat-outcome-popup')!.style.display = 'none';

  // Render Card A
  renderArenaCardVisual('a', fighterAInput, appearanceA);
  // Render Card B
  renderArenaCardVisual('b', fighterBInput, appearanceB);

  // Clear impacts
  clearAllImpacts(modal);

  // Simulate fight with engine
  const seed = Math.floor(Math.random() * 1000000);
  const result = fixed ?? simulateFight(fighterAInput, fighterBInput, config, seed, { withEvents: true });
  currentEvents = result.events ?? [];
  eventIdx = 0;

  const firstFighter = result.firstAttacker === 'A' ? appearanceA.name : appearanceB.name;
  document.getElementById('arena-round-display')!.textContent = `INICIATIVA: ${firstFighter.toUpperCase()} COMEÇA!`;
  document.getElementById('latest-strike-ticker')!.textContent = 'Aperte "INICIAR COMBATE" para ver os disparos!';
}

function renderArenaCardVisual(side: 'a' | 'b', input: FighterInput, appearance: CharacterAppearance) {
  const stats = derivedStats(input, config);
  const wep = input.weapon ? getWeaponById(input.weapon.id || 'colt_1911') : WEAPONS_CATALOG[0];

  document.getElementById(`name-display-${side}`)!.textContent = appearance.name;
  const styleBadge = document.getElementById(`style-badge-${side}`)!;
  styleBadge.textContent = input.style.toUpperCase();
  styleBadge.className = `gg-style-badge badge-${input.style}`;

  document.getElementById(`level-badge-${side}`)!.textContent = `NÍVEL ${input.level}`;
  document.getElementById(`weapon-name-${side}`)!.textContent = `${wep.icon} ${wep.name}`;
  document.getElementById(`weapon-dmg-${side}`)!.textContent = `Dano: ${wep.min}-${wep.max}`;

  document.getElementById(`hp-text-${side}`)!.textContent = `${stats.maxHp} / ${stats.maxHp} (100%)`;
  const hpFill = document.getElementById(`hp-fill-${side}`)!;
  hpFill.style.width = '100%';
  hpFill.className = 'gg-hp-bar-fill';

  document.getElementById(`stat-atk-${side}`)!.textContent = Math.round(stats.attackPower).toLocaleString();
  document.getElementById(`stat-life-${side}`)!.textContent = stats.maxHp.toLocaleString();
  document.getElementById(`stat-ast-${side}`)!.textContent = `${(stats.critChance * 100).toFixed(1)}%`;
  document.getElementById(`stat-ten-${side}`)!.textContent = `${(stats.critReduction * 100).toFixed(1)}%`;

  // Avatar SVG
  const container = document.getElementById(`avatar-container-${side}`)!;
  container.innerHTML = renderPaperdollSVG(appearance, { width: 280, height: 340, pose: 'idle' });

  // Weapon holder
  const weaponHolder = document.getElementById(`weapon-holder-${side}`);
  if (weaponHolder) {
    const sp = getWeaponSprite(wep.id, side === 'a' ? 'A' : 'B');
    weaponHolder.innerHTML = sp.svg;
  }
}

// ARENA CONTROLS IN COMBAT MODAL
document.getElementById('fight-play-btn')?.addEventListener('click', () => {
  if (currentEvents.length > 0 && eventIdx < currentEvents.length) {
    playNextStrike();
  }
});

document.getElementById('fight-step-btn')?.addEventListener('click', () => {
  if (currentEvents.length > 0 && eventIdx < currentEvents.length) {
    applyStrike(currentEvents[eventIdx], true);
    eventIdx++;
    if (eventIdx >= currentEvents.length) {
      const last = currentEvents[currentEvents.length - 1];
      finishCombat(last.attacker);
    }
  }
});

document.getElementById('fight-skip-btn')?.addEventListener('click', () => {
  while (eventIdx < currentEvents.length) {
    applyStrike(currentEvents[eventIdx], false);
    eventIdx++;
  }
  if (currentEvents.length > 0) {
    const last = currentEvents[currentEvents.length - 1];
    finishCombat(last.attacker);
  }
});

document.querySelectorAll('.arena-speed-selector .spd-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.arena-speed-selector .spd-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    speedMs = parseInt(btn.getAttribute('data-speed') ?? '450', 10);
  });
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
  document.getElementById('arena-round-display')!.textContent = `RODADA ${ev.round} • TURNO ${ev.turn}`;

  const defSide = ev.defender.toLowerCase();
  const atkSide = ev.attacker.toLowerCase();
  const defCard = document.getElementById(`gg-card-${defSide}`)!;
  const atkCard = document.getElementById(`gg-card-${atkSide}`)!;
  const defFrame = document.getElementById(`avatar-frame-${defSide}`);
  const atkHolder = document.getElementById(`weapon-holder-${atkSide}`);
  const floatZone = document.getElementById(`float-zone-${defSide}`)!;
  const hpFill = document.getElementById(`hp-fill-${defSide}`)!;
  const hpText = document.getElementById(`hp-text-${defSide}`)!;

  const defInput = defSide === 'a' ? currentCombatFighterA! : currentCombatFighterB!;
  const defStats = derivedStats(defInput, config);

  const pct = Math.max(0, (ev.defenderHpRemaining / defStats.maxHp) * 100);
  hpFill.style.width = `${pct}%`;
  hpText.textContent = `${ev.defenderHpRemaining} / ${defStats.maxHp} (${pct.toFixed(0)}%)`;

  if (pct < 25) hpFill.className = 'gg-hp-bar-fill danger';
  else if (pct < 50) hpFill.className = 'gg-hp-bar-fill warning';

  const atkName = ev.attacker === 'A' ? combatSideAName : combatSideBName;
  const defName = ev.defender === 'A' ? combatSideAName : combatSideBName;
  const atkInput = ev.attacker === 'A' ? currentCombatFighterA! : currentCombatFighterB!;
  const weaponUsed = ev.weaponId ? getWeaponById(ev.weaponId) : (atkInput.weapon ? getWeaponById(atkInput.weapon.id || 'colt_1911') : WEAPONS_CATALOG[0]);

  if (playFx) {
    playWeaponAttackVisual({
      attackerCard: atkCard,
      attackerHolder: atkHolder,
      defenderCard: defCard,
      defenderFrame: defFrame,
      weapon: weaponUsed,
      isCrit: ev.isCrit,
      isDodge: ev.isDodge,
      attackerSide: ev.attacker === 'A' ? 'A' : 'B',
    });

    const floatEl = document.createElement('div');
    if (ev.isDodge) {
      floatEl.className = 'floating-damage-text dodge';
      floatEl.textContent = 'ESQUIVOU!';
    } else if (ev.isCrit) {
      floatEl.className = 'floating-damage-text crit';
      floatEl.textContent = `💥 CRÍTICO! -${ev.finalDamage}`;
    } else {
      floatEl.className = 'floating-damage-text normal';
      floatEl.textContent = `-${ev.finalDamage}`;
    }
    floatZone.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1200);
  }

  const strikeMsg = ev.isDodge
    ? `${atkName} disparou com ${weaponUsed.name}, mas ${defName} ESQUIVOU agilmente!`
    : `${atkName} atacou com ${weaponUsed.name} causando ${ev.finalDamage} de dano em ${defName}!`;

  document.getElementById('latest-strike-ticker')!.textContent = `[R${ev.round}] ${strikeMsg}`;
}

function finishCombat(winnerSide: 'A' | 'B') {
  if (fightTimer) {
    clearTimeout(fightTimer);
    fightTimer = null;
  }
  const isPlayerWinner = winnerSide === 'A';
  const winner = isPlayerWinner ? combatSideAName : combatSideBName;
  document.getElementById('arena-round-display')!.textContent = `🏆 VITÓRIA DE ${winner.toUpperCase()}!`;
  sound.playVictory();

  document.getElementById('fight-close-btn')!.style.display = 'inline-block';

  setTimeout(() => {
    if (activeCombatCallback) {
      activeCombatCallback(isPlayerWinner);
    }
  }, 600);
}

function showOutcomePopup(title: string, desc: string, rewardsHtml: string) {
  const popup = document.getElementById('combat-outcome-popup')!;
  popup.style.display = 'flex';
  document.getElementById('outcome-title')!.textContent = title;
  document.getElementById('outcome-desc')!.textContent = desc;
  document.getElementById('outcome-rewards-box')!.innerHTML = rewardsHtml;

  document.getElementById('outcome-continue-btn')!.onclick = () => {
    popup.style.display = 'none';
    document.getElementById('combat-overlay-modal')!.style.display = 'none';
  };
}

document.getElementById('fight-close-btn')?.addEventListener('click', () => {
  document.getElementById('combat-overlay-modal')!.style.display = 'none';
});

// ========================================================
// PERSONAGEM CRIADO NA PORTA DE ENTRADA
// ========================================================
/**
 * Aplica o personagem montado pelo jogador (visual, classe, arma e nome) ao save atual.
 * `showNow`: false quando o jogo ainda vai abrir logo depois (login recém-feito).
 */
function applyCreatedCharacter(created: CreatedCharacter, showNow = true) {
  const appearance = { ...created.draft.appearance, name: created.name };
  const newPlayer = createNewPlayer(created.name, created.draft.style, appearance, created.draft.weapon);
  Object.assign(gameState.getPlayer(), newPlayer);
  gameState.saveToStorage();
  sound.playCrit();
  if (showNow) {
    updateHUD();
    renderActiveTab('perfil');
  }
}

// ========================================================
// SIMULATOR VIEW INTEGRATION
// ========================================================
function renderDashboard(level: number) {
  activeMatrixLevel = level;
  if (!cachedReport) {
    cachedReport = runFullSimulation([1, 10, 50, 100], 1000, 42, config);
  }

  const matrixObj = cachedReport.baseMatrices.find(m => m.level === level);
  if (!matrixObj) return;

  const tableContainer = document.getElementById('matrix-table-container')!;
  let tableHtml = `
    <table class="matrix-heatmap-table">
      <thead>
        <tr>
          <th>Atacante \\ Defensor</th>
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

document.getElementById('run-browser-sim-btn')?.addEventListener('click', () => {
  const statusEl = document.getElementById('sim-live-status')!;
  statusEl.textContent = 'Simulando 3.000 combates por célula...';
  setTimeout(() => {
    const t0 = performance.now();
    cachedReport = runFullSimulation([1, 10, 50, 100], 3000, Date.now(), config);
    const elapsed = (performance.now() - t0).toFixed(0);
    statusEl.textContent = `Concluído em ${elapsed}ms!`;
    renderDashboard(activeMatrixLevel);
  }, 40);
});

// ========================================================
// START GAME RUNTIME
// ========================================================
window.addEventListener('DOMContentLoaded', () => {
  void boot();
});

// Run immediate in case DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  void boot();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && syncEnabled()) void flushSave();
});
