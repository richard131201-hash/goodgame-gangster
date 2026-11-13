# Prompt para gerar a arte da Ficha (identidade visual do Mobster Rise) - versão 2

Versão 2 (2026-11-13), refeita depois que a v1 deu resultado fraco: a v1 pedia a cidade junto, não tinha esquema colorido nem imagem de estilo, e a IA errou o número de slots. A v2 volta ao método que funcionou na primeira geração da Ficha.

Fonte das medidas: jogo a 1920 x 1080 (16:9). Gerador do esquema: `tools/ficha_mapa_ia.py`.

## VERSÃO 4 - identidade de "folhas" (2026-11-13)
Mudança de direção do fundador: a v3 também deu resultado ruim (a IA transforma cada caixa do esquema em uma "ficha" de couro separada). Nova ideia: **definir primeiro a identidade visual**, com a Ficha feita de **folhas de papel** (não couro, não fichas/cards), com **apenas a marcação dos lugares dos itens** (8 de equipamento e 1 de arma). O resto (atributos, Mala, textos, brasão) será feito no design/código por cima da folha. **Não anexe esquema**: a IA estraga o desenho quando segue caixas.

```
A single full-screen game interface background, 16:9, 2560x1440, seen from directly above, perfectly straight and front-facing, no perspective. One large sheet of aged paper, like a 1930s police or mafia dossier page, lying flat on a dark desk. The paper covers about 92% of the image, with a thin strip of flat dark brown desk visible at the very edges.

Material: warm cream and ivory paper with visible fibers, light coffee stains, faint fold creases, slightly worn and softly torn edges, a couple of small ink smudges and a faint rubber-stamp ink mark in muted red. Calm painted illustration style, muted warm palette, soft even lighting, a very subtle paper shadow only. It must read as PAPER, not leather, not cards, not panels, not frames, not wood.

Draw ONLY these placeholders on the paper, nothing else. Each is an empty rectangle with a 4:3 proportion, hand-inked with a thin dark sepia line and four small corner marks, all exactly the same size:
- 8 equipment placeholders in a grid of 4 columns x 2 rows, in the upper right area of the sheet.
- 1 weapon placeholder, same size, in the upper middle of the sheet, left of the equipment grid.
Everything else on the sheet stays blank paper: no boxes, no tables, no title bars, no lines, no buttons, no icons, no decoration other than the aged paper itself. Leave the left half and the lower half of the sheet completely free (it will be filled by the game design later).

ABSOLUTELY NO text, letters, numbers, logos, faces, items, hands or watermarks anywhere.
```

**Peça 4 variações** e troque só a linha "Material" para explorar a identidade:
- **A (padrão):** dossiê policial de papel creme envelhecido (acima).
- **B:** papel de livro-caixa, creme com pauta verde bem fraca e margem vermelha fina.
- **C:** papel pardo manila de pasta de arquivo, com marcas de uso e uma fita de papel colada na borda.
- **D:** folha amarelada de bloco de anotações, com furos de espiral na esquerda e borda picotada.

**Negativo (se houver campo):** `leather, stitching, rivets, cards, photo frames, panels, wood frame, 3D, perspective, glowing, neon, text, letters, numbers, tables, grid lines, icons, people, weapons`

**Variação opcional:** acrescente "inside each placeholder, a very faint pale ghost silhouette of the item type (hat, vest, trousers, shoe, clover, cat, ring, car, pistol)" se você quiser os desenhos fantasma. Por padrão não pedi, porque você quer só a marcação.

**Depois de escolher a identidade:** eu uso a textura de papel como fundo da Ficha, meço onde ficaram os 9 lugares dos itens, e monto o resto (atributos, Mala, papel do nome, brasão, textos) em código, com fonte de máquina de escrever, carimbos e tinta, na mesma identidade.

## VERSÃO 3 - só o protótipo anexado (2026-11-13)
A v2 (3 imagens) também deu resultado ruim. A v3 volta ao método mais simples: **anexe somente `docs/arte/ficha_mapa_colorido.png`**, sem print e sem imagem de estilo. O estilo vai descrito em texto.

