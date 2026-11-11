import type { StyleId } from '../engine/types.js';
import { renderPaperdollSVG, type CharacterAppearance } from './paperdoll.js';
import { getWeaponSprite } from './weaponSprites.js';
import {
  GENDER_OPTIONS,
  HAIR_STYLE_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  CLOTHING_OPTIONS,
  HAT_OPTIONS,
  ACCESSORY_OPTIONS,
  BACKGROUND_OPTIONS,
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHING_COLORS,
  optionsFor,
  defaultAppearance,
  applyGender,
  type Option,
  type Gender,
} from './characterOptions.js';

/**
 * Passo "Crie seu personagem": o jogador MONTA o personagem escolhendo cada característica
 * (nada é sorteado). Este módulo guarda o rascunho e desenha as abas de opções.
 * Quem decide o que fazer com o rascunho (criar conta, salvar) é o authUi.ts.
 */
export interface CharacterDraft {
  style: StyleId;
  weapon: string;
  appearance: CharacterAppearance;
}

export const CLASS_INFO: { id: StyleId; icon: string; name: string; role: string; text: string }[] = [
  { id: 'carrasco', icon: '🗡️', name: 'Carrasco', role: 'Dano Máximo (Escala ×2,2)', text: 'Inicia a luta com o devastador <strong>Golpe de Abertura</strong> e ignora 25% da armadura do oponente.' },
  { id: 'muralha', icon: '🛡️', name: 'Muralha', role: 'Tanque Colossal (Escala ×1,95)', text: 'Armadura pesada de 25%, <strong>Intimidação</strong> reduzindo dano nas 3 primeiras rodadas e Casca Grossa.' },
  { id: 'malandro', icon: '🎭', name: 'Malandro', role: 'Equilibrado & Esquiva', text: 'Esquiva nativa triplicada (15%), maior prioridade de primeiro ataque e <strong>Adaptação</strong> de dano com vida perdida.' },
];

export const STARTER_WEAPONS: { id: string; label: string }[] = [
  { id: 'colt_1911', label: '🔫 Colt M1911 (.45)' },
  { id: 'double_barrel', label: '💥 Escopeta Cano Duplo' },
  { id: 'tommy_gun', label: '🌪️ Tommy Gun 1928' },
];

const TABS = [
  { id: 'corpo', label: 'Corpo' },
  { id: 'cabelo', label: 'Cabelo' },
  { id: 'rosto', label: 'Rosto' },
  { id: 'roupa', label: 'Roupa' },
  { id: 'extras', label: 'Extras' },
  { id: 'classe', label: 'Classe e arma' },
] as const;
type TabId = (typeof TABS)[number]['id'];

let draft: CharacterDraft = newDraft();
let activeTab: TabId = 'corpo';

function newDraft(): CharacterDraft {
  return { style: 'carrasco', weapon: 'colt_1911', appearance: defaultAppearance() };
}

export function resetDraft() {
  draft = newDraft();
  activeTab = 'corpo';
}

export function getDraft(): CharacterDraft {
  return { style: draft.style, weapon: draft.weapon, appearance: { ...draft.appearance } };
}

const $ = (id: string) => document.getElementById(id);
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

// ---------- blocos de interface ----------
function chips<T extends string>(title: string, list: Option<T>[], current: string, prop: string): string {
  const buttons = list
    .map(o => `<button type="button" class="choice-btn ${o.id === current ? 'active' : ''}" data-act="opt" data-prop="${prop}" data-val="${o.id}">${esc(o.label)}</button>`)
    .join('');
  return `<div class="palette-group"><span class="sub-label">${esc(title)}</span><div class="btn-toggle-row">${buttons}</div></div>`;
}

function swatches(title: string, items: { name: string; value: string; extra?: string }[], current: string, prop: string): string {
  const buttons = items
    .map(i => `<button type="button" class="swatch-btn ${i.value === current ? 'active' : ''}" style="background:${i.value}" title="${esc(i.name)}" aria-label="${esc(i.name)}" data-act="swatch" data-prop="${prop}" data-val="${i.value}" ${i.extra ? `data-extra="${i.extra}"` : ''}></button>`)
    .join('');
  return `<div class="palette-group"><span class="sub-label">${esc(title)}</span><div class="color-swatches" style="flex-wrap:wrap">${buttons}</div></div>`;
}

