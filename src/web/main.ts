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
import { GOLD, rollGoldDrop } from '../shared/gold.js';
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

import { ITEM_SLOTS, type ItemSlot } from '../shared/itemRoll.js';
import { applySkin, readSkin, toggleSkin, FOLDER_HEADERS } from './skin.js';
import { notify, ask } from './notice.js';
import { isGearItem, rollRandomGear, GEAR_ICONS } from '../shared/gear.js';
import { ITEM_SLOT_LABELS } from '../shared/itemRoll.js';

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
    el.style.cssText = 'position:fixed;bottom:0.5rem;left:50%;transform:translateX(-50%);z-index:9999;background:#7a4a00;color:#fff;padding:0.375rem 0.875rem;border-radius:0.375rem;font-size:0.75rem;';
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
        void notify({
          kind: 'erro',
          title: 'Progresso não salvo',
          message: 'O servidor não aceitou o seu último progresso, e o personagem voltou ao último estado salvo.',
          detail: message,
        });
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
      void ask({ kind: 'info', title: 'Sair da conta', message: 'Seu progresso já está salvo. Deseja sair da conta?', okLabel: 'Sair', cancelLabel: 'Ficar' }).then(ok => {
        if (!ok) return;
        void flushSave().finally(() => {
          endSync();
          void signOutAccount();
        });
      });
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
// ---------- Subpasta do perfil (R-LAYOUT-10): Mala, Família, Conquistas e Honra ----------
function kvRows(rows: [string, string][]): string {
  return `<dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd class="n">${v}</dd>`).join('')}</dl>`;
}

function renderSubPanes() {
  const p = gameState.getPlayer();

  const fam = p.familyId ? MAFIA_FAMILIES_LIST.find(f => f.id === p.familyId) : undefined;
  const paneFam = document.getElementById('pane-familia');
  if (paneFam) {
    paneFam.innerHTML = fam
      ? `<div class="sp-fam"><div class="sp-emblem" aria-hidden="true">${fam.emblem}</div><div class="sp-body">
           <h4 class="sp-title">${escHtml(fam.name)}</h4>
           <p class="sp-motto">${escHtml(fam.motto)}</p>
           ${kvRows([
             ['Líder', escHtml(fam.leaderName)],
             ['Membros', `${fam.membersCount} / ${fam.maxMembers}`],
             ['Bônus de XP', `+${fam.buffs.xpBonusPct}%`],
             ['Bônus de dano', `+${fam.buffs.attackBonusPct}%`],
             ['Energia', `+${fam.buffs.energyRegenBonusPct}%`],
           ])}
         </div></div>`
      : `<p class="sp-empty">Você ainda não faz parte de uma família. Escolha uma na aba dos três vultos, à esquerda.</p>`;
  }

  const paneConq = document.getElementById('pane-conquistas');
  if (paneConq) {
    paneConq.innerHTML =
      `<div class="sp-achs" aria-label="Conquistas">${Array.from({ length: 10 }, () => '<div class="sp-ach"><svg class="ico" aria-hidden="true"><use href="#i-q"/></svg></div>').join('')}</div>
       <p class="sp-empty">As conquistas ainda não existem. Cada uma vai aparecer aqui quando for desbloqueada.</p>`;
  }

  const paneHonra = document.getElementById('pane-honra');
  if (paneHonra) {
    const r = p.statsRecord;
    const duels = r.duelsWon + r.duelsLost;
    paneHonra.innerHTML = `<div class="sp-honor"><div class="sp-plaque"><small>RESPEITO</small><div class="n">${p.respect.toLocaleString()}</div></div>
      ${kvRows([
        ['Duelos vencidos', `${r.duelsWon} / ${duels}`],
        ['Missões cumpridas', r.missionsCompleted.toLocaleString()],
        ['Maior crítico', Math.round(r.highestCrit).toLocaleString()],
        ['Dano total causado', Math.round(r.totalDamageDealt).toLocaleString()],
      ])}</div>`;
  }
}

document.querySelectorAll<HTMLElement>('.sub-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const pane = tab.dataset.pane;
    document.querySelectorAll<HTMLElement>('.sub-tab').forEach(o => {
      o.classList.toggle('active', o === tab);
      o.setAttribute('aria-selected', String(o === tab));
    });
    document.querySelectorAll<HTMLElement>('.sub-pane').forEach(pn => pn.classList.toggle('active', pn.dataset.pane === pane));
  });
});

/** Orelha e carimbo da pasta da aba aberta (R-LAYOUT-9). */
function updateFolderHeader(tabName?: string) {
  const tab = tabName ?? document.querySelector('.game-nav-tab.active')?.getAttribute('data-tab') ?? 'perfil';
  document.getElementById('app')?.setAttribute('data-tab', tab);
  const h = FOLDER_HEADERS[tab] ?? FOLDER_HEADERS.perfil;
  const p = gameState.getPlayer();
  const title = tab === 'perfil' && p.hasCreatedCharacter ? `${h.title} · ${p.name}` : h.title;
  const t = document.getElementById('folder-title');
  const s = document.getElementById('folder-stamp');
  if (t) t.textContent = title.toUpperCase();
  if (s) s.textContent = h.stamp;
}

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

  const caption = document.getElementById('doll-caption');
  if (caption) caption.textContent = `${p.name} · ${p.style} · NÍVEL ${p.level}`.toUpperCase();
  updateFolderHeader();

  // Mini avatar thumb
  const thumb = document.getElementById('hud-avatar-thumb');
  if (thumb) {
    thumb.innerHTML = renderPaperdollSVG(p.appearance, { width: 3.25, height: 3.75 });
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
    void notify({ kind: 'energia', title: 'Energia cheia', message: 'Sua energia já está no máximo.' });
    return;
  }
  if (p.gold >= 5) {
    void ask({ kind: 'ouro', title: 'Recarregar energia', message: 'Recarregar a energia por completo custa 5 de ouro. Deseja gastar?', okLabel: 'Recarregar', cancelLabel: 'Agora não' }).then(ok => {
      if (!ok) return;
      gameState.spendGold(5);
      gameState.addEnergy(100);
      void notify({ kind: 'sucesso', title: 'Energia restaurada', message: 'Sua energia foi restaurada para 100.', autoCloseMs: 2600 });
    });
  } else {
    void notify({ kind: 'ouro', title: 'Faltam ouros', message: `A recarga instantânea de energia custa 5 de ouro, e você tem ${p.gold}.` });
  }
});

// SOUND TOGGLE
document.getElementById('audio-toggle-btn')?.addEventListener('click', () => {
  const on = sound.toggle();
  document.getElementById('audio-toggle-btn')!.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#${on ? 'i-sound' : 'i-mute'}"/></svg>`;
});

