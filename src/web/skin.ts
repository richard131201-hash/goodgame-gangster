/**
 * Tema visual da pasta (R-LAYOUT-9): "couro" (couro escuro com dourado, o padrão) ou "bege" (papel manila).
 * Só muda a aparência. É guardado neste navegador (localStorage); se o navegador não deixar, volta ao padrão.
 */
export type Skin = 'couro' | 'bege';
export const SKIN_KEY = 'mobster-skin';
export const DEFAULT_SKIN: Skin = 'couro';

export function readSkin(): Skin {
  try {
    const v = localStorage.getItem(SKIN_KEY);
    if (v === 'bege' || v === 'couro') return v;
  } catch {
    /* sem armazenamento: usa o padrão */
  }
  return DEFAULT_SKIN;
}

export function applySkin(skin: Skin): void {
  document.documentElement.setAttribute('data-skin', skin);
}

/** Troca de tema, aplica na página e guarda. Devolve o tema novo. */
export function toggleSkin(): Skin {
  const next: Skin = readSkin() === 'couro' ? 'bege' : 'couro';
  try {
    localStorage.setItem(SKIN_KEY, next);
  } catch {
    /* tudo bem: vale só nesta sessão */
  }
  applySkin(next);
  return next;
}

/** Título e carimbo da orelha da pasta em cada aba (identidade de "arquivo"). */
export const FOLDER_HEADERS: Record<string, { title: string; stamp: string }> = {
  perfil: { title: 'FICHA', stamp: 'CONFIDENCIAL' },
  missoes: { title: 'MISSÕES DO DON', stamp: 'URGENTE' },
  duelos: { title: 'FICHAS DE RIVAIS', stamp: 'PROCURADO' },
  loja: { title: 'MERCADO NEGRO', stamp: 'SEM NOTA' },
  ranking: { title: 'ARQUIVO DA CIDADE', stamp: 'ARQUIVADO' },
  familia: { title: 'REGISTRO DAS FAMÍLIAS', stamp: 'CONFIDENCIAL' },
  distritos: { title: 'DISTRITOS', stamp: 'TERRITÓRIO' },
  tarefas: { title: 'TAREFAS', stamp: 'PENDENTE' },
  eventos: { title: 'EVENTOS', stamp: 'EM BREVE' },
  simulador: { title: 'RELATÓRIO DO SIMULADOR', stamp: 'RASCUNHO' },
};