function tabHtml(tab: TabId): string {
  const a = draft.appearance;
  const g: Gender = a.gender;
  switch (tab) {
    case 'corpo':
      return (
        chips('Gênero', GENDER_OPTIONS, a.gender, 'gender') +
        swatches('Tom de pele', SKIN_TONES.map(s => ({ name: s.name, value: s.value })), a.skinTone, 'skinTone')
      );
    case 'cabelo':
      return (
        chips('Penteado', optionsFor(HAIR_STYLE_OPTIONS, g), a.hairStyle, 'hairStyle') +
        swatches('Cor do cabelo', HAIR_COLORS.map(s => ({ name: s.name, value: s.value })), a.hairColor, 'hairColor')
      );
    case 'rosto':
      return (
        swatches('Cor dos olhos', EYE_COLORS.map(s => ({ name: s.name, value: s.value })), a.eyeColor, 'eyeColor') +
        (g === 'male'
          ? chips('Barba e bigode (usa a cor do cabelo)', FACIAL_HAIR_OPTIONS, a.facialHair, 'facialHair')
          : '<p class="sub-label">Barba e bigode estão disponíveis para personagens masculinos.</p>')
      );
    case 'roupa':
      return (
        chips('Traje', optionsFor(CLOTHING_OPTIONS, g), a.clothing, 'clothing') +
        swatches('Cor do traje', CLOTHING_COLORS.map(c => ({ name: c.name, value: c.main, extra: c.sec })), a.clothingColor, 'clothingColor')
      );
    case 'extras':
      return (
        chips('Chapéu', HAT_OPTIONS, a.hat ?? 'none', 'hat') +
        chips('Acessório', optionsFor(ACCESSORY_OPTIONS, g), a.accessory, 'accessory') +
        chips('Fundo do cartão', BACKGROUND_OPTIONS, a.cardBackground, 'cardBackground')
      );
    case 'classe':
      return (
        `<div class="palette-group"><span class="sub-label">Classe mafiosa</span><div class="class-picker-grid">${CLASS_INFO.map(
          c => `<div class="class-card-pick ${c.id === draft.style ? 'selected' : ''}" role="button" tabindex="0" data-act="class" data-val="${c.id}">
            <div class="c-pick-header"><span class="c-pick-icon">${c.icon}</span> <strong>${c.name}</strong></div>
            <span class="c-pick-role">${c.role}</span><p>${c.text}</p></div>`,
        ).join('')}</div></div>` +
        `<div class="palette-group"><span class="sub-label">Arma inicial de contrabando</span><div class="btn-toggle-row">${STARTER_WEAPONS.map(
          w => `<button type="button" class="choice-btn ${w.id === draft.weapon ? 'active' : ''}" data-act="weapon" data-val="${w.id}">${esc(w.label)}</button>`,
        ).join('')}</div></div>`
      );
  }
}

// ---------- desenho ----------
function renderPreview() {
  const box = $('creator-avatar');
  if (box) box.innerHTML = renderPaperdollSVG(draft.appearance, { width: 16.25, height: 20 });
  const weapon = $('creator-weapon');
  if (weapon) weapon.innerHTML = getWeaponSprite(draft.weapon, 'preview').svg;
  const badge = $('creator-class-badge');
  if (badge) {
    badge.textContent = draft.style.toUpperCase();
    badge.className = `gg-style-badge badge-${draft.style}`;
  }
}

function renderTabs() {
  const tabs = $('creator-tabs');
  if (tabs) {
    tabs.innerHTML = TABS.map(
      t => `<button type="button" class="creator-tab ${t.id === activeTab ? 'active' : ''}" role="tab" aria-selected="${t.id === activeTab}" data-tab="${t.id}">${t.label}</button>`,
    ).join('');
  }
  const panel = $('creator-tabpanel');
  if (panel) panel.innerHTML = tabHtml(activeTab);
}

/** Redesenha tudo (preview, abas e opções). */
export function renderCreator() {
  renderPreview();
  renderTabs();
}

// ---------- ações ----------
function applyOption(prop: string, val: string, extra?: string) {
  const a = draft.appearance;
  switch (prop) {
    case 'gender':
      draft.appearance = applyGender(a, val as Gender);
      break;
    case 'hairColor':
      a.hairColor = val;
      a.facialHairColor = val; // barba acompanha o cabelo
      break;
    case 'clothingColor':
      a.clothingColor = val;
      if (extra) a.clothingSecondaryColor = extra;
      break;
    case 'skinTone':
    case 'eyeColor':
      (a as unknown as Record<string, string>)[prop] = val;
      break;
    case 'hairStyle':
    case 'facialHair':
    case 'clothing':
    case 'hat':
    case 'accessory':
    case 'cardBackground':
      (a as unknown as Record<string, string>)[prop] = val;
      break;
  }
}

let wired = false;
/** Liga os cliques do criador. Chamar uma vez. */
export function initCreator() {
  if (wired) return;
  wired = true;

  $('creator-tabs')?.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest('[data-tab]') as HTMLElement | null;
    if (!btn) return;
    activeTab = btn.getAttribute('data-tab') as TabId;
    renderTabs();
  });

  const panel = $('creator-tabpanel');
  const onPick = (e: Event) => {
    const el = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
    if (!el) return;
    const act = el.getAttribute('data-act');
    const val = el.getAttribute('data-val') || '';
    if (act === 'opt' || act === 'swatch') {
      applyOption(el.getAttribute('data-prop') || '', val, el.getAttribute('data-extra') || undefined);
    } else if (act === 'class') {
      draft.style = val as StyleId; // a classe NÃO muda a aparência escolhida
    } else if (act === 'weapon') {
      draft.weapon = val;
    } else {
      return;
    }
    renderCreator();
  };
  panel?.addEventListener('click', onPick);
  panel?.addEventListener('keydown', e => {
    const ke = e as KeyboardEvent;
    if ((ke.key === 'Enter' || ke.key === ' ') && (ke.target as HTMLElement).getAttribute('data-act') === 'class') {
      ke.preventDefault();
      onPick(e);
    }
  });
}