// TEMA DA PASTA (couro e dourado / bege)
applySkin(readSkin());
document.getElementById('skin-toggle-btn')?.addEventListener('click', () => {
  toggleSkin();
});

// NEW CHARACTER BUTTON
document.getElementById('new-character-btn')?.addEventListener('click', () => {
  if (syncEnabled()) {
    void notify({ kind: 'info', title: 'Um personagem por conta', message: 'Cada conta tem um personagem só. Para jogar com outro, crie outra conta.' });
    return;
  }
  void ask({ kind: 'erro', title: 'Novo gangster', message: 'Seu progresso atual será apagado e você recomeça do zero. Deseja continuar?', okLabel: 'Apagar e recomeçar', cancelLabel: 'Voltar' }).then(ok => {
    if (!ok) return;
    gameState.resetAllProgress();
    startCharacterCreation(finishCharacterCreation);
  });
});

// ========================================================
// NAVIGATION TABS CONTROLLER
// ========================================================
document.querySelectorAll('.game-nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.game-nav-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const tabName = tab.getAttribute('data-tab') || 'perfil';
    renderActiveTab(tabName);
  });
});

function renderActiveTab(tabName: string) {
  updateFolderHeader(tabName);
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
      renderRaidEvent(); // a missão especial do servidor (chefão) fica dentro de Missões
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
    case 'distritos':
    case 'tarefas':
    case 'eventos':
      break; // pastas ainda em desenho: só o aviso do HTML
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
    avatarSvg.innerHTML = renderPaperdollSVG(p.appearance, { width: 15.2, height: 16.5 });
  }

  const weaponHolder = document.getElementById('profile-weapon-holder');
  if (weaponHolder) {
    weaponHolder.innerHTML = p.equipped.weaponId ? getWeaponSprite(p.equipped.weaponId, 'A').svg : '';
  }

  // 2. Espaço da arma (abaixo do personagem) e outros equipamentos
  const currentWeapon = equippedWeaponDef(p.equipped.weaponId);
  renderWeaponSlot();

  renderGearSlots();

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
  // Texto que aparece NA BARRA quando o mouse passa em qualquer uma das 4 (R-ATRIBUTO-1): dano, HP, crítico e redução
  const effectLabel = { dano: 'Dano base', hp: 'HP máximo', critico: 'Crítico', reducao: 'Redução' } as const;
  for (const key of ['attack', 'life', 'astucia', 'tenacidade'] as const) {
    const inf = attrInfluence[key];
    document.getElementById(`eff-label-${key}`)!.textContent = effectLabel[inf.kind];
    document.getElementById(`eff-val-${key}`)!.textContent = formatInfluenceValue(inf);
  }
  document.getElementById('prof-atk-pts')!.textContent = p.points.attack.toString();
  document.getElementById('prof-life-pts')!.textContent = p.points.life.toString();
  document.getElementById('prof-ast-pts')!.textContent = p.points.astucia.toString();
  document.getElementById('prof-ten-pts')!.textContent = p.points.tenacidade.toString();

  // O único "+" de cada atributo: verde com pontos livres (gasta um ponto), dourado sem eles (treina com dinheiro).
  // O preço aparece no balão ao passar o mouse (R-ATRIBUTO-1).
  document.querySelectorAll<HTMLElement>('.btn-attr-plus').forEach(btn => btn.classList.toggle('has-free', p.freePoints > 0));

  // 4. Inventory Slots (12 slots)
  renderInventoryGrid();
  renderSubPanes();
}

