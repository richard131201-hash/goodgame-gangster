import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient.js';
import {
  validateCredentials,
  validateCharacterName,
  cleanCharacterName,
  translateAuthError,
} from './authRules.js';
import { initCreator, resetDraft, getDraft, renderCreator, CLASS_INFO, STARTER_WEAPONS, type CharacterDraft } from './onboarding.js';
import { renderPaperdollSVG } from './paperdoll.js';

/**
 * Porta de entrada do jogo, em 3 telas (mesma moldura e imagem de fundo):
 *  1) Entrar            (padrão ao abrir o site)
 *  2) Crie seu personagem  (o jogador monta o visual, a classe e a arma)
 *  3) Sua conta         (nome do personagem, e-mail e senha)
 * Também serve para criar o personagem de quem já tem conta mas ainda não tem personagem,
 * e para o modo local (sem Supabase): nesses casos o passo 3 pede só o nome.
 * Nunca registra senha nem token em console.
 */
export interface CreatedCharacter {
  draft: CharacterDraft;
  name: string;
}

type Panel = 'login' | 'create' | 'account';
type Flow = 'new-account' | 'character-only';

let panel: Panel = 'login';
let flow: Flow = 'new-account';
let busy = false;
let onLoggedIn: (session: Session, created?: CreatedCharacter) => void = () => {};
let onCharacterDone: (created: CreatedCharacter) => void = () => {};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
const val = (id: string) => ($<HTMLInputElement>(id)?.value ?? '');

function setText(id: string, text: string) {
  const el = $(id);
  if (el) el.textContent = text;
}

function clearMessages() {
  for (const id of ['login-error', 'login-info', 'account-error', 'account-info']) setText(id, '');
}

function showPanel(next: Panel) {
  panel = next;
  for (const [id, p] of [['panel-login', 'login'], ['panel-create', 'create'], ['panel-account', 'account']] as const) {
    const el = $(id);
    if (el) el.hidden = p !== next;
  }
  clearMessages();

  if (next === 'create') {
    renderCreator();
    const link = $('creator-back-login');
    if (link) {
      if (flow === 'new-account') {
        link.hidden = false;
        link.textContent = 'Já tem conta? Entrar';
      } else if (supabase) {
        link.hidden = false;
        link.textContent = 'Sair da conta';
      } else {
        link.hidden = true;
      }
    }
  }

  if (next === 'account') prepareAccountPanel();

  const focusId = next === 'login' ? 'login-email' : next === 'account' ? (flow === 'new-account' ? 'account-name' : 'account-name') : null;
  if (focusId) setTimeout(() => $<HTMLInputElement>(focusId)?.focus(), 50);
}

function prepareAccountPanel() {
  const draft = getDraft();
  const cls = CLASS_INFO.find(c => c.id === draft.style);
  const wep = STARTER_WEAPONS.find(w => w.id === draft.weapon);
  const sum = $('account-summary');
  if (sum) {
    sum.innerHTML = `
      <div class="account-avatar">${renderPaperdollSVG(draft.appearance, { width: 6.875, height: 8.375 })}</div>
      <div class="account-summary-text">
        <span class="gg-style-badge badge-${draft.style}">${draft.style.toUpperCase()}</span>
        <p>${cls ? cls.name : ''} · ${wep ? wep.label : ''}</p>
      </div>`;
  }
  const creds = $('account-credentials');
  const withCredentials = flow === 'new-account';
  if (creds) creds.hidden = !withCredentials;
  setText('account-title', withCredentials ? 'Sua conta' : 'Seu nome no submundo');
  setText('account-submit', withCredentials ? 'Criar conta e jogar' : 'Começar a jogar');
  const pw = $<HTMLInputElement>('account-password');
  if (pw) pw.value = '';
}

function setBusy(buttonId: string, label: string, value: boolean) {
  busy = value;
  const b = $<HTMLButtonElement>(buttonId);
  if (b) {
    b.disabled = value;
    b.textContent = value ? 'Aguarde...' : label;
  }
}

// ---------- ações ----------
async function handleLogin(ev: Event) {
  ev.preventDefault();
  if (busy || !supabase) return;
  clearMessages();
  const email = val('login-email').trim();
  const password = val('login-password');
  const problem = validateCredentials(email, password, 'login');
  if (problem) return setText('login-error', problem);

  setBusy('login-submit', 'Entrar', true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setText('login-error', translateAuthError((error as { code?: string }).code, error.message));
    if (data.session) {
      const pw = $<HTMLInputElement>('login-password');
      if (pw) pw.value = '';
      hideAuthScreen();
      onLoggedIn(data.session);
    }
  } catch (e) {
    setText('login-error', translateAuthError(undefined, e instanceof Error ? e.message : ''));
  } finally {
    setBusy('login-submit', 'Entrar', false);
  }
}

