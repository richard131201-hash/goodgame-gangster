// Modos de interface (R-UI-2, R-FICHA-ARTE-1):
//  - "v2": o Estilo 2 montado em código (topo estilo GGG, Ficha em 3 colunas, barra inferior com rótulos). É o padrão.
//  - "ia": a Ficha sobre a moldura desenhada por IA (com o topo e a barra antigos).
//  - "antiga": a Ficha antiga.
// Troca com ?ui=v2|ia|antiga no endereço (fica guardado no navegador). Também aceita o antigo ?ficha=nova|antiga.
const KEY = 'mr_ui';
export type Ui = 'v2' | 'ia' | 'antiga';

export function chooseUi(search: string, stored: string | null): Ui {
  const p = new URLSearchParams(search);
  const legado: Record<string, Ui> = { nova: 'ia', antiga: 'antiga' };
  const q = p.get('ui') ?? legado[p.get('ficha') ?? ''] ?? null;
  if (q === 'v2' || q === 'ia' || q === 'antiga') return q;
  return stored === 'ia' || stored === 'antiga' ? stored : 'v2';
}

export function initUi(): void {
  let stored: string | null = null;
  try { stored = localStorage.getItem(KEY); } catch { /* sem armazenamento: usa o padrão */ }
  const p = new URLSearchParams(location.search);
  const mode = chooseUi(location.search, stored);
  if (p.has('ui') || p.has('ficha')) {
    try { localStorage.setItem(KEY, mode); } catch { /* ignora */ }
  }
  const root = document.documentElement;
  root.removeAttribute('data-ui');
  root.removeAttribute('data-ficha');
  if (mode === 'v2') root.setAttribute('data-ui', 'v2');
  else if (mode === 'ia') root.setAttribute('data-ficha', 'nova');
}
