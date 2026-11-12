/** Posição do jogador no Ranking (R-RANK-3). Quem tem mais Respeito fica no topo; posição 1 é a melhor. */

/** Posição entre jogadores reais: o ranking já vem ordenado por Respeito. Devolve null se o jogador não está na lista. */
export function positionInRows(rows: readonly { id: string }[], userId: string | null): number | null {
  if (!userId) return null;
  const i = rows.findIndex(r => r.id === userId);
  return i < 0 ? null : i + 1;
}

/** Posição contra os NPCs do modo offline: 1 + quantos NPCs têm mais Respeito (em empate, o NPC fica acima). */
export function positionAmongNpcs(npcRespects: readonly number[], respect: number): number {
  return 1 + npcRespects.filter(r => r >= respect).length;
}

/** Texto do topo: "#3" ou "—" enquanto a posição não é conhecida. */
export function rankLabel(pos: number | null): string {
  return pos === null ? '—' : `#${pos.toLocaleString('pt-BR')}`;
}
