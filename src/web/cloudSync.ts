import { supabase } from './supabaseClient.js';
import type { PlayerState } from '../shared/player.js';
import type { FighterInput, FightEvent, StyleId } from '../engine/types.js';
import type { CharacterAppearance } from './paperdoll.js';

/**
 * Conversa do navegador com o servidor do jogo (POST /api/game) e com o ranking (leitura).
 * O navegador nunca escreve no banco: pede ao servidor, que confere e grava.
 * Nunca imprime token nem e-mail.
 */
export interface ApiReply<T = Record<string, unknown>> {
  /** 0 = sem rede / servidor fora do ar. */
  status: number;
  body: T & { ok?: boolean; error?: string; message?: string };
}

export async function callApi<T = Record<string, unknown>>(op: string, payload: Record<string, unknown> = {}): Promise<ApiReply<T>> {
  if (!supabase) return { status: 0, body: { ok: false, error: 'sem_nuvem' } as ApiReply<T>['body'] };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { status: 401, body: { ok: false, error: 'sem_login' } as ApiReply<T>['body'] };
    const res = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ op, ...payload }),
    });
    let body: unknown = {};
    try {
      body = await res.json();
    } catch {
      /* resposta que não é JSON (ex.: página de erro) */
    }
    return { status: res.status, body: body as ApiReply<T>['body'] };
  } catch {
    return { status: 0, body: { ok: false, error: 'sem_rede' } as ApiReply<T>['body'] };
  }
}

/** O servidor existe e respondeu? (Senão o jogo continua no modo local, sem ranking nem duelo.) */
export const serverUnavailable = (r: ApiReply) => r.status === 0 || r.status === 404 || r.status === 503;

// ---------------------------------------------------------------------------------------------
// Salvar o progresso (com espera para não mandar a cada clique)
// ---------------------------------------------------------------------------------------------
const SAVE_DELAY_MS = 1500;

let getPlayer: (() => PlayerState) | null = null;
let onRejected: ((serverSave: PlayerState, message: string) => void) | null = null;
let timer: number | null = null;
let inFlight: Promise<void> | null = null;
let dirty = false;
let enabled = false;

/** Liga a sincronização para a conta atual. `rejected` é chamado quando o servidor recusa e devolve o save válido. */
export function startSync(player: () => PlayerState, rejected: (serverSave: PlayerState, message: string) => void) {
  getPlayer = player;
  onRejected = rejected;
  enabled = true;
  dirty = false;
}

export function stopSync() {
  enabled = false;
  dirty = false;
  if (timer !== null) window.clearTimeout(timer);
  timer = null;
}

export const syncEnabled = () => enabled;

/** Avisa que algo mudou no jogo: agenda o envio ao servidor. */
export function markDirty() {
  if (!enabled) return;
  dirty = true;
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(() => void flushSave(), SAVE_DELAY_MS);
}

async function sendOnce() {
  if (!enabled || !getPlayer || !dirty) return;
  dirty = false;
  const r = await callApi<{ save?: PlayerState }>('save', { save: getPlayer() });
  if (r.status === 422 && r.body.save && onRejected) {
    onRejected(r.body.save, r.body.message ?? 'O servidor recusou o progresso.');
  }
  // Outras falhas (rede, servidor fora): marca para tentar de novo no próximo ciclo.
  else if (r.status === 0 || r.status >= 500) dirty = true;
}

/** Envia agora o que estiver pendente (usado antes de duelar e ao fechar a aba). */
export function flushSave(): Promise<void> {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (inFlight) {
    // Já tem envio em andamento: espera terminar e manda o que sobrou.
    inFlight = inFlight.then(() => sendOnce()).finally(() => {
      inFlight = null;
    });
    return inFlight;
  }
  inFlight = sendOnce().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

// ---------------------------------------------------------------------------------------------
// Ranking e rivais (leitura da visão pública; o banco só mostra o que é público)
// ---------------------------------------------------------------------------------------------
export interface PublicPlayer {
  id: string;
  name: string;
  style: StyleId;
  level: number;
  respect: number;
  family_id: string | null;
  appearance: CharacterAppearance;
  created_at: string;
  duels_won: number;
  duels_lost: number;
  weapon_id: string | null;
}

const PUBLIC_COLUMNS = 'id,name,style,level,respect,family_id,appearance,created_at,duels_won,duels_lost,weapon_id';

export async function fetchRanking(limit = 50): Promise<{ rows: PublicPlayer[]; error: string | null }> {
  if (!supabase) return { rows: [], error: 'sem_nuvem' };
  const { data, error } = await supabase
    .from('public_players')
    .select(PUBLIC_COLUMNS)
    .order('respect', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as PublicPlayer[], error: null };
}

export async function fetchRivals(myId: string, limit = 12): Promise<{ rows: PublicPlayer[]; error: string | null }> {
  if (!supabase) return { rows: [], error: 'sem_nuvem' };
  const { data, error } = await supabase
    .from('public_players')
    .select(PUBLIC_COLUMNS)
    .neq('id', myId)
    .order('respect', { ascending: false })
    .limit(limit);
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as PublicPlayer[], error: null };
}

// ---------------------------------------------------------------------------------------------
// Duelo
// ---------------------------------------------------------------------------------------------
export interface DuelReply {
  won: boolean;
  seed: number;
  firstAttacker: 'A' | 'B';
  events: FightEvent[];
  attacker: { input: FighterInput; appearance: CharacterAppearance };
  defender: {
    id: string;
    name: string;
    style: StyleId;
    level: number;
    weaponId: string | null;
    input: FighterInput;
    appearance: CharacterAppearance;
  };
  rewards: { cash: number; respect: number; xp: number; leveledUp: boolean };
  save: PlayerState;
}

export const duelOnServer = (opponentId: string) => callApi<Partial<DuelReply>>('duel', { opponentId });
export const fetchMe = () => callApi<{ exists?: boolean; save?: PlayerState }>('me');
export const createOnServer = (character: unknown) => callApi<{ save?: PlayerState }>('create', { character });