async function handleAccountSubmit(ev: Event) {
  ev.preventDefault();
  if (busy) return;
  clearMessages();

  const name = cleanCharacterName(val('account-name'));
  const nameProblem = validateCharacterName(name);
  if (nameProblem) return setText('account-error', nameProblem);

  // Só o nome (conta já existe ou modo local): termina aqui.
  if (flow === 'character-only') {
    hideAuthScreen();
    onCharacterDone({ draft: getDraft(), name });
    return;
  }

  if (!supabase) return;
  const email = val('account-email').trim();
  const password = val('account-password');
  const problem = validateCredentials(email, password, 'signup');
  if (problem) return setText('account-error', problem);

  const label = 'Criar conta e jogar';
  setBusy('account-submit', label, true);
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setText('account-error', translateAuthError((error as { code?: string }).code, error.message));
    if (data.session) {
      const pw = $<HTMLInputElement>('account-password');
      if (pw) pw.value = '';
      const created: CreatedCharacter = { draft: getDraft(), name };
      hideAuthScreen();
      onLoggedIn(data.session, created);
    } else {
      // Confirmação de e-mail ligada no projeto: a conta existe, mas precisa confirmar.
      resetDraft();
      showPanel('login');
      setText('login-info', 'Conta criada! Enviamos um e-mail de confirmação. Confirme e depois use "Entrar". Depois do primeiro acesso você monta o seu personagem.');
    }
  } catch (e) {
    setText('account-error', translateAuthError(undefined, e instanceof Error ? e.message : ''));
  } finally {
    setBusy('account-submit', label, false);
  }
}

function toggleShow(checkboxId: string, inputId: string) {
  $(checkboxId)?.addEventListener('change', e => {
    const pw = $<HTMLInputElement>(inputId);
    if (pw) pw.type = (e.target as HTMLInputElement).checked ? 'text' : 'password';
  });
}

// ---------- entrada pública ----------
function openScreen() {
  const screen = $('auth-screen');
  if (screen) screen.style.display = 'flex';
  document.body.classList.add('auth-open');
}

export function hideAuthScreen() {
  const screen = $('auth-screen');
  if (screen) screen.style.display = 'none';
  document.body.classList.remove('auth-open');
}

/** Tela de entrar (padrão ao abrir o site sem sessão). */
export function showAuthScreen() {
  flow = 'new-account';
  openScreen();
  showPanel('login');
}

/**
 * Criação de personagem para quem já está dentro (conta sem personagem, "Novo Gangster")
 * ou para o modo local. Chama `done` com o personagem montado e o nome.
 */
export function startCharacterCreation(done: (created: CreatedCharacter) => void) {
  flow = 'character-only';
  onCharacterDone = done;
  resetDraft();
  openScreen();
  showPanel('create');
}

/**
 * Volta ao passo do nome (com o visual e a classe já escolhidos) para o jogador trocar o nome,
 * por exemplo quando o servidor diz que o nome já está em uso. `done` recebe o novo personagem.
 */
export function reopenNameStep(
  created: CreatedCharacter,
  message: string,
  done: (created: CreatedCharacter) => void,
) {
  flow = 'character-only';
  onCharacterDone = done;
  openScreen();
  showPanel('account');
  const input = $<HTMLInputElement>('account-name');
  if (input) input.value = created.name;
  setText('account-error', message);
}

/** Liga os botões. Chamar uma vez, também no modo local. */
export function initAuthUi(callbacks: { onLoggedIn: (session: Session, created?: CreatedCharacter) => void }) {
  onLoggedIn = callbacks.onLoggedIn;
  initCreator();

  $('login-form')?.addEventListener('submit', handleLogin);
  $('account-form')?.addEventListener('submit', handleAccountSubmit);
  toggleShow('login-show', 'login-password');
  toggleShow('account-show', 'account-password');

  $('auth-go-create')?.addEventListener('click', () => {
    flow = 'new-account';
    resetDraft();
    showPanel('create');
  });
  $('creator-next')?.addEventListener('click', () => showPanel('account'));
  $('account-back')?.addEventListener('click', () => showPanel('create'));
  $('creator-back-login')?.addEventListener('click', () => {
    if (flow === 'new-account') showPanel('login');
    else void signOutAccount();
  });
}

export async function signOutAccount() {
  if (!supabase) return;
  await supabase.auth.signOut();
  showAuthScreen();
}
