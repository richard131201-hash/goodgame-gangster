/**
 * Arte das armas (R-ARTE-1): imagens do fundador, já recortadas (fundo transparente), em public/assets/weapons.
 * Usadas onde a arma aparece parada: painel da Arma, Mala, loja e balões. Na mão do personagem e na arena
 * a arma continua sendo o desenho vetorial (weaponSprites.ts), porque a posição da mão e do cano depende dele.
 * Arma sem imagem cai no desenho vetorial ou no ícone de texto.
 */
export const WEAPON_ART: Readonly<Record<string, string>> = {
  colt_1911: '/assets/weapons/colt_1911.webp',
  pump_trench: '/assets/weapons/pump_trench.webp',
  tommy_gun: '/assets/weapons/tommy_gun.webp',
  bar_1918: '/assets/weapons/bar_1918.webp',
  springfield_1903: '/assets/weapons/springfield_1903.webp',
};

export const MISSIONS_ICON_URL = '/assets/icons/chapeu.webp';

export function weaponArtUrl(weaponId: string | null | undefined): string | null {
  return (weaponId && WEAPON_ART[weaponId]) || null;
}

/** <img> da arma, ou '' se ela ainda não tem imagem. `draggable=false` deixa o arrastar para o slot que a contém. */
export function weaponArtImg(weaponId: string | null | undefined, cls = ''): string {
  const url = weaponArtUrl(weaponId);
  return url ? `<img class="warr ${cls}" src="${url}" alt="" decoding="async" draggable="false">` : '';
}
