import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente do Supabase no NAVEGADOR. Usa só as variáveis públicas (prefixo VITE_).
 * A chave secreta (service_role) NUNCA entra aqui: ela vive só no servidor.
 * Sem as variáveis, o jogo roda em "modo local" (sem conta), como antes.
 */
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const cloudEnabled: boolean = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;
