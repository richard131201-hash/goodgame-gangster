/**
 * Arte das armas (R-ARTE-1, R-ARTE-2): imagens do fundador, recortadas (fundo transparente) em public/assets/weapons.
 * Cada arma tem três versões, no estilo do antigo Goodgame Gangster:
 *   - "comum": só a borda preta;
 *   - "epico": borda branca e brilho vermelho (desfocado);
 *   - "lendario": borda branca e brilho roxo (desfocado).
 * ORIGEM (R-ORIGEM-1): item épico NUNCA é vendido na loja (só se obtém matando integrantes de distritos ou Wanteds) e o
 * lendário só vem de eventos. A loja só vende item de moldura comum.
 * Usadas onde a arma está parada: painel da Arma, Mala, loja e balões. Na mão do personagem e na arena
 * a arma continua sendo o desenho vetorial (weaponSprites.ts), porque a posição da mão e do cano depende dele.
 * Arma sem imagem cai no desenho vetorial ou no ícone de texto.
 */
export type ArtFrame = 'comum' | 'epico' | 'lendario';

/** Molduras que a loja pode vender (R-ORIGEM-1). */
export const SHOP_FRAMES: readonly ArtFrame[] = ['comum'];

/** Armas que têm imagem. */
export const WEAPON_ART_IDS: readonly string[] = ['colt_1911', 'pump_trench', 'tommy_gun', 'bar_1918', 'springfield_1903'];

/**
 * Moldura das armas que NASCEM épicas ou lendárias. Hoje nenhuma: toda arma do catálogo é vendida na loja, então é comum.
 * Épico e lendário virão dos distritos, dos Wanteds e dos eventos (a fazer), e a moldura será do item recebido.
 */
export const WEAPON_FRAME: Readonly<Record<string, ArtFrame>> = {};

export const MISSIONS_ICON_URL = '/assets/icons/chapeu.webp';
export const FICHA_ICON_URL = '/assets/icons/ficha.webp';

export const weaponFrame = (weaponId: string): ArtFrame => WEAPON_FRAME[weaponId] ?? 'comum';

/** A loja pode vender esta arma? Só as de moldura comum (épico nunca; lendário nunca). */
export const sellableInShop = (weaponId: string): boolean => SHOP_FRAMES.includes(weaponFrame(weaponId));

export function weaponArtUrl(weaponId: string | null | undefined, frame?: ArtFrame): string | null {
  if (!weaponId || !WEAPON_ART_IDS.includes(weaponId)) return null;
  return `/assets/weapons/${weaponId}.${frame ?? weaponFrame(weaponId)}.webp`;
}

/** <img> da arma, ou '' se ela ainda não tem imagem. `draggable=false` deixa o arrastar para o slot que a contém. */
export function weaponArtImg(weaponId: string | null | undefined, cls = ''): string {
  const url = weaponArtUrl(weaponId);
  return url ? `<img class="warr ${cls}" src="${url}" alt="" decoding="async" draggable="false">` : '';
}
