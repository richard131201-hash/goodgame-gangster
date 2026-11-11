import { describe, it, expect } from 'vitest';
import { validateCredentials, translateAuthError, MIN_PASSWORD_LENGTH } from '../../src/web/authRules.js';
import { saveKeyFor, LOCAL_SAVE_KEY } from '../../src/web/saveKey.js';

describe('validateCredentials (R-CONTA-1)', () => {
  it('senha mínima é 8', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it('pede e-mail e senha', () => {
    expect(validateCredentials('', 'x', 'login')).toMatch(/e-mail/i);
    expect(validateCredentials('a@b.com', '', 'login')).toMatch(/senha/i);
  });

  it('rejeita e-mail inválido', () => {
    for (const e of ['abc', 'a@b', 'a b@c.com', '@c.com', 'a@.com']) {
      expect(validateCredentials(e, '12345678', 'signup')).not.toBeNull();
    }
  });

  it('aceita e-mail válido, com espaços nas pontas', () => {
    expect(validateCredentials('  jogador@exemplo.com ', '12345678', 'signup')).toBeNull();
  });

  it('ao criar conta exige 8 caracteres; ao entrar não revalida o tamanho', () => {
    expect(validateCredentials('a@b.com', '1234567', 'signup')).toMatch(/8/);
    expect(validateCredentials('a@b.com', '12345678', 'signup')).toBeNull();
    expect(validateCredentials('a@b.com', '123', 'login')).toBeNull();
  });
});

describe('translateAuthError', () => {
  it('traduz pelos códigos do Supabase', () => {
    expect(translateAuthError('invalid_credentials', 'x')).toMatch(/incorretos/);
    expect(translateAuthError('user_already_exists', 'x')).toMatch(/Já existe/);
    expect(translateAuthError('email_exists', 'x')).toMatch(/Já existe/);
    expect(translateAuthError('weak_password', 'x')).toMatch(/fraca/);
    expect(translateAuthError('email_not_confirmed', 'x')).toMatch(/Confirme/);
    expect(translateAuthError('over_request_rate_limit', 'x')).toMatch(/Muitas tentativas/);
    expect(translateAuthError('signup_disabled', 'x')).toMatch(/fechadas/);
  });

  it('traduz pela mensagem quando não há código', () => {
    expect(translateAuthError(undefined, 'Invalid login credentials')).toMatch(/incorretos/);
    expect(translateAuthError(null, 'User already registered')).toMatch(/Já existe/);
    expect(translateAuthError(null, 'Failed to fetch')).toMatch(/conexão/);
  });

  it('erro desconhecido vira mensagem genérica e nunca vaza texto técnico', () => {
    const t = translateAuthError('algo_novo', 'SELECT * FROM auth.users failed at line 3');
    expect(t).toBe('Não foi possível concluir. Tente de novo em instantes.');
    expect(t).not.toMatch(/SELECT|auth\./);
  });
});

describe('saveKeyFor (R-CONTA-2)', () => {
  it('sem conta usa a chave antiga (não perde saves existentes)', () => {
    expect(saveKeyFor(null)).toBe(LOCAL_SAVE_KEY);
    expect(saveKeyFor(undefined)).toBe('gangster_rpg_save_v1');
  });

  it('cada conta tem uma chave própria e diferente', () => {
    const a = saveKeyFor('11111111-aaaa');
    const b = saveKeyFor('22222222-bbbb');
    expect(a).not.toBe(b);
    expect(a).toBe('gangster_rpg_save_v1_11111111-aaaa');
    expect(a).not.toBe(LOCAL_SAVE_KEY);
  });
});