// STAT BUTTONS (FREE POINTS & CASH TRAINING)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;

  // O único "+" do atributo: com pontos livres gasta um; sem eles, treina pagando cash
  const plusBtn = target.closest?.('[data-plus]') as HTMLElement | null;
  const stat = plusBtn?.getAttribute('data-plus') as 'attack' | 'life' | 'astucia' | 'tenacidade' | null | undefined;
  if (stat) {
    const p = gameState.getPlayer();
    if (p.freePoints > 0) {
      if (gameState.distributeFreePoint(stat)) {
        sound.playHit();
        renderProfileView();
      }
      return;
    }
    const cost = getStatTrainingCost(stat, p.trainedPoints[stat], p.level);
    if (gameState.trainStatWithCash(stat)) {
      sound.playHit();
      renderProfileView();
    } else {
      void notify({ kind: 'cash', title: 'Faltam $', message: `Este treino custa $${cost.toLocaleString()} e você tem $${p.cash.toLocaleString()}. Faltam $${Math.max(0, cost - p.cash).toLocaleString()}.` });
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

/** Os 8 slots do perfil (R-ITEM-2): o item equipado em cada um, com os pontos que ele dá. Clicar num slot cheio desequipa. */
function renderGearSlots() {
  const grid = document.getElementById('gear-slots-grid');
  if (!grid) return;
  const p = gameState.getPlayer();
  grid.innerHTML = ITEM_SLOTS.map(slot => {
    const item = gameState.equippedGear(slot);
    if (!item) {
      return `<div class="gear-slot" data-gear-slot="${slot}" title="${ITEM_SLOT_LABELS[slot]}: vazio"><span class="slot-badge">${ITEM_SLOT_LABELS[slot]}</span><svg class="gear-ico ghost" aria-hidden="true"><use href="#g-${slot}"/></svg></div>`;
    }
    const idx = p.inventory.indexOf(item);
    return `<div class="gear-slot filled" data-gear-slot="${slot}" data-bag-tip="${idx}"><span class="slot-badge">${ITEM_SLOT_LABELS[slot]}</span><svg class="gear-ico" aria-hidden="true"><use href="#g-${slot}"/></svg></div>`;
  }).join('');
}

function renderInventoryGrid() {
  hideWeaponTooltip();
  const p = gameState.getPlayer();
  const grid = document.getElementById('inventory-grid');
  if (!grid) return;

  const bag = bagEntries(p.inventory, p.equipped.weaponId);
  const capacity = gameState.getBagCapacity();
  const layout = gameState.getBagLayout(); // cada item no seu slot (R-MALA-4)
  const totalSlots = layout.length;
  let html = '';

  for (let i = 0; i < totalSlots; i++) {
    const entry = layout[i];
    if (entry) {
      const { item, index } = entry;
      const weaponDef = isWeaponItem(item) ? getWeaponById(item.weaponRefId) : null;
      const isEquipped = !weaponDef && isGearEquipped(item);

      html += `
        <div class="inv-slot ${isEquipped ? 'equipped' : ''} ${weaponDef ? 'is-weapon' : ''}" data-inv-idx="${index}" data-slot="${i}" draggable="true"
             data-bag-tip="${index}" ${weaponDef ? `data-weapon-id="${weaponDef.id}"` : ''}>
          <span>${item.icon}</span>
          ${weaponDef ? `<span class="inv-dmg">${damageShort(weaponDef)}</span>` : ''}
          ${isEquipped ? '<span class="inv-slot-badge">USO</span>' : ''}
        </div>
      `;
    } else {
      html += `<div class="inv-slot empty" data-slot="${i}"></div>`;
    }
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.inv-slot[data-inv-idx]').forEach(slot => {
    slot.addEventListener('click', () => {
      const idx = parseInt(slot.getAttribute('data-inv-idx') || '0', 10);
      showInventoryItemDetails(idx);
    });
  });
}

/** O item dos 8 slots está equipado agora? */
function isGearEquipped(item: GameItem): boolean {
  return isGearItem(item) && gameState.getPlayer().equipped.gear[item.gear.slot] === item.id;
}

function showInventoryItemDetails(index: number) {
  const p = gameState.getPlayer();
  const item = p.inventory[index];
  const detailsBox = document.getElementById('inv-details-card')!;
  if (!item) {
    // sem item escolhido, a caixa de detalhes some (R-MALA-5)
    detailsBox.style.display = 'none';
    detailsBox.innerHTML = '';
    return;
  }
  detailsBox.style.display = '';

  const weaponDef = isWeaponItem(item) ? getWeaponById(item.weaponRefId) : null;
  const isEquipped = !weaponDef && isGearEquipped(item);
  const refund = Math.round(item.priceCash * 0.5);

  detailsBox.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem;">
      <strong style="color: #f1c40f; font-size: 0.875rem;">${item.icon} ${escHtml(item.name)}</strong>
      <span style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase;">${item.type}</span>
    </div>
    ${weaponDef ? `<div class="inv-detail-dmg">Dano: ${damageText(weaponDef)}</div>` : ''}
    <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.625rem;">${escHtml(item.description)}</p>
    ${weaponDef ? `<div class="inv-detail-vs">${comparisonHtml(weaponDef.id)}</div>` : ''}
    <div style="display: flex; gap: 0.5rem;">
      ${item.type !== 'consumable' ? `
        <button id="btn-equip-inv" class="arena-btn-primary" style="flex: 1; padding: 0.375rem; font-size: 0.6875rem;">
          ${isEquipped ? '✓ Equipado' : weaponDef ? 'Equipar (troca a arma atual)' : 'Equipar'}
        </button>
      ` : `
        <button id="btn-use-inv" class="arena-btn-primary" style="flex: 1; padding: 0.375rem; font-size: 0.6875rem;">
          Usar Agora
        </button>
      `}
      <button id="btn-sell-inv" class="arena-btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.6875rem; color: #e74c3c;">
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
    } else if (isGearItem(item)) {
      gameState.equipGear(item.id);
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
    detailsBox.style.display = 'none';
    detailsBox.innerHTML = '';
  });
}

// clicar num slot cheio do perfil desequipa o item (ele continua na Mala)
document.addEventListener('click', e => {
  const cell = (e.target as HTMLElement).closest?.('.gear-slot.filled[data-gear-slot]') as HTMLElement | null;
  if (!cell) return;
  gameState.unequipGear(cell.getAttribute('data-gear-slot') as ItemSlot);
  renderProfileView();
});

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

const ITEM_TYPE_LABEL: Record<string, string> = { weapon: 'Arma', armor: 'Armadura', accessory: 'Acessório', consumable: 'Consumível' };

