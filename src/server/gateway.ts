import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { validateConfig } from '../engine/schema.js';
import { handleOp, type ApiBody, type ApiResponse } from './handlers.js';
import { createAdminClient, createSupabaseDb } from './supabaseDb.js';

/**
 * Porta de entrada do servidor: confere quem é o jogador (token da conta) e entrega para as
 * operações. Usada pela função da Vercel (api/game.ts) e pelo servidor de desenvolvimento local.
 * Nunca imprime chave, token nem e-mail.
 */
const config = validateConfig(balanceJson);

export interface ServerEnv {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

const MAX_BODY_BYTES = 200_000;

function parseBody(text: string): ApiBody | null {
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as ApiBody) : null;
  } catch {
    return null;
  }
}

export async function handleGameRequest(
  method: string,
  authorization: string | undefined,
  bodyText: string,
  env: ServerEnv,
  now: number = Date.now(),
): Promise<ApiResponse> {
  if (method !== 'POST') return { status: 405, body: { ok: false, error: 'metodo', message: 'Use POST.' } };

  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !serviceKey) {
    return {
      status: 503,
      body: { ok: false, error: 'servidor_nao_configurado', message: 'O servidor do jogo ainda não está configurado.' },
    };
  }

  const token = /^Bearer\s+(.+)$/i.exec(authorization ?? '')?.[1];
  if (!token) return { status: 401, body: { ok: false, error: 'sem_login', message: 'Entre na sua conta.' } };

  const body = parseBody(bodyText);
  if (!body) return { status: 400, body: { ok: false, error: 'corpo_invalido', message: 'Requisição inválida.' } };

  const admin = createAdminClient(url, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { status: 401, body: { ok: false, error: 'sem_login', message: 'Sessão inválida. Entre de novo.' } };

  return handleOp(
    {
      db: createSupabaseDb(admin),
      userId: data.user.id,
      now,
      config,
      randomSeed: () => Math.floor(Math.random() * 2_000_000_000),
    },
    body,
  );
}
