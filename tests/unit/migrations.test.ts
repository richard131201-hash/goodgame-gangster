import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Regra do fundador (R-SQL-1, 2026-11-11): migrações numeradas em ordem (001, 002, ...),
// com o número no INÍCIO e no FIM de cada arquivo.
const DIR = join(process.cwd(), 'supabase', 'migrations');
const files = readdirSync(DIR).filter(f => f.endsWith('.sql')).sort();

const linhas = (f: string) =>
  readFileSync(join(DIR, f), 'utf8').split(/\r?\n/).filter(l => l.trim() !== '');

describe('migrações SQL (R-SQL-1)', () => {
  it('existe pelo menos uma migração', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('nome no formato NNN_descricao.sql', () => {
    for (const f of files) expect(f).toMatch(/^\d{3}_[a-z0-9_]+\.sql$/);
  });

  it('numeração sequencial, sem pular nem repetir, começando em 001', () => {
    const nums = files.map(f => Number(f.slice(0, 3)));
    nums.forEach((n, i) => expect(n).toBe(i + 1));
  });

  for (const f of files) {
    const num = f.slice(0, 3);
    it(`${f}: número ${num} no início e no fim do arquivo`, () => {
      const l = linhas(f);
      expect(l[0]).toBe(`-- ===== INICIO DA MIGRACAO ${num} (${f}) =====`);
      expect(l[l.length - 1]).toBe(`-- ===== FIM DA MIGRACAO ${num} (${f}) =====`);
    });
  }
});