/** Balão de qualquer item da Mala (R-MALA-6): tipo, nome, atributos e preço. */
function showBagItemTooltip(el: HTMLElement) {
  const idx = parseInt(el.getAttribute('data-bag-tip') || '-1', 10);
  const item = gameState.getPlayer().inventory[idx];
  if (!item) return;
  const weaponDef = isWeaponItem(item) ? getWeaponById(item.weaponRefId) : null;
  const lines: string[] = [];
  if (weaponDef) lines.push(`Dano: <b>${weaponDef.min}</b> mín – <b>${weaponDef.max}</b> máx`);
  const b = item.statsBonus;
  if (b) {
    if (b.attack) lines.push(`Ataque: <b class="up">+${b.attack}</b>`);
    if (b.life) lines.push(`Vida: <b class="up">+${b.life}</b>`);
    if (b.astucia) lines.push(`Astúcia: <b class="up">+${b.astucia}</b>`);
    if (b.tenacidade) lines.push(`Tenacidade: <b class="up">+${b.tenacidade}</b>`);
    if (b.armorReduction) lines.push(`Redução de dano: <b class="up">+${Math.round(b.armorReduction * 100)}%</b>`);
    if (b.dodgeChance) lines.push(`Esquiva: <b class="up">+${Math.round(b.dodgeChance * 100)}%</b>`);
  }
  const c = item.consumableEffect;
  if (c) {
    const label = { energy: 'Energia', buff_attack: 'Ataque', buff_life: 'Vida', cash: 'Dinheiro' }[c.type];
    lines.push(`${label}: <b class="up">+${c.value}</b>${c.durationBattles ? ` por ${c.durationBattles} batalha(s)` : ''}`);
  }
  if (!lines.length) lines.push(escHtml(item.description));
  const price = item.priceCash > 0 ? `$${item.priceCash.toLocaleString()}` : 'sem preço';
  const refund = Math.round(item.priceCash * 0.5);
  const cat = weaponDef
    ? `Arma · ${escHtml(weaponDef.categoryName)}`
    : isGearItem(item)
      ? `${ITEM_SLOT_LABELS[item.gear.slot]} · nível ${item.gear.level}`
      : ITEM_TYPE_LABEL[item.type] ?? item.type;
  weaponTooltip.innerHTML = `
    <div class="wtip-title">${item.icon} ${escHtml(item.name)}</div>
    <div class="wtip-cat">${cat}</div>
    ${lines.map(l => `<div class="wtip-dmg">${l}</div>`).join('')}
    <div class="wtip-vs">Preço: <b>${price}</b> · vende por <b>$${refund.toLocaleString()}</b></div>
    ${weaponDef ? comparisonHtml(weaponDef.id) : ''}`;
  weaponTooltip.style.display = 'block';
}

function moveWeaponTooltip(x: number, y: number) {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const pad = 0.875 * rem;
  const edge = 0.5 * rem;
  const r = weaponTooltip.getBoundingClientRect();
  let left = x + pad;
  let top = y + pad;
  if (left + r.width > window.innerWidth - edge) left = Math.max(edge, x - r.width - pad);
  if (top + r.height > window.innerHeight - edge) top = Math.max(edge, y - r.height - pad);
  weaponTooltip.style.left = `${left / rem}rem`;
  weaponTooltip.style.top = `${top / rem}rem`;
}

let weaponDragActive = false;

/** Influência de cada atributo, recalculada a cada desenho do perfil (usada pelo balão). */
let attrInfluence: Record<AttrKey, AttrInfluence> | null = null;

