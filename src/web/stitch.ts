// Costura (linha tracejada) das pastas: ela contorna a aba ativa e faz UMA conexão só com a pasta (R-PASTA-1).
// Vale para a pasta principal (abas da esquerda e título do alto), a subpasta da Mala e os avisos do centro.
// A linha é um SVG desenhado por cima da pasta; as medidas saem do que está na tela, então acompanha qualquer tamanho.

type Pt = [number, number];

export interface StitchSpec {
  /** Elemento que recebe o desenho (posicionado) e dentro do qual as medidas são feitas. */
  host: HTMLElement;
  /** A pasta em si (onde a costura corre pelas bordas). Se faltar, usa o próprio host. */
  body?: () => HTMLElement | null;
  /** Aba presa ao topo da pasta (título, subaba ativa, orelha do aviso). */
  top?: () => HTMLElement | null;
  /** Aba presa à esquerda da pasta (aba de ícone ativa). */
  left?: () => HTMLElement | null;
  /** Distância da borda da pasta até a costura, em rem. */
  insetRem: number;
}

/** Distância da costura até a borda da pasta: a mesma em TODO o jogo (R-PASTA-1). */
export const STITCH_INSET_REM = 0.25;

const SVG_NS = 'http://www.w3.org/2000/svg';

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Tira pontos repetidos e pontos no meio de uma reta. */
export function cleanPoints(pts: Pt[]): Pt[] {
  const q: Pt[] = [];
  for (const p of pts) {
    const l = q[q.length - 1];
    if (!l || dist(p, l) > 0.5) q.push(p);
  }
  while (q.length > 2 && dist(q[0], q[q.length - 1]) <= 0.5) q.pop();
  let changed = true;
  while (changed && q.length > 3) {
    changed = false;
    for (let i = 0; i < q.length; i++) {
      const a = q[(i - 1 + q.length) % q.length], b = q[i], c = q[(i + 1) % q.length];
      const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (Math.abs(cross) < 0.01) {
        q.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return q;
}

/** Caminho fechado com cantos arredondados (raio limitado à metade do lado menor). */
export function roundedPath(points: Pt[], radius: number): string {
  const q = cleanPoints(points);
  const n = q.length;
  if (n < 3) return '';
  const f = (v: number) => Math.round(v * 100) / 100;
  const toward = (from: Pt, to: Pt, d: number): Pt => {
    const len = dist(from, to) || 1;
    return [from[0] + ((to[0] - from[0]) * d) / len, from[1] + ((to[1] - from[1]) * d) / len];
  };
  let d = '';
  for (let i = 0; i < n; i++) {
    const prev = q[(i - 1 + n) % n], cur = q[i], next = q[(i + 1) % n];
    const r = Math.min(radius, dist(prev, cur) / 2, dist(cur, next) / 2);
    const a = toward(cur, prev, r);
    const b = toward(cur, next, r);
    d += `${i === 0 ? 'M' : 'L'}${f(a[0])} ${f(a[1])} Q${f(cur[0])} ${f(cur[1])} ${f(b[0])} ${f(b[1])} `;
  }
  return d + 'Z';
}

interface Box { l: number; t: number; r: number; b: number }

/** O contorno: a pasta, mais a aba do topo e a aba da esquerda, quando existem, numa linha só. */
export function stitchOutline(folder: Box, d: number, top?: Box | null, left?: Box | null): Pt[] {
  const fl = folder.l + d, ft = folder.t + d, fr = folder.r - d, fb = folder.b - d;
  const pts: Pt[] = [];
  if (top) {
    const tl = Math.max(top.l + d, fl), tr = Math.min(top.r - d, fr), tt = top.t + d;
    pts.push([fl, ft], [tl, ft], [tl, tt], [tr, tt], [tr, ft]);
  } else {
    pts.push([fl, ft]);
  }
  pts.push([fr, ft], [fr, fb], [fl, fb]);
  if (left) {
    const lt = Math.max(left.t + d, ft), lb = Math.min(left.b - d, fb), ll = left.l + d;
    pts.push([fl, lb], [ll, lb], [ll, lt], [fl, lt]);
  }
  return pts;
}

export function attachStitch(spec: StitchSpec): () => void {
  const { host } = spec;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'stitch-svg');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  svg.appendChild(path);
  host.appendChild(svg);
  host.classList.add('has-stitch');
  let bodyMarked: HTMLElement | null = null;

  const rel = (el: HTMLElement, hr: DOMRect, k: number): Box => {
    const r = el.getBoundingClientRect();
    return { l: (r.left - hr.left) / k, t: (r.top - hr.top) / k, r: (r.right - hr.left) / k, b: (r.bottom - hr.top) / k };
  };

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => schedule()) : null;
  let raf = 0;
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      draw();
    });
  }

  function draw() {
    const body = spec.body?.() ?? host;
    if (body !== bodyMarked) {
      bodyMarked?.classList.remove('has-stitch');
      body.classList.add('has-stitch');
      bodyMarked = body;
    }
    const w = host.offsetWidth, h = host.offsetHeight;
    ro?.disconnect();
    ro?.observe(host);
    ro?.observe(body);
    if (!w || !h) {
      path.setAttribute('d', '');
      return;
    }
    const hr = host.getBoundingClientRect();
    const k = hr.width / w || 1; // escala das animações (ex.: o aviso entrando)
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const shown = (el: HTMLElement | null | undefined) => (el && el.offsetWidth > 0 && el.offsetHeight > 0 ? el : null); // aba escondida não entra no desenho
    const top = shown(spec.top?.());
    const left = shown(spec.left?.());
    if (top) ro?.observe(top);
    if (left) ro?.observe(left);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const folder = rel(body, hr, k);
    const pts = stitchOutline(folder, spec.insetRem * rem, top ? rel(top, hr, k) : null, left ? rel(left, hr, k) : null);
    path.setAttribute('d', roundedPath(pts, 0.6 * rem));
  }

  const mo = new MutationObserver(() => schedule());
  mo.observe(host, { attributes: true, attributeFilter: ['class', 'aria-selected', 'data-tab'], subtree: true });
  const onEnd = () => schedule();
  host.addEventListener('transitionend', onEnd, true);
  host.addEventListener('animationend', onEnd, true);
  window.addEventListener('resize', onEnd);
  void document.fonts?.ready.then(onEnd);
  draw();

  return () => {
    mo.disconnect();
    ro?.disconnect();
    if (raf) cancelAnimationFrame(raf);
    host.removeEventListener('transitionend', onEnd, true);
    host.removeEventListener('animationend', onEnd, true);
    window.removeEventListener('resize', onEnd);
    svg.remove();
    host.classList.remove('has-stitch');
    bodyMarked?.classList.remove('has-stitch');
  };
}
