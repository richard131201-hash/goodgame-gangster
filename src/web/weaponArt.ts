/**
 * Arte das armas (R-ARTE-1, R-ARTE-2): imagens do fundador, recortadas (fundo transparente) em public/assets/weapons.
 * Cada arma tem duas versões, no estilo do antigo Goodgame Gangster:
 *   - "comum": só a borda preta;
 *   - "epico": borda branca e brilho vermelho (desfocado).
 * Usadas onde a arma está parada: painel da Arma, Mala, loja e balões. Na mão do personagem e na arena
 * a arma continua sendo o desenho vetorial (weaponSprites.ts), porque a posição da mão e do cano depende dele.
 * Arma sem imagem cai no desenho vetorial ou no ícone de texto.
 */
export type ArtFrame = 'comum' | 'epico';

/** Armas que têm imagem. */
export const WEAPON_ART_IDS: readonly string[] = ['colt_1911', 'pump_trench', 'tommy_gun', 'bar_1918', 'springfield_1903'];

/**
 * Qual moldura cada arma usa. PROVISÓRIO (do Claude): as duas melhores armas de cada tipo aparecem como "épico" só para
 * mostrar o estilo; o fundador decide depois, junto com o sistema de itens. Arma que não está aqui usa "comum".
 */
export const WEAPON_FRAME: Readonly<Record<string, ArtFrame>> = {
  bar_1918: 'epico',
  springfield_1903: 'epico',
};

export const MISSIONS_ICON_URL = '/assets/icons/chapeu.webp';
export const FICHA_ICON_URL = '/assets/icons/ficha.webp';

export const weaponFrame = (weaponId: string): ArtFrame => WEAPON_FRAME[weaponId] ?? 'comum';

export function weaponArtUrl(weaponId: string | null | undefined, frame?: ArtFrame): string | null {
  if (!weaponId || !WEAPON_ART_IDS.includes(weaponId)) return null;
  return `/assets/weapons/${weaponId}.${frame ?? weaponFrame(weaponId)}.webp`;
}

/** <img> da arma, ou '' se ela ainda não tem imagem. `draggable=false` deixa o arrastar para o slot que a contém. */
export function weaponArtImg(weaponId: string | null | undefined, cls = ''): string {
  const url = weaponArtUrl(weaponId);
  return url ? `<img class="warr ${cls}" src="${url}" alt="" decoding="async" draggable="false">` : '';
}