```
Image 1 is a strict LAYOUT WIREFRAME in 16:9. Redraw it as a finished game interface, keeping EVERY box at exactly the same position, size and proportion. Do not move, merge, resize, add or remove any box. Each colored box is one separate piece of the interface. The words written inside the boxes are only instructions for you: never write them in the final image.

Count carefully: the equipment panel (purple) has EXACTLY 8 slots, 4 columns x 2 rows. The bag panel (blue and gray) has EXACTLY 20 slots, 5 columns x 4 rows. The attributes panel (green) has EXACTLY 4 rows with a small button at the right end of each. The bottom bar has EXACTLY 10 equal compartments.

Style: a vintage 1930s mafia dossier / photo album. Calm painted illustration, muted warm palette (dark stitched leather brown, aged cream paper, small gold accents), soft even lighting. No glow, no neon, no vignette, no reflections, no heavy black outlines. Every piece is flat, straight, front-facing, perfectly horizontal and vertical, with crisp straight edges. No perspective.

Background of the whole image: a perfectly flat solid dark navy (#14141f). Nothing else, no scenery.

Pieces:
- Portrait box (blue, top left): an empty wooden photo frame with a cream paper card and a metal paper clip. No face.
- Name note (beige, overlapping the portrait): a small aged-paper note with a small dark leather tab stuck on its top edge. Blank.
- Attributes (green): a lined notebook sheet with 4 ruled rows and an empty brass pill button at the right end of each row.
- Class | Defense plaque (gold, split in two halves): a small leather plaque with a thin stitched vertical line in the middle; left half an engraved empty round medallion, right half an engraved shield silhouette.
- Weapon box (red): a small leather panel with one cream-paper album slot with a faint pale ghost silhouette of a pistol.
- Equipment panel (purple): leather panel with 8 identical cream-paper album slots (four small photo corners, thin embossed frame, soft inner shadow). Inside each, a faint low-contrast embossed ghost silhouette at 25% opacity: hat, vest jacket, trousers, shoe (first row); four-leaf clover, small cat, ring, vintage car (second row).
- Bag panel (blue and gray): leather panel with 20 identical album slots. Rows 1 and 2: plain empty slots, no silhouettes. Rows 3 and 4 (gray): look locked, slightly darker paper with faint diagonal hatching and a small brass padlock centered on each slot.
- Free area (gold, bottom right): one large empty leather panel with a stitched border and a faint diagonal-stripe pattern. Nothing inside.
- Bottom bar (gold): a long leather bar divided into 10 equal empty compartments.
Leave a blank title strip at the top of the equipment, weapon and bag panels. The top strip of the image stays flat navy.

ABSOLUTELY NO text, letters, numbers, logos, faces, items, hands or watermarks anywhere. Slots and panels stay empty, except the faint ghost silhouettes described above.
```

## O que muda em relação à v1
- **A IA desenha só a interface**, sobre um fundo azul-marinho chapado. A cidade de Chicago não vai na imagem: o jogo já usa a imagem da tela inicial como fundo e põe a interface por cima.
- **3 imagens de referência**, não uma: (1) esquema colorido e numerado, (2) print da Ficha atual, (3) a primeira moldura que você gostou (`ficha_original.jpg`), como estilo.
- **Contagem explícita** de slots (8 e 20), que foi o erro mais grave da v1.
- **Volta o que dava qualidade**: desenho fantasma nos slots, caderno pautado nos atributos, retrato em quadro de madeira com clipe, cadeados.

## Anexe, nesta ordem
1. `docs/arte/ficha_mapa_colorido.png` (layout; o mais importante)
2. Um **print da sua Ficha atual** no jogo, em tela cheia (de preferência com itens e arma)
3. `docs/arte/ficha_original.jpg` (estilo: couro, papel creme, dourado)

Formato **16:9**, **2560 x 1440**.

## Prompt (copiar e colar)

