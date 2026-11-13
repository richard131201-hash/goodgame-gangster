// FICHA NOVA (R-FICHA-ARTE-1): a Ficha desenhada por IA (couro, álbum de fotos) com os dados do jogo por cima.
// É a Ficha oficial. A antiga só volta com ?ficha=antiga no endereço (útil para comparar), e ?ficha=nova a religa.
const KEY = 'mr_ficha_v2';

/** Decide qual Ficha usar: o endereço manda; senão vale o que ficou guardado; o padrão é a nova. */
export function chooseFicha(search: string, stored: string | null): 'nova' | 'antiga' {
  const q = new URLSearchParams(search).get('ficha');
  if (q === 'nova' || q === 'antiga') return q;
  return stored === 'antiga' ? 'antiga' : 'nova';
}

export function initFichaNova(): void {
  let stored: string | null = null;
  try { stored = localStorage.getItem(KEY); } catch { /* sem armazenamento: usa o padrão (nova) */ }
  const q = new URLSearchParams(location.search).get('ficha');
  const mode = chooseFicha(location.search, stored);
  if (q === 'nova' || q === 'antiga') {
    try { localStorage.setItem(KEY, mode); } catch { /* ignora */ }
  }
  if (mode === 'nova') document.documentElement.setAttribute('data-ficha', 'nova');
  else document.documentElement.removeAttribute('data-ficha');
}
