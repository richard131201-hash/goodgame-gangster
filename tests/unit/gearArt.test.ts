import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gearArtUrl, gearArtImg, GEAR_ART_SLOTS } from '../../src/web/gearArt.js';
import { buildGearItem, GEAR_NAMES } from '../../src/shared/gear.js';
import { ITEM_SLOTS } from '../../src/shared/itemRoll.js';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const item = (slot: (typeof ITEM_SLOTS)[number], variant: number) =>
  buildGearItem(`g_${slot}_t${variant}`, { slot, level: 5, points: { attack: 1, life: 1, astucia: 0, tenacidade: 0 }, variant });

describe('arte dos equipamentos (R-ARTE-6)', () => {
  it('os 4 chapéus e os 4 peitorais têm imagem 4:3 em public/assets/gear, na ordem dos nomes do slot', () => {
    expect(GEAR_ART_SLOTS.chapeu).toBe(4);
    expect(GEAR_ART_SLOTS.peitoral).toBe(4);
    expect(GEAR_NAMES.peitoral).toEqual(['Sobretudo Noir', 'Colete de Couro', 'Paletó Risca de Giz', 'Casaco do Cais']);
    for (let n = 1; n <= 4; n++) expect(existsSync(`public/assets/gear/peitoral_${n}.comum.webp`)).toBe(true);
    expect(gearArtUrl(item('peitoral', 2))).toBe('/assets/gear/peitoral_3.comum.webp');
    expect(GEAR_NAMES.chapeu).toEqual(['Fedora de Feltro', 'Chapéu Panamá', 'Boina do Porto', 'Cartola Velha']);
    for (let n = 1; n <= 4; n++) expect(existsSync(`public/assets/gear/chapeu_${n}.comum.webp`)).toBe(true);
    expect(gearArtUrl(item('chapeu', 0))).toBe('/assets/gear/chapeu_1.comum.webp');
    expect(gearArtUrl(item('chapeu', 3))).toBe('/assets/gear/chapeu_4.comum.webp');
  });

  it('variação fora da lista dá a volta; slot sem arte e item que não é equipamento ficam sem imagem', () => {
    expect(gearArtUrl(item('chapeu', 5))).toBe('/assets/gear/chapeu_2.comum.webp');
    for (const slot of ITEM_SLOTS.filter(s => s !== 'chapeu' && s !== 'peitoral')) expect(gearArtUrl(item(slot, 0))).toBeNull();
    expect(gearArtUrl(null)).toBeNull();
    expect(gearArtImg(item('calca', 0))).toBe('');
    expect(gearArtImg(item('chapeu', 1), 'inv-art')).toContain('class="warr inv-art" src="/assets/gear/chapeu_2.comum.webp"');
  });

  it('na tela: a Mala, o slot do Equipamento e a dica usam a imagem; o CSS não usa px', () => {
    const main = ler('src/web/main.ts');
    expect(main).toContain("gearArtImg(item, 'inv-art')");
    expect(main).toContain("gearArtImg(item, 'gear-art')");
    expect(main).toContain("gearArtImg(item, 'wtip-art')");
    const css = ler('src/web/style.css');
    expect(css).toMatch(/\.gear-slot\.filled \.gear-art \{ position: relative; width: 100%; height: 96%; object-fit: contain;/);
    expect(css.split('R-ARTE-6')[1]).not.toMatch(/\dpx/);
  });
});
