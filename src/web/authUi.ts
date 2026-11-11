import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient.js';
import { validateCredentials, translateAuthError, type AuthMode } from './authRules.js';

/**
 * Tela de entrar / criar conta. Só é usada quando o Supabase está configurado.
 * Nunca registra senha nem token em console.
 */
let mode: AuthMode = 'login';
let busy = false;
let onSuccess: (session: Session) => void = () => {};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

function setMode(next: AuthMode) {
  mode = next;
  $('auth-tab-login')?.classList.toggle('active', next === 'login');
  $('auth-tab-signup')?.classList.toggle('active', next === 'signup');
  $('auth-tab-login')?.setAttribute('aria-selected', String(next === 'login'));
  $('auth-tab-signup')?.setAttribute('aria-selected', String(next === 'signup'));
  const submit = $('auth-submit');
  if (submit) submit.textContent = next === 'login' ? 'Entrar' : 'Criar conta';
  const pw = $<HTMLInputElement>('auth-password');
  if (pw) pw.autocomplete = next === 'login' ? 'current-password' : 'new-password';
  const hint = $('auth-hint');
  if (hint) hint.textContent = next === 'signup' ? 'Mínimo de 8 caracteres.' : '';
  showMessage('', 'error');
  showMessage('', 'info');
}

function showMessage(text: string, kind: 'error' | 'info') {
  const el = $(kind === 'error' ? 'auth-error' : 'auth-info');
  if (el) el.textContent = text;
}

function setBusy(value: boolean) {
  busy = value;
  const submit = $<HTMLButtonElement>('auth-submit');
  if (submit) {
    submit.disabled = value;
    if (value) submit.textContent = 'Aguarde...';
    else submit.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
  }
}

async function handleSubmit(ev: Event) {
  ev.preventDefault();
  if (busy || !supabase) return;
  const email = ($<HTMLInputElement>('auth-email')?.value || '').trim();
  const password = $<HTMLInputElement>('auth-password')?.value || '';

  showMessage('', 'error');
  showMessage('', 'info');
  const problem = validateCredentials(email, password, mode);
  if (problem) {
    showMessage(problem, 'error');
    return;
  }

  setBusy(true);
  try {
    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showMessage(translateAuthError((error as { code?: string }).code, error.message), 'error');
        return;
      }
      if (data.session) finish(data.session);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        showMessage(translateAuthError((error as { code?: string }).code, error.message), 'error');
        return;
      }
      if (data.session) {
        finish(data.session);
      } else {
        // Confirmação de e-mail ligada no projeto: a conta existe, mas precisa confirmar.
        setMode('login');
        showMessage('Conta criada! Enviamos um e-mail de confirmação. Confirme e depois use "Entrar".', 'info');
      }
    }
  } catch (e) {
    showMessage(translateAuthError(undefined, e instanceof Error ? e.message : ''), 'error');
  } finally {
    setBusy(false);
  }
}

function finish(session: Session) {
  const pw = $<HTMLInputElement>('auth-password');
  if (pw) pw.value = '';
  hideAuthScreen();
  onSuccess(session);
}

export function showAuthScreen() {
  const screen = $('auth-screen');
  if (!screen) return;
  screen.style.display = 'flex';
  document.body.classList.add('auth-open');
  setMode('login');
  setTimeout(() => $<HTMLInputElement>('auth-email')?.focus(), 50);
}

export function hideAuthScreen() {
  const screen = $('auth-screen');
  if (screen) screen.style.display = 'none';
  document.body.classList.remove('auth-open');
}

/** Liga os botões da tela. Chamar uma vez. */
export function initAuthUi(onLoggedIn: (session: Session) => void) {
  onSuccess = onLoggedIn;
  $('auth-tab-login')?.addEventListener('click', () => setMode('login'));
  $('auth-tab-signup')?.addEventListener('click', () => setMode('signup'));
  $('auth-form')?.addEventListener('submit', handleSubmit);
  $('auth-show-password')?.addEventListener('change', (e) => {
    const pw = $<HTMLInputElement>('auth-password');
    if (pw) pw.type = (e.target as HTMLInputElement).checked ? 'text' : 'password';
  });
}

export async function signOutAccount() {
  if (!supabase) return;
  await supabase.auth.signOut();
  showAuthScreen();
}
