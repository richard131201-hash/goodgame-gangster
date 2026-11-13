// FICHA NOVA, EM TESTE (R-FICHA-ARTE-1): a Ficha desenhada por IA (couro, álbum de fotos) com os dados do jogo por cima.
// Só liga com ?ficha=nova na endereço (fica guardado no navegador) e desliga com ?ficha=antiga. Sem isso, nada muda.
const KEY = 'mr_ficha';

/** Decide qual Ficha usar a partir do endereço (?ficha=nova|antiga) e do que ficou guardado. */
export function chooseFicha(search: string, stored: string | null): 'nova' | 'antiga' {
  const q = new URLSearchParams(search).get('ficha');
  if (q === 'nova' || q === 'antiga') return q;
  return stored === 'nova' ? 'nova' : 'antiga';
}

export function initFichaNova(): void {
  let stored: string | null = null;
  try { stored = localStorage.getItem(KEY); } catch { /* sem armazenamento: usa a antiga */ }
  const mode = chooseFicha(location.search, stored);
  try { localStorage.setItem(KEY, mode); } catch { /* ignora */ }
  if (mode === 'nova') document.documentElement.setAttribute('data-ficha', 'nova');
  else document.documentElement.removeAttribute('data-ficha');
}
