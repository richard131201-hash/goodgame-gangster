import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NOTICE_KINDS, NoticeQueue, noticeSignature, noticeTitle } from '../../src/web/notice.js';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('fila de avisos (R-AVISO-1)', () => {
  it('mostra um aviso por vez, na ordem em que chegaram', () => {
    const q = new NoticeQueue();
    void q.push({ message: 'um' }, false);
    void q.push({ message: 'dois' }, false);
    expect(q.next()?.opts.message).toBe('um');
    expect(q.next()).toBeNull(); // o primeiro ainda está na tela
    q.close(true);
    expect(q.next()?.opts.message).toBe('dois');
  });

  it('fechar resolve a promessa com a resposta (true confirma, false cancela)', async () => {
    const q = new NoticeQueue();
    const a = q.push({ message: 'duelar?' }, true);
    q.next();
    q.close(false);
    expect(await a).toBe(false);
    const b = q.push({ message: 'sair?' }, true);
    q.next();
    q.close(true);
    expect(await b).toBe(true);
  });

  it('o mesmo aviso repetido não entra duas vezes (o servidor recusando a cada ação não enche a tela)', async () => {
    const q = new NoticeQueue();
    const igual = { kind: 'erro' as const, message: 'O servidor não aceitou', detail: 'item repetido' };
    const p1 = q.push(igual, false);
    q.next(); // na tela
    const p2 = q.push({ ...igual }, false); // igual ao que está na tela
    expect(q.waiting).toBe(0);
    q.close(true);
    await Promise.all([p1, p2]); // as duas promessas terminam
    expect(q.busy).toBe(false);
  });

  it('perguntas nunca são descartadas, mesmo iguais', () => {
    const q = new NoticeQueue();
    void q.push({ message: 'sair?' }, true);
    void q.push({ message: 'sair?' }, true);
    expect(q.waiting).toBe(2);
  });

  it('avisos diferentes (outra mensagem, tipo ou detalhe) entram na fila', () => {
    const q = new NoticeQueue();
    void q.push({ kind: 'cash', message: 'a' }, false);
    void q.push({ kind: 'ouro', message: 'a' }, false);
    void q.push({ kind: 'cash', message: 'b' }, false);
    void q.push({ kind: 'cash', message: 'a', detail: 'x' }, false);
    expect(q.waiting).toBe(4);
    expect(noticeSignature({ kind: 'cash', message: 'a' })).not.toBe(noticeSignature({ kind: 'ouro', message: 'a' }));
  });
});

describe('aparência dos avisos (R-AVISO-1)', () => {
  const html = ler('index.html');

  it('todo tipo tem título, carimbo e um ícone que existe no conjunto de ícones', () => {
    const definidos = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
    for (const [tipo, k] of Object.entries(NOTICE_KINDS)) {
      expect(k.title.length, tipo).toBeGreaterThan(0);
      expect(k.stamp.length, tipo).toBeGreaterThan(0);
      expect(definidos.has(k.icon), `${tipo}: ${k.icon}`).toBe(true);
    }
  });

  it('o título pode ser trocado e, sem ele, vem do tipo', () => {
    expect(noticeTitle({ kind: 'mala', message: 'x' })).toBe('Mala cheia');
    expect(noticeTitle({ kind: 'mala', title: 'Outro', message: 'x' })).toBe('Outro');
    expect(noticeTitle({ message: 'x' })).toBe('Aviso');
  });

  it('a janela fica no centro, por cima de tudo, só com rem (nada de px)', () => {
    const css = ler('src/web/style.css');
    expect(css).toMatch(/#notice-root \{ position: fixed; inset: 0; z-index: 30000;/);
    expect(css).toMatch(/\.notice-backdrop \{[^}]*display: grid; place-items: center;/);
    const bloco = css.slice(css.indexOf('AVISOS NO CENTRO DA TELA'));
    expect(bloco).not.toMatch(/\d\s*px\b/);
  });
});

describe('o jogo não usa mais as janelas do navegador (R-AVISO-1)', () => {
  it('nenhum alert, confirm ou prompt no código do jogo', () => {
    const dir = join(process.cwd(), 'src', 'web');
    for (const arq of readdirSync(dir).filter(f => f.endsWith('.ts'))) {
      const linhas = readFileSync(join(dir, arq), 'utf8').split('\n');
      linhas.forEach((l, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(l)) return; // comentários
        expect(/(^|[^.\w])(alert|confirm|prompt)\(/.test(l), `${arq}:${i + 1}: ${l.trim()}`).toBe(false);
      });
    }
  });

  it('o main usa os avisos novos nos casos pedidos: energia, ouro, cash, Mala e servidor', () => {
    const main = ler('src/web/main.ts');
    for (const k of ["kind: 'energia'", "kind: 'ouro'", "kind: 'cash'", "kind: 'mala'", "kind: 'erro'"]) expect(main).toContain(k);
    expect(main).toContain("import { notify, ask } from './notice.js'");
  });
});
