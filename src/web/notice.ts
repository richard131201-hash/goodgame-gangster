/**
 * Avisos do jogo no padrão da pasta (R-AVISO-1): janela no centro da tela, no lugar dos alert() e confirm() do navegador.
 *
 * - `notify`: aviso com um botão. Devolve uma promessa que resolve quando o jogador fecha.
 * - `ask`: pergunta com dois botões. Devolve true (confirmou) ou false (cancelou).
 * - Vários avisos viram uma fila (um por vez). O mesmo aviso repetido não entra duas vezes.
 * A parte de fila e de textos é pura (testada sem tela); só `render` mexe no HTML.
 */
import { attachStitch } from './stitch.js';

let disposeStitch: (() => void) | null = null;

export type NoticeKind = 'info' | 'energia' | 'cash' | 'ouro' | 'mala' | 'sucesso' | 'erro' | 'familia' | 'duelo';

export interface NoticeOptions {
  kind?: NoticeKind;
  /** Título na orelha. Se faltar, vem do tipo. */
  title?: string;
  message: string;
  /** Linha pequena abaixo da mensagem (por exemplo, o motivo técnico). */
  detail?: string;
  okLabel?: string;
  /** Fecha sozinho depois deste tempo (avisos de sucesso). */
  autoCloseMs?: number;
}

export interface AskOptions extends NoticeOptions {
  cancelLabel?: string;
}

/** Aparência de cada tipo: ícone do conjunto de ícones, título e carimbo. */
export const NOTICE_KINDS: Record<NoticeKind, { icon: string; img?: string; title: string; stamp: string }> = {
  info: { icon: 'i-file', title: 'Aviso', stamp: 'AVISO' },
  energia: { icon: 'i-bolt', img: '/assets/icons/energia.webp', title: 'Energia', stamp: 'AVISO' },
  cash: { icon: 'i-cash', img: '/assets/icons/cash.webp', title: 'Cash', stamp: 'SEM FUNDOS' },
  ouro: { icon: 'i-coin', img: '/assets/icons/ouro.webp', title: 'Ouro', stamp: 'SEM OURO' },
  mala: { icon: 'i-bag', title: 'Mala cheia', stamp: 'SEM ESPAÇO' },
  sucesso: { icon: 'i-check', title: 'Feito', stamp: 'APROVADO' },
  erro: { icon: 'i-alert', title: 'Atenção', stamp: 'RECUSADO' },
  familia: { icon: 'i-family', title: 'Família', stamp: 'AVISO' },
  duelo: { icon: 'i-swords', title: 'Duelo', stamp: 'AVISO' },
};

export const noticeTitle = (o: NoticeOptions) => o.title ?? NOTICE_KINDS[o.kind ?? 'info'].title;

/** Identifica um aviso para não repeti-lo (mesmo tipo, título, mensagem e detalhe). */
export function noticeSignature(o: NoticeOptions): string {
  return [o.kind ?? 'info', noticeTitle(o), o.message, o.detail ?? ''].join('|');
}

interface Item {
  opts: AskOptions;
  isAsk: boolean;
  resolve: (v: boolean) => void;
}

/** Fila pura: um aviso por vez, em ordem, sem repetir o mesmo aviso que já está na tela ou esperando. */
export class NoticeQueue {
  private items: Item[] = [];
  private shown: Item | null = null;

  /** Coloca na fila. Devolve a promessa do aviso, ou a do aviso igual que já existe. */
  push(opts: AskOptions, isAsk: boolean): Promise<boolean> {
    if (!isAsk) {
      const sig = noticeSignature(opts);
      const dup = [this.shown, ...this.items].find(i => i && !i.isAsk && noticeSignature(i.opts) === sig);
      if (dup) return new Promise<boolean>(res => {
        const prev = dup.resolve;
        dup.resolve = v => {
          prev(v);
          res(v);
        };
      });
    }
    return new Promise<boolean>(resolve => {
      this.items.push({ opts, isAsk, resolve });
    });
  }

  /** O próximo a mostrar (ou null). Marca como em tela. */
  next(): Item | null {
    if (this.shown || !this.items.length) return null;
    this.shown = this.items.shift()!;
    return this.shown;
  }

  /** Fecha o que está em tela com a resposta dada. */
  close(answer: boolean): void {
    const s = this.shown;
    this.shown = null;
    s?.resolve(answer);
  }

  get busy(): boolean {
    return this.shown !== null;
  }
  get waiting(): number {
    return this.items.length;
  }
}

