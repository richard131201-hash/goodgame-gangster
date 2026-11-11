/**
 * Regras puras de conta (sem rede, sem DOM): validação e mensagens em português.
 * Regra R-CONTA-1 (docs/REGRAS_DO_JOGO.md): senha com no mínimo 8 caracteres.
 */
export const MIN_PASSWORD_LENGTH = 8;
export type AuthMode = 'login' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Retorna a mensagem de erro em português, ou null se estiver tudo certo. */
export function validateCredentials(email: string, password: string, mode: AuthMode): string | null {
  const e = email.trim();
  if (!e) return 'Digite o seu e-mail.';
  if (!EMAIL_RE.test(e)) return 'Esse e-mail não parece válido. Confira se digitou certo.';
  if (!password) return 'Digite a sua senha.';
  if (mode === 'signup' && password.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

/**
 * Nome do personagem (R-PERSONAGEM-2): 3 a 24 caracteres (igual à regra do banco), só letras
 * (com acento), números, espaço e . ' " - _ . Sem < > & etc., pois o nome aparece em listas
 * (ranking) e não pode carregar HTML.
 */
export const MIN_NAME_LENGTH = 3;
export const MAX_NAME_LENGTH = 24;
const NAME_RE = /^[\p{L}\p{N} '".\-_]+$/u;

export function validateCharacterName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return 'Escolha um nome para o seu personagem.';
  if (name.length < MIN_NAME_LENGTH) return `O nome precisa ter pelo menos ${MIN_NAME_LENGTH} letras.`;
  if (name.length > MAX_NAME_LENGTH) return `O nome pode ter no máximo ${MAX_NAME_LENGTH} caracteres.`;
  if (!NAME_RE.test(name)) return 'Use só letras, números, espaço e os sinais . \' " - _';
  return null;
}

/** Nome já limpo (sem espaços nas pontas nem repetidos), pronto para gravar. */
export function cleanCharacterName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Traduz o erro do Supabase (pelo código; se não houver, pela mensagem) para português. */
export function translateAuthError(code: string | undefined | null, message: string | undefined | null): string {
  const c = (code || '').toLowerCase();
  const m = (message || '').toLowerCase();

  if (c === 'invalid_credentials' || m.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (c === 'user_already_exists' || c === 'email_exists' || m.includes('already registered')) {
    return 'Já existe uma conta com esse e-mail. Use "Entrar".';
  }
  if (c === 'weak_password' || m.includes('password should be')) {
    return `Senha fraca. Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres, misturando letras e números.`;
  }
  if (c === 'email_not_confirmed' || m.includes('email not confirmed')) {
    return 'Confirme o seu e-mail antes de entrar (veja a caixa de entrada e o spam).';
  }
  if (c === 'email_address_invalid' || m.includes('invalid email')) {
    return 'Esse e-mail não foi aceito. Confira se digitou certo.';
  }
  if (c === 'signup_disabled' || m.includes('signups not allowed')) {
    return 'Novas contas estão temporariamente fechadas.';
  }
  if (c.includes('rate_limit') || m.includes('rate limit') || m.includes('too many')) {
    return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  }
  if (m.includes('failed to fetch') || m.includes('network') || c === 'unexpected_failure') {
    return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  }
  return 'Não foi possível concluir. Tente de novo em instantes.';
}
