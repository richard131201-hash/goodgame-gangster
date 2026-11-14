import { describe, it, expect } from 'vitest';
import { migrateLegacyGear } from '../../src/shared/gear.js';
import type { GameItem } from '../../src/web/gameData.js';

describe('item gravado só com o essencial vira item inteiro ao carregar (Mala sem "undefined")', () => {
  it('equipamento com id, posição e dados do sorteio ganha nome, ícone, tipo e atributos; a posição na Mala continua', () => {
    const p = {
      level: 5,
      equipped: { gear: {} } as { gear: Record<string, string> } & Record<string, unknown>,
      inventory: [
        { id: 'g_chapeu_teste3', slot: 2, gear: { slot: 'chapeu', level: 1, points: { attack: 0, life: 0, astucia: 1, tenacidade: 0 }, variant: 2 } },
        { id: 'g_peitoral_teste4', slot: 7, gear: { slot: 'peitoral', level: 1, points: { attack: 0, life: 0, astucia: 0, tenacidade: 1 }, variant: 3 } },
      ] as unknown as GameItem[],
    };
    expect(migrateLegacyGear(p)).toBe(true);
    const [chapeu, peitoral] = p.inventory;
    expect(chapeu.name).toBe('Boina do Porto');
    expect(chapeu.type).toBe('gear');
    expect(chapeu.icon).toBeTruthy();
    expect(chapeu.slot).toBe(2);
    expect(chapeu.statsBonus).toEqual({ astucia: 1 });
    expect(peitoral.name).toBe('Casaco do Cais');
    expect(peitoral.slot).toBe(7);
  });

  it('item que já está inteiro não muda', () => {
    const inteiro = { id: 'g_chapeu_x1', name: 'Fedora de Feltro', type: 'gear', icon: '🎩', gear: { slot: 'chapeu', level: 1, points: { attack: 1, life: 0, astucia: 0, tenacidade: 0 }, variant: 0 } } as unknown as GameItem;
    const p = { level: 5, equipped: { gear: {} } as { gear: Record<string, string> } & Record<string, unknown>, inventory: [inteiro] };
    migrateLegacyGear(p);
    expect(p.inventory[0]).toBe(inteiro);
  });
});