/** Balão do "+" de um atributo: o preço do treino em cash, ou o ponto livre que será gasto. */
function showPlusTooltip(el: HTMLElement) {
  const stat = el.getAttribute('data-plus') as 'attack' | 'life' | 'astucia' | 'tenacidade' | null;
  if (!stat) return;
  const p = gameState.getPlayer();
  const label = { attack: 'Ataque', life: 'Vida', astucia: 'Astúcia', tenacidade: 'Tenacidade' }[stat];
  if (p.freePoints > 0) {
    weaponTooltip.innerHTML = `
      <div class="wtip-title">+1 ${label}</div>
      <div class="wtip-dmg">Custo: <b class="up">1 ponto livre</b></div>
      <div class="wtip-vs">Você tem <b>${p.freePoints}</b> ponto${p.freePoints > 1 ? 's' : ''} livre${p.freePoints > 1 ? 's' : ''}.</div>`;
  } else {
    const cost = getStatTrainingCost(stat, p.trainedPoints[stat], p.level);
    const enough = p.cash >= cost;
    weaponTooltip.innerHTML = `
      <div class="wtip-title">Treinar ${label}</div>
      <div class="wtip-dmg">Preço: <b class="${enough ? 'up' : 'down'}">$${cost.toLocaleString()}</b></div>
      <div class="wtip-vs">${enough ? '+1 ponto de ' + label : 'Cash insuficiente'}</div>`;
  }
  weaponTooltip.style.display = 'block';
}

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
  const el = (e.target as HTMLElement).closest?.('[data-bag-tip], [data-weapon-id], [data-plus], [data-attr-tip]') as HTMLElement | null;
  if (!el) return;
  if (el.hasAttribute('data-bag-tip')) showBagItemTooltip(el);
  else if (el.hasAttribute('data-plus')) showPlusTooltip(el);
  else if (el.hasAttribute('data-attr-tip')) showAttrTooltip(el);
  else showWeaponTooltip(el);
  moveWeaponTooltip((e as MouseEvent).clientX, (e as MouseEvent).clientY);
});
// As 4 barras trocam para o efeito só com o mouse à ESQUERDA da seta (linha vermelha do fundador); à direita, e no +, nada muda (R-ATRIBUTO-3)
document.addEventListener('mousemove', e => {
  const list = document.querySelector('.attr-compact-list');
  if (!list) return;
  const arrow = list.querySelector('.attr-c-arrow') as HTMLElement | null;
  const box = list.getBoundingClientRect();
  const m = e as MouseEvent;
  const inside = m.clientX >= box.left && m.clientX <= box.right && m.clientY >= box.top && m.clientY <= box.bottom;
  const limit = arrow ? arrow.getBoundingClientRect().left + arrow.getBoundingClientRect().width / 2 : box.right;
  list.classList.toggle('show-eff', inside && m.clientX < limit);
});
document.addEventListener('mouseleave', () => document.querySelector('.attr-compact-list')?.classList.remove('show-eff'));
document.addEventListener('mousemove', e => {
  if (weaponTooltip.style.display === 'none') return;
  moveWeaponTooltip((e as MouseEvent).clientX, (e as MouseEvent).clientY);
});
document.addEventListener('mouseout', e => {
  const el = (e.target as HTMLElement).closest?.('[data-bag-tip], [data-weapon-id], [data-plus], [data-attr-tip]') as HTMLElement | null;
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
  else if (el.dataset.invIdx !== undefined) weaponDrag = { kind: 'inv', index: parseInt(el.dataset.invIdx, 10) }; // qualquer item da Mala
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
function tryUnequipWeapon(targetSlot?: number) {
  if (gameState.getPlayer().equipped.weaponId && !gameState.bagHasRoom()) {
    void notify({ kind: 'mala', message: `Sua Mala está cheia (${gameState.getBagCount()} de ${gameState.getBagCapacity()}). Venda ou use um item para abrir espaço antes de guardar a arma.` });
    return;
  }
  gameState.unequipWeapon(targetSlot);
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

  document.getElementById('btn-unequip-weapon')?.addEventListener('click', () => tryUnequipWeapon());

  // Slots da Mala: soltar um item num slot vazio coloca ele ali; soltar num ocupado troca os dois (R-MALA-4)
  const grid = document.getElementById('inventory-grid');
  const cellOf = (e: Event) => (e.target as HTMLElement).closest?.('.inv-slot[data-slot]') as HTMLElement | null;
  grid?.addEventListener('dragover', e => {
    const cell = cellOf(e);
    if (!weaponDrag || !cell) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    grid.querySelectorAll('.drop-target').forEach(n => n !== cell && n.classList.remove('drop-target'));
    cell.classList.add('drop-target');
  });
  grid?.addEventListener('dragleave', e => {
    if (!grid.contains((e as DragEvent).relatedTarget as Node | null)) grid.querySelectorAll('.drop-target').forEach(n => n.classList.remove('drop-target'));
  });
  grid?.addEventListener('drop', e => {
    const cell = cellOf(e);
    if (!weaponDrag || !cell) return;
    e.preventDefault();
    e.stopPropagation();
    const target = parseInt(cell.dataset.slot ?? '-1', 10);
    const drag = weaponDrag;
    grid.querySelectorAll('.drop-target').forEach(n => n.classList.remove('drop-target'));
    endWeaponDrag();
    if (drag.kind === 'inv') {
      gameState.moveBagItem(drag.index, target);
      renderProfileView();
    } else {
      tryUnequipWeapon(target); // arma do espaço da arma solta direto num slot
    }
  });
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

        <div style="font-size: 0.6875rem; color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 0.375rem 0.625rem; border-radius: 0.375rem;">
          Inimigo: <strong>${m.opponent.name}</strong> (${m.opponent.style.toUpperCase()} Nv.${m.opponent.level}) • Arma: ${oppWeapon.icon} ${oppWeapon.name}
        </div>

        <div class="mission-rewards-row">
          <span style="color: #2ecc71;">+${m.xpReward} XP</span>
          <span style="color: #f1c40f;">+$${m.cashReward} Cash</span>
          <span style="color: #3498db;">${Math.round(m.itemDropChance * 100)}% Chance de Drop</span>
        </div>

        <button class="arena-btn-primary btn-start-mission" data-mis-id="${m.id}" style="width: 100%; margin-top: 0.375rem;">
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
        void notify({ kind: 'energia', title: 'Sem energia', message: `Esta missão gasta ${mission.energyCost} de energia e você tem ${gameState.getPlayer().energy}. Espere a recarga ou use 5 de ouro no + da barra de cima.` });
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
          // 'gear' = item aleatório dos 8 slots, do nível do jogador (R-ITEM-2); o resto vem do catálogo
          const dropItem =
            mission.possibleDropId === 'gear'
              ? rollRandomGear(gameState.getPlayer().level, Math.random)
              : SHOP_ITEMS.find(i => i.id === mission.possibleDropId);
          if (dropItem) {
            const coube = gameState.grantItem(dropItem);
            dropMsg = coube
              ? `<div style="margin-top: 0.5rem; color: #f1c40f;">🎁 Drop de Item Raro: <strong>${dropItem.icon} ${dropItem.name}</strong> adicionado à Mala!</div>`
              : `<div style="margin-top: 0.5rem; color: #e67e22;">🎁 Caiu <strong>${dropItem.icon} ${dropItem.name}</strong>, mas a Mala está cheia (${gameState.getBagCount()}/${gameState.getBagCapacity()}) e o item foi perdido. Abra espaço antes da próxima missão.</div>`;
          }
        }

        const goldDrop = rollGoldDrop(Math.random);
        if (goldDrop > 0) {
          gameState.addGold(goldDrop);
          dropMsg += `<div style="margin-top: 0.5rem; color: #f1c40f;">🪙 Drop raro: <strong>+${goldDrop} de ouro</strong>!</div>`;
        }

        const leveledUp = gameState.addXp(mission.xpReward);
        gameState.addCash(mission.cashReward);
        gameState.recordMissionCompleted();

        showOutcomePopup(
          '🏆 MISSÃO CUMPRIDA!',
          `Você neutralizou ${mission.opponent.name} e executou a missão com perfeição.`,
          `
            <div style="font-size: 0.875rem; font-weight: 700; color: #2ecc71;">+${mission.xpReward} XP Ganho</div>
            <div style="font-size: 0.875rem; font-weight: 700; color: #f1c40f;">+$${mission.cashReward} Cash Saqueado</div>
            ${dropMsg}
            ${leveledUp ? '<div style="margin-top: 0.625rem; font-size: 1rem; color: #d4af37; font-weight: 900;">⭐ VOCÊ SUBIU DE NÍVEL! (+4 Pontos Livres, +' + GOLD.perLevel + ' de ouro)</div>' : ''}
          `
        );
      } else {
        showOutcomePopup(
          '💀 MISSÃO FALHOU!',
          `Você foi emboscado e superado por ${mission.opponent.name}. Recupere suas energias e prepare melhor seu armamento antes de tentar novamente.`,
          `<span style="color: #e74c3c; font-size: 0.8125rem;">Nenhuma recompensa obtida. A Família espera mais de você.</span>`
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
  if (!realRivalsCache) container.innerHTML = '<p style="padding:0.75rem;color:var(--text-muted);">Procurando rivais...</p>';
  else paintRealRivals(container);
  if (!realRivalsCache || Date.now() - realRivalsCache.at > REAL_CACHE_MS) void loadRealRivals();
}

async function loadRealRivals() {
  if (!currentUserId) return;
  const r = await fetchRivals(currentUserId);
  realRivalsCache = { at: Date.now(), rows: r.rows, error: r.error };
  const container = document.getElementById('duels-rivals-container');
  const active = document.querySelector('.game-nav-tab.active')?.getAttribute('data-tab');
  if (container && active === 'duelos') paintRealRivals(container);
}

function paintRealRivals(container: HTMLElement) {
  const cache = realRivalsCache;
  if (!cache) return;
  if (cache.error) {
    container.innerHTML = `<p style="padding:0.75rem;color:#e67e22;">Não deu para carregar os rivais agora. Se o problema continuar, o banco pode estar sem a migração 002. Detalhe: ${escHtml(cache.error)}</p>`;
    return;
  }
  if (cache.rows.length === 0) {
    container.innerHTML = `<p style="padding:0.75rem;color:var(--text-muted);">Nenhum outro jogador ainda. Chame um amigo para criar uma conta!</p>`;
    return;
  }
  container.innerHTML = cache.rows.map(r => {
    const rWep = equippedWeaponDef(r.weapon_id);
    return `
      <div class="rival-card-item">
        <div class="rival-thumb-wrap">
          ${renderPaperdollSVG(r.appearance, { width: 4.25, height: 4.6875 })}
        </div>
        <div class="rival-info-col">
          <div class="rival-name">${escHtml(r.name)}</div>
          <div class="rival-meta-badges">
            <span class="gg-style-badge badge-${r.style}">${r.style.toUpperCase()}</span>
            <span class="gg-level-badge">NV ${r.level}</span>
          </div>
          <div style="font-size: 0.6875rem; color: var(--text-muted); margin-bottom: 0.375rem;">
            Arma: ${rWep.icon ?? ''} ${rWep.name} • Respeito: ⭐${r.respect} • ${r.duels_won}V / ${r.duels_lost}D
          </div>
          <button class="arena-btn-primary btn-challenge-real" data-riv-id="${r.id}" style="padding: 0.375rem 0.875rem; font-size: 0.75rem; width: 100%;">
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
async function challengeRealRival(opponentId: string, btn?: HTMLButtonElement, payGold = false) {
  if (btn) btn.disabled = true;
  await flushSave(); // o servidor usa o seu personagem salvo: manda o que estiver pendente
  const r = await duelOnServer(opponentId, payGold);
  const d = r.body;
  if (!d.ok && d.error === 'espera' && d.costGold && !payGold) {
    // Espera de 10 min: oferece pagar ouro para duelar agora (o servidor cobra só se aceitar).
    const min = Math.ceil((d.remainingMs ?? 0) / 60000);
    const pagar = await ask({ kind: 'ouro', title: 'Duelar agora?', message: `Seu próximo duelo grátis é em ${min} min. Gastar ${d.costGold} de ouro para duelar agora?`, okLabel: `Gastar ${d.costGold} de ouro`, cancelLabel: 'Esperar' });
    if (pagar) return challengeRealRival(opponentId, btn, true);
    if (btn) btn.disabled = false;
    return;
  }
  if (!d.ok || !d.events || !d.attacker || !d.defender || !d.save || !d.rewards || d.firstAttacker === undefined) {
    void notify({ kind: d.error === 'sem_ouro' ? 'ouro' : 'duelo', title: d.error === 'sem_ouro' ? 'Faltam ouros' : 'Duelo não realizado', message: d.message ?? 'Não foi possível duelar agora. Tente de novo.' });
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
            <div style="font-size: 0.875rem; font-weight: 700; color: #f1c40f;">+$${rw.cash} Cash Saqueado</div>
            <div style="font-size: 0.875rem; font-weight: 700; color: #e67e22;">+${rw.respect} Respeito ⭐</div>
            <div style="font-size: 0.8125rem; font-weight: 700; color: #2ecc71;">+${rw.xp} XP de Duelo</div>
            ${reply.goldSpent ? `<div style="font-size: 0.8125rem; color: var(--text-muted);">−${reply.goldSpent} de ouro (duelo antes da espera)</div>` : ''}
            ${rw.leveledUp ? '<div style="margin-top: 0.625rem; font-size: 1rem; color: #d4af37; font-weight: 900;">⭐ VOCÊ SUBIU DE NÍVEL!</div>' : ''}
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
          ${renderPaperdollSVG(r.appearance, { width: 4.25, height: 4.6875 })}
        </div>
        <div class="rival-info-col">
          <div class="rival-name">${r.name}</div>
          <div class="rival-meta-badges">
            <span class="gg-style-badge badge-${r.style}">${r.style.toUpperCase()}</span>
            <span class="gg-level-badge">NV ${r.level}</span>
          </div>
          <div style="font-size: 0.6875rem; color: var(--text-muted); margin-bottom: 0.375rem;">
            Arma: ${rWep.icon} ${rWep.name} • Respeito: ⭐${r.respect}
          </div>
          <button class="arena-btn-primary btn-challenge-rival" data-riv-id="${r.id}" style="padding: 0.375rem 0.875rem; font-size: 0.75rem; width: 100%;">
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
        const leveledUp = gameState.addXp(60);
        gameState.recordDuelResult(true, 500);

        showOutcomePopup(
          '🏆 DUELO VENCIDO!',
          `Você derrotou ${rival.name} na Arena Clandestina e humilhou a facção rival!`,
          `
            <div style="font-size: 0.875rem; font-weight: 700; color: #f1c40f;">+$${rival.bountyCash} Cash Roubado do Rival</div>
            <div style="font-size: 0.8125rem; font-weight: 700; color: #2ecc71;">+60 XP de Duelo</div>
            ${leveledUp ? '<div style="margin-top: 0.625rem; font-size: 1rem; color: #d4af37; font-weight: 900;">⭐ VOCÊ SUBIU DE NÍVEL!</div>' : ''}
          `
        );
      } else {
        gameState.recordDuelResult(false, 200);
        showOutcomePopup(
          '💀 DERROTA NO DUELO',
          `${rival.name} superou seus reflexos nesta luta.`,
          `<span style="color: #e74c3c;">Treine seus atributos e melhore sua arma! (Respeito só se ganha duelando contra jogadores de verdade.)</span>`
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

  // Itens dos 8 slots: estoque já sorteado, atributos à vista (R-ITEM-2); o resto vem do catálogo fixo
  const stock = gameState.getShopStock();
  const filtered = [
    ...(activeShopFilter === 'all' || activeShopFilter === 'gear' ? stock : []),
    ...(activeShopFilter === 'gear' ? [] : activeShopFilter === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.type === activeShopFilter)),
  ];

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
          <span style="font-size: 0.625rem; color: ${meetsLevel ? '#2ecc71' : '#e74c3c'}; font-weight: 700;">
            ${isGearItem(item) ? `${ITEM_SLOT_LABELS[item.gear.slot]} · Nv. ${item.gear.level}` : `Nv. Mínimo: ${item.levelReq}`}
          </span>
        </div>
        <p style="font-size: 0.75rem; color: var(--text-muted);">${item.description}</p>
        ${shopWeapon ? `<div class="shop-item-dmg">Dano: ${damageText(shopWeapon)}</div>` : ''}
        <div class="shop-item-price-row">
          <span style="font-weight: 800; color: #f1c40f; font-size: 0.8125rem;">
            ${item.priceCash > 0 ? `$${item.priceCash.toLocaleString()} ` : ''}
            ${item.priceGold > 0 ? `🪙 ${item.priceGold}` : ''}
          </span>
          <button class="arena-btn-primary btn-buy-shop-item" data-item-id="${item.id}" ${canBuy ? '' : 'aria-disabled="true"'} style="padding: 0.25rem 0.75rem; font-size: 0.6875rem;">
            Comprar
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-buy-shop-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-item-id');
      if (id && id.startsWith('g_')) {
        // item dos 8 slots: confere cash e espaço antes de cobrar; o estoque muda depois da compra
        const why = gameState.buyGearFromStock(id);
        if (why === null) {
          sound.playCrit();
          renderShopView();
        } else {
          const pl = gameState.getPlayer();
          const alvo = gameState.getShopStock().find(i => i.id === id);
          if (why === 'cash') void notify({ kind: 'cash', title: 'Faltam $', message: `Este item custa $${(alvo?.priceCash ?? 0).toLocaleString()} e você tem $${pl.cash.toLocaleString()}.` });
          else if (why === 'mochila') void notify({ kind: 'mala', message: `Sua Mala está cheia (${gameState.getBagCount()} de ${gameState.getBagCapacity()}). Venda ou use um item para abrir espaço.` });
          else void notify({ kind: 'info', title: 'Item indisponível', message: 'Este item não está mais à venda. O estoque mudou.' });
        }
        return;
      }
      const item = SHOP_ITEMS.find(i => i.id === id);
      if (!item) return;

      const reason = gameState.buyBlockReason(item);
      if (reason === null && gameState.buyItem(item)) {
        sound.playCrit();
        void notify({ kind: 'sucesso', title: 'Compra feita', message: `Você adquiriu ${item.name}.`, autoCloseMs: 2200 });
        renderShopView();
      } else {
        const pl = gameState.getPlayer();
        if (reason === 'nivel') void notify({ kind: 'info', title: 'Nível insuficiente', message: `Este item exige o nível ${item.levelReq}, e você está no nível ${pl.level}.` });
        else if (reason === 'ouro') void notify({ kind: 'ouro', title: 'Faltam ouros', message: `Este item custa ${item.priceGold} de ouro e você tem ${pl.gold}.` });
        else if (reason === 'mochila') void notify({ kind: 'mala', message: `Sua Mala está cheia (${gameState.getBagCount()} de ${gameState.getBagCapacity()}). Venda ou use um item para abrir espaço.` });
        else void notify({ kind: 'cash', title: 'Faltam $', message: `Este item custa $${item.priceCash.toLocaleString()} e você tem $${pl.cash.toLocaleString()}.` });
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
  if (note) note.textContent = 'Ranking de jogadores reais, ordenado por Respeito. O Respeito só vem de duelos contra outros jogadores.';
  if (!rankingCache) tbody.innerHTML = '<tr><td colspan="7" style="padding:0.875rem;">Carregando o ranking...</td></tr>';
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
    tbody.innerHTML = `<tr><td colspan="7" style="padding:0.875rem;color:#e67e22;">Não deu para carregar o ranking agora. Detalhe: ${escHtml(cache.error)}</td></tr>`;
    return;
  }
  tbody.innerHTML = cache.rows.map((r, i) => {
    const me = r.id === currentUserId;
    const fam = MAFIA_FAMILIES_LIST.find(f => f.id === r.family_id);
    const action = me
      ? '<span style="font-size: 0.6875rem; color: #2ecc71;">Seu Personagem</span>'
      : `<button class="arena-btn-primary rank-duel-btn" data-riv-id="${r.id}" style="padding: 0.1875rem 0.625rem; font-size: 0.6875rem;">⚔️ Duelar</button>`;
    return `
      <tr class="${me ? 'player-rank-row' : ''}">
        <td><strong${me ? ' style="color: #f1c40f;"' : ''}>#${i + 1}</strong></td>
        <td>${me ? '<strong>' : ''}${escHtml(r.name)}${me ? ' (Você)</strong>' : ''}</td>
        <td><span class="gg-style-badge badge-${r.style}">${r.style.toUpperCase()}</span></td>
        <td>Nv. ${r.level}</td>
        <td>${fam ? escHtml(fam.name) : 'Sem Família'}</td>
        <td style="color: #f1c40f; font-weight: 700;">⭐ ${r.respect.toLocaleString()} <span style="font-size: 0.625rem; color: var(--text-muted);">(${r.duels_won}V/${r.duels_lost}D)</span></td>
        <td>${action}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="7" style="padding:0.875rem;">Ninguém no ranking ainda.</td></tr>';

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
        <td><span style="font-size: 0.6875rem; color: #2ecc71;">Seu Personagem</span></td>
      </tr>
    ` : `
      <tr>
        <td><strong>#${i + 1}</strong></td>
        <td>${r.name}</td>
        <td><span class="gg-style-badge badge-${r.style}">${r.style.toUpperCase()}</span></td>
        <td>Nv. ${r.level}</td>
        <td>${r.family}</td>
        <td style="color: #f1c40f; font-weight: 700;">⭐ ${r.respect.toLocaleString()}</td>
        <td><span style="font-size: 0.6875rem; color: var(--text-muted);">NPC</span></td>
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
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <span style="font-size: 0.6875rem; color: #2ecc71; font-weight: 700;">✓ VOCÊ É MEMBRO OFICIAL</span>
          <h2 style="color: #d4af37; font-family: var(--font-serif);">${currentFam.emblem} ${currentFam.name}</h2>
          <p style="font-style: italic; color: var(--text-muted); font-size: 0.8125rem;">${currentFam.motto}</p>
        </div>
        <div style="display: flex; gap: 0.875rem;">
          <div style="background: rgba(0,0,0,0.4); padding: 0.5rem 0.875rem; border-radius: 0.5rem; border: 0.0625rem solid rgba(255,255,255,0.08);">
            <div style="font-size: 0.625rem; color: var(--text-muted);">COFRE DA FAMÍLIA</div>
            <div style="font-weight: 800; color: #f1c40f;">$${currentFam.treasuryCash.toLocaleString()}</div>
          </div>
          <button id="donate-clan-cash-btn" class="arena-btn-primary" style="padding: 0.5rem 0.875rem;">
            💵 Doar $500 ao Cofre
          </button>
        </div>
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 0.875rem; padding-top: 0.625rem; border-top: 0.0625rem solid rgba(255,255,255,0.06); font-size: 0.75rem;">
        <span style="color: #2ecc71;">Bônus Ativo: <strong>+${currentFam.buffs.xpBonusPct}% XP em Missões</strong></span>
        <span style="color: #e74c3c;">Bônus de Ataque: <strong>+${currentFam.buffs.attackBonusPct}% Dano</strong></span>
        <span style="color: #3498db;">Regeneração: <strong>+${currentFam.buffs.energyRegenBonusPct}% Energia</strong></span>
      </div>
    `;

    document.getElementById('donate-clan-cash-btn')?.addEventListener('click', () => {
      if (gameState.spendCash(500)) {
        currentFam.treasuryCash += 500;
        void notify({ kind: 'sucesso', title: 'Doação feita', message: 'Você doou $500 ao cofre da Família.', autoCloseMs: 2200 });
        renderFamilyView();
      } else {
        void notify({ kind: 'cash', title: 'Faltam $', message: `A doação é de $500 e você tem $${gameState.getPlayer().cash.toLocaleString()}.` });
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
          <h4 style="font-size: 1rem; color: #fff;">${fam.emblem} ${fam.name}</h4>
          <span style="font-size: 0.6875rem; color: var(--text-muted);">Membros: ${fam.membersCount}/${fam.maxMembers}</span>
        </div>
        <div style="font-size: 0.75rem; color: #d4af37;">Líder: <strong>${fam.leaderName}</strong></div>
        <p style="font-size: 0.75rem; font-style: italic; color: var(--text-muted);">${fam.motto}</p>
        <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 0.375rem; font-size: 0.6875rem; display: flex; flex-direction: column; gap: 0.25rem;">
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
      void notify({ kind: 'familia', title: 'Bem-vindo à família', message: 'Parabéns! Você agora é um membro oficial da Família Mafiosa.' });
      renderFamilyView();
    });
  });
}

// ========================================================
// VIEW 7: EVENTOS & CHEFÃO MUNDIAL
// ========================================================
function renderRaidEvent() {
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
        void notify({ kind: 'energia', title: 'Sem energia', message: `O ataque ao chefão gasta 25 de energia e você tem ${gameState.getPlayer().energy}. Espere a recarga ou use 5 de ouro no + da barra de cima.` });
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

      showOutcomePopup(
        '💥 ATAQUE DE RAID EXECUTADO!',
        `Você desferiu um ataque devastador causando 4.500 de dano na vida coletiva do Chefão Mundial!`,
        `
          <div style="font-size: 0.875rem; font-weight: 700; color: #2ecc71;">+180 XP Coletivo</div>
          <div style="font-size: 0.875rem; font-weight: 700; color: #f1c40f;">+$1.200 Cash de Saque</div>
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
  container.innerHTML = renderPaperdollSVG(appearance, { width: 17.5, height: 21.25, pose: 'idle' });

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
