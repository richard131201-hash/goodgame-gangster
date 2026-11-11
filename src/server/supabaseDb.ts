import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Db, DuelLogRow } from './handlers.js';
import type { DbPlayerRow } from './rules.js';

/**
 * Banco de verdade (Supabase) usado SÓ pelo servidor, com a chave service_role.
 * Essa chave nunca vai para o navegador nem para o repositório: vive só nas variáveis de
 * ambiente do servidor (.env.local no computador; Secret na Vercel).
 */
export function createAdminClient(url: string, serviceKey: string): SupabaseClient {
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function createSupabaseDb(sb: SupabaseClient): Db {
  return {
    async getPlayer(id) {
      const { data, error } = await sb.from('players').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(`getPlayer: ${error.code ?? error.message}`);
      return (data as DbPlayerRow | null) ?? null;
    },

    async insertPlayer(row) {
      const { data, error } = await sb.from('players').insert(row).select('*').single();
      if (error) {
        if (error.code === '23505') {
          const text = `${error.message} ${error.details ?? ''}`;
          return { ok: false, error: text.includes('players_pkey') ? 'ja_existe' : 'nome_em_uso' };
        }
        throw new Error(`insertPlayer: ${error.code ?? error.message}`);
      }
      return { ok: true, row: data as DbPlayerRow };
    },

    async updatePlayer(id, fields) {
      const { error } = await sb.from('players').update(fields).eq('id', id);
      if (error) throw new Error(`updatePlayer: ${error.code ?? error.message}`);
    },

    async lastDuelBetween(attackerId, defenderId) {
      const { data, error } = await sb
        .from('duels')
        .select('created_at')
        .eq('attacker_id', attackerId)
        .eq('defender_id', defenderId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw new Error(`lastDuelBetween: ${error.code ?? error.message}`);
      return data && data.length > 0 ? Date.parse(data[0].created_at as string) : null;
    },

    async countDuelsSince(attackerId, sinceMs) {
      const { count, error } = await sb
        .from('duels')
        .select('id', { count: 'exact', head: true })
        .eq('attacker_id', attackerId)
        .gte('created_at', new Date(sinceMs).toISOString());
      if (error) throw new Error(`countDuelsSince: ${error.code ?? error.message}`);
      return count ?? 0;
    },

    async insertDuel(row: Omit<DuelLogRow, 'created_at'>) {
      const { error } = await sb.from('duels').insert(row);
      if (error) throw new Error(`insertDuel: ${error.code ?? error.message}`);
    },
  };
}
