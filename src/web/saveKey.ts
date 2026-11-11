/**
 * Chave do save local por conta (R-CONTA-2): cada conta tem o próprio save no navegador,
 * assim duas contas no mesmo computador não misturam personagens.
 * Sem conta (modo local, sem Supabase configurado) usa a chave antiga, para não perder saves existentes.
 */
export const LOCAL_SAVE_KEY = 'gangster_rpg_save_v1';

export function saveKeyFor(userId: string | null | undefined): string {
  return userId ? `${LOCAL_SAVE_KEY}_${userId}` : LOCAL_SAVE_KEY;
}