```
Image 1 is a strict LAYOUT WIREFRAME in 16:9. Redraw it as a finished game interface keeping EVERY box at exactly the same position, size and proportion. Do not move, merge, resize, add or remove any box. Count carefully: the equipment panel has EXACTLY 8 slots (4 columns x 2 rows). The bag panel has EXACTLY 20 slots (5 columns x 4 rows). The attributes panel has EXACTLY 4 rows. The bottom bar has EXACTLY 10 equal compartments.
Image 2 is a screenshot of the current game screen, only to understand what each box is for and the real proportions.
Image 3 is the STYLE reference: copy its materials and finish exactly (dark brown stitched leather, aged cream paper slots with a thin embossed gold-brown frame and soft inner shadow, lined notebook paper, brass pill buttons, wooden photo frame with paper clip, small brass padlocks, faint engraved ghost silhouettes). Calm painted illustration, muted warm palette, soft even lighting, no glow, no neon, no vignette, no heavy black outlines.

Background of the whole image: a perfectly FLAT SOLID dark navy color (#14141f), nothing else. No city, no scenery, no texture, no gradient, no shadows on the background. The top strip of the image (above the portrait and the panels) is just that flat navy.

Draw each wireframe element as a separate finished piece, flat, straight, front-facing, perfectly horizontal and vertical, crisp straight edges, no perspective:
1. PORTRAIT: vertical wooden photo-frame stack with a cream paper card inside, ornate corners and a metal paper clip. Empty, no face.
2. NAME NOTE: a small aged-paper note slightly tilted (about 2 degrees), overlapping the lower right corner of the portrait, with a small dark leather tab stuck on its top edge. Blank.
3. ATTRIBUTES: a lined notebook sheet (ledger ruling, torn left edge) with 4 rows; at the right end of each row an empty brass pill-shaped button. Blank.
4. CLASS | DEFENSE plaque: a small leather plaque split into two equal halves by a thin stitched vertical line; left half an engraved empty round medallion, right half an engraved shield silhouette. No text.
5. WEAPON: one cream-paper album slot (4:3) with a thin gold frame and a faint ghost silhouette of a pistol, inside a small leather panel.
6. EQUIPMENT: a leather panel with 8 cream-paper album slots (4:3), 4 columns x 2 rows, each with a faint low-contrast embossed ghost silhouette at 25% opacity, in this order: hat, vest jacket, trousers, shoe / four-leaf clover, small cat, ring, vintage car.
7. BAG: a leather panel with 20 cream-paper album slots (4:3), 5 columns x 4 rows. Rows 1 and 2 are plain empty slots (no silhouettes). Rows 3 and 4 look locked: slightly darker paper with faint diagonal hatching and a small brass padlock centered on each slot.
8. FREE AREA (bottom right): one large empty leather panel with stitched border and a faint diagonal-stripe pattern. Nothing inside.
9. BOTTOM BAR: a long leather bar divided into 10 equal empty compartments by thin stitched lines.

Leave a clear blank title strip at the top of the equipment, weapon and bag panels (the game writes the titles itself).

ABSOLUTELY NO text, letters, numbers, logos, faces, items, hands or watermarks anywhere. Every slot and panel stays empty, except the faint ghost silhouettes described above.
```

## Prompt negativo (se a ferramenta tiver o campo)
```
city, scenery, background art, text, letters, numbers, watermark, signature, logo, people, face, weapon inside slots, items, perspective, 3D render, isometric, tilted panels (except the small note), curved panels, extra slots, missing slots, 3x3 grid, 4 columns bag, glossy plastic, neon, glow, vignette, sci-fi, fantasy, photo, heavy black outlines
```

## Depois de gerar (como eu uso a imagem)
1. Você escolhe a melhor versão e me envia.
2. Eu **meço onde cada caixa ficou** e encaixo o código nela, em porcentagem. Se um slot sair deslocado, eu ajusto a medida, sem gerar de novo.
3. Eu removo o azul-marinho (viram transparência) e o jogo mostra a cidade de Chicago por trás.
4. Desenhos fantasma dos slots e textos: se sobrarem letras na arte, limpo por código; os ícones/itens reais entram por cima.

## Se mesmo assim errar as posições
Plano B, em peças separadas (mais robusto): peça cada peça sozinha, em fundo navy chapado: (a) painel de couro 1024 x 1024; (b) slot de papel creme 4:3; (c) o mesmo slot bloqueado, com cadeado; (d) caderno de atributos; (e) quadro do retrato; (f) nota do nome com abinha. Eu monto no jogo com as medidas exatas.

## Medidas de referência (em % do palco; x, y, largura, altura)
| Área | x | y | larg. | alt. |
|---|---|---|---|---|
| Retrato | 12,39 | 3,51 | 11,36 | 23,41 |
| Papel do nome | 21,89 | 14,13 | 13,42 | 9,92 |
| Aba da família | 22,86 | 12,17 | 4,90 | 2,35 |
| Atributos | 12,31 | 29,07 | 24,69 | 13,64 |
| Brasão (classe / defesa) | 37,98 | 13,27 | 11,52 | 9,66 |
| Arma (caixa) | 37,98 | 24,24 | 11,52 | 18,47 |
| Equipamento | 50,49 | 13,27 | 37,20 | 29,44 |
| Mala | 12,31 | 44,02 | 37,20 | 44,03 |
| Área de duelo | 50,49 | 44,02 | 37,20 | 44,03 |
| Barra de abas | 21,66 | 91,99 | 56,67 | 7,86 |
| Slot de equipamento | (4 x 2) | | 8,41 | 11,21 |
| Slot da Mala | (5 x 4) | | 6,79 | 9,06 |