// ---------------------------------------------------------------------------------------------
// Tela (só no navegador)
// ---------------------------------------------------------------------------------------------
const queue = new NoticeQueue();
let timer: ReturnType<typeof setTimeout> | null = null;
let lastFocus: HTMLElement | null = null;

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

function root(): HTMLElement {
  let el = document.getElementById('notice-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'notice-root';
    document.body.appendChild(el);
  }
  return el;
}

function close(answer: boolean) {
  if (timer) clearTimeout(timer);
  timer = null;
  const r = root();
  disposeStitch?.();
  disposeStitch = null;
  r.innerHTML = '';
  r.classList.remove('open');
  document.removeEventListener('keydown', onKey, true);
  queue.close(answer);
  lastFocus?.focus?.();
  showNext();
}

let current: { isAsk: boolean } | null = null;
function onKey(e: KeyboardEvent) {
  if (!current) return;
  if (e.key === 'Escape') {
    e.preventDefault(); // Esc também não fecha: só o botão fecha
    e.stopPropagation();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    close(true);
  } else if (e.key === 'Tab') {
    // mantém o foco dentro da janela
    const btns = [...root().querySelectorAll<HTMLElement>('button')];
    if (!btns.length) return;
    const i = btns.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    btns[(i + (e.shiftKey ? btns.length - 1 : 1)) % btns.length].focus();
  }
}

function showNext() {
  const item = queue.next();
  current = item ? { isAsk: item.isAsk } : null;
  if (!item) return;
  const o = item.opts;
  const k = NOTICE_KINDS[o.kind ?? 'info'];
  lastFocus = (document.activeElement as HTMLElement) ?? null;
  const r = root();
  r.classList.add('open');
  r.innerHTML = `
    <div class="notice-backdrop" data-notice-backdrop>
      <div class="notice-card notice-${o.kind ?? 'info'}" role="alertdialog" aria-modal="true" aria-labelledby="notice-title" aria-describedby="notice-msg">
        <div class="notice-ear" id="notice-title">${esc(noticeTitle(o)).toUpperCase()}</div>
        <div class="notice-stamp" aria-hidden="true">${esc(item.isAsk ? 'CONFIRMAR' : k.stamp)}</div>
        <div class="notice-sheet">
          <div class="notice-icon" aria-hidden="true">${k.img ? `<img class="notice-img" src="${k.img}" alt="" draggable="false">` : `<svg class="ico"><use href="#${k.icon}"/></svg>`}</div>
          <div class="notice-body">
            <p class="notice-msg" id="notice-msg">${esc(o.message)}</p>
            ${o.detail ? `<p class="notice-detail">${esc(o.detail)}</p>` : ''}
          </div>
        </div>
        <div class="notice-actions">
          ${item.isAsk ? `<button type="button" class="notice-btn" data-notice-cancel>${esc(o.cancelLabel ?? 'Cancelar')}</button>` : ''}
          <button type="button" class="notice-btn primary" data-notice-ok>${esc(o.okLabel ?? (item.isAsk ? 'Confirmar' : 'Entendi'))}</button>
        </div>
      </div>
    </div>`;
  const card = r.querySelector<HTMLElement>('.notice-card');
  if (card) disposeStitch = attachStitch({ host: card, top: () => card.querySelector<HTMLElement>('.notice-ear'), insetRem: 0.45 });
  r.querySelector<HTMLElement>('[data-notice-ok]')?.addEventListener('click', () => close(true));
  r.querySelector<HTMLElement>('[data-notice-cancel]')?.addEventListener('click', () => close(false));
  // R-AVISO-2: clicar fora do aviso NÃO fecha; só o botão (ou Enter, que aciona o botão em foco)
  document.addEventListener('keydown', onKey, true);
  r.querySelector<HTMLElement>('[data-notice-ok]')?.focus();
  if (o.autoCloseMs && !item.isAsk) timer = setTimeout(() => close(true), o.autoCloseMs);
}

/** Aviso no centro da tela. Resolve quando o jogador fecha (ou quando fecha sozinho). */
export function notify(opts: NoticeOptions | string): Promise<void> {
  const o: NoticeOptions = typeof opts === 'string' ? { message: opts } : opts;
  const p = queue.push(o, false).then(() => undefined);
  if (!queue.busy) showNext();
  return p;
}

/** Pergunta no centro da tela. Resolve true se confirmou e false se cancelou (Esc ou botão). */
export function ask(opts: AskOptions): Promise<boolean> {
  const p = queue.push(opts, true);
  if (!queue.busy) showNext();
  return p;
}
