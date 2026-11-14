# Folha da Mala v2 (arte da IA, molduras coladas): tira os cadeados e a barra de scroll desenhada (o scroll e o cadeado viram peças em código),
# corta margens laterais, fundo transparente, sprites dos cadeados (fechado e aberto). (R-UI-19)
# Uso: python -I tools/secaoMala2_recorte.py        Entrada: docs/arte/secaoMala/v2.jpg
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.restoration import inpaint_biharmonic

A = np.array(Image.open("docs/arte/secaoMala/v2.jpg").convert("RGB")).astype(float)
H, W, _ = A.shape
X0S = [197, 507, 818, 1130, 1442]
FW = 297
Y0S = [116, 350, 585, 820]
FH = 222

clean = A.copy()
meta = None
sprite_closed = None
for r in (2, 3):
    for c in range(5):
        x0, y0 = X0S[c], Y0S[r]
        cx, cy = x0 + FW // 2, y0 + FH // 2
        tone = np.median(A[y0 + 20:y0 + 48, x0 + 20:x0 + FW - 20].reshape(-1, 3), axis=0)
        reg = (slice(cy - 95, cy + 80), slice(cx - 80, cx + 80))
        dark = ndi.binary_dilation(A[reg].mean(axis=2) < tone.mean() - 40, iterations=7)
        if r == 2 and c == 2:
            # sprite do cadeado fechado (o do meio da 1ª fileira de cadeados), com a tinta como alfa
            sub = A[reg]
            alpha = np.clip((tone.mean() - sub.mean(axis=2)) / (tone.mean() - 55), 0, 1)
            alpha[alpha < 0.08] = 0
            ys, xs = np.where(alpha > 0.15)
            ya, yb, xa, xb = ys.min() - 3, ys.max() + 4, xs.min() - 3, xs.max() + 4
            ink = np.array([0.26, 0.19, 0.14]) * 255
            rgba = np.dstack([np.broadcast_to(ink, sub.shape[:2] + (3,)), alpha * 255])[ya:yb, xa:xb].astype(np.uint8)
            sprite_closed = Image.fromarray(rgba, "RGBA")
            px0, py0 = cx - 80 + xa, cy - 95 + ya
            meta = ((px0 - x0) / FW * 100, (py0 - y0) / FH * 100, (xb - xa) / FW * 100, (yb - ya) / FH * 100, py0 + (yb - ya))
        clean[reg] = inpaint_biharmonic(clean[reg] / 255.0, dark, channel_axis=-1) * 255.0

# malinhas dos slots vazios: saem da folha e viram um sprite (assim o item colado não fica sobre o desenho)
suit_sprite = None
for r in (0, 1):
    for c in range(5):
        x0, y0 = X0S[c], Y0S[r]
        cx, cy = x0 + FW // 2, y0 + FH // 2
        toneL = np.median(A[y0 + 22:y0 + 46, x0 + 22:x0 + FW - 22].reshape(-1, 3), axis=0)
        reg = (slice(cy - 75, cy + 75), slice(cx - 100, cx + 100))
        sub = A[reg]
        d = toneL.mean() - sub.mean(axis=2)
        if r == 0 and c == 2:
            alpha = np.clip(d / (toneL.mean() - 110), 0, 1)
            alpha[alpha < 0.06] = 0
            ys, xs = np.where(alpha > 0.12)
            ya, yb, xa, xb = ys.min() - 3, ys.max() + 4, xs.min() - 3, xs.max() + 4
            inkc = np.array([0.38, 0.30, 0.24]) * 255
            rgba = np.dstack([np.broadcast_to(inkc, sub.shape[:2] + (3,)), alpha * 255])[ya:yb, xa:xb].astype(np.uint8)
            suit_sprite = Image.fromarray(rgba, "RGBA")
            sm = ((cx - 100 + xa - x0) / FW * 100, (cy - 75 + ya - y0) / FH * 100, (xb - xa) / FW * 100, (yb - ya) / FH * 100)
        mask = ndi.binary_dilation(d > 22, iterations=6)
        clean[reg] = inpaint_biharmonic(clean[reg] / 255.0, mask, channel_axis=-1) * 255.0
suit_sprite.save("public/assets/ficha/c-mala-vazia.webp", "WEBP", quality=92, method=6)
print("malinha: left %.2f%% top %.2f%% w %.2f%% h %.2f%%" % sm)

sprite_closed.save("public/assets/ficha/c-cadeado-fechado.webp", "WEBP", quality=92, method=6)
# cadeado aberto aprovado (do meio da 1ª fileira de cadeados da 1ª versão), escalado para o corpo do novo cadeado
old_closed = Image.open("docs/arte/secaoMala/sprite_fechado_v1.png")
old_open = Image.open("docs/arte/secaoMala/sprite_aberto_v1.png")
k = sprite_closed.width / old_closed.width
op = old_open.resize((round(old_open.width * k), round(old_open.height * k)), Image.LANCZOS)
op.save("public/assets/ficha/c-cadeado-aberto.webp", "WEBP", quality=92, method=6)
print("sprite fechado", sprite_closed.size, "aberto", op.size, "escala", round(k, 3))
mx, my, mw, mh, base = meta
ox = mx
oy = (base - op.height - Y0S[2]) / FH * 100
print("fechado: left %.2f%% top %.2f%% w %.2f%% h %.2f%%" % (mx, my, mw, mh))
print("aberto : left %.2f%% top %.2f%% w %.2f%% h %.2f%%" % (ox, oy, op.width / FW * 100, op.height / FH * 100))

# barra de scroll desenhada pela IA: some; copia papel liso da margem direita
rx0, rx1, ry0, ry1 = 1786, 1834, 106, 1050
w = rx1 - rx0
strip = clean[ry0:ry1, 1856:1856 + w]
ramp = np.minimum(np.minimum(np.arange(w), w - 1 - np.arange(w)) / 8.0, 1)[None, :, None]
clean[ry0:ry1, rx0:rx1] = strip * ramp + clean[ry0:ry1, rx0:rx1] * (1 - ramp)

# barra de scroll nova: trilho fino e reto, com o mesmo traço das molduras e uma alça no topo (a alça é só desenho por enquanto)
from PIL import ImageDraw
SS = 4
lay = Image.new("RGBA", ((rx1 - rx0) * SS, (ry1 - ry0) * SS), (0, 0, 0, 0))
dr = ImageDraw.Draw(lay)
inkc = (84, 62, 48, 255)
tx0, tx1 = (1796 - rx0) * SS, (1824 - rx0) * SS
ty0, ty1 = (114 - ry0) * SS, (1040 - ry0) * SS
dr.rounded_rectangle([tx0, ty0, tx1, ty1], radius=14 * SS, outline=inkc, width=3 * SS, fill=(222, 204, 170, 120))
hx0, hx1 = (1801 - rx0) * SS, (1819 - rx0) * SS
dr.rounded_rectangle([hx0, (121 - ry0) * SS, hx1, (330 - ry0) * SS], radius=9 * SS, outline=inkc, width=2 * SS, fill=(196, 168, 122, 255))
lay = lay.resize((rx1 - rx0, ry1 - ry0), Image.LANCZOS)
base_img = Image.fromarray(np.clip(clean, 0, 255).astype(np.uint8)).convert("RGBA")
base_img.alpha_composite(lay, (rx0, ry0))
clean = np.array(base_img.convert("RGB")).astype(float)

# margens laterais
img = np.hstack([clean[:, :100], clean[:, 180:1845], clean[:, 1915:]])
Lp = img.mean(axis=2)
paper = ndi.binary_fill_holes(ndi.binary_opening(Lp > 70, iterations=2))
lab, n = ndi.label(paper)
paper = lab == (1 + int(np.argmax(ndi.sum(paper, lab, range(1, n + 1)))))
paper = ndi.binary_erosion(paper, iterations=1)
ys, xs = np.where(paper)
cx0, cx1, cy0, cy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
alpha = np.clip(ndi.gaussian_filter(paper.astype(float), 0.8), 0, 1)
rgba = np.dstack([np.clip(img, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])[cy0:cy1, cx0:cx1]
Image.fromarray(rgba, "RGBA").save("public/assets/ficha/c-mala.webp", "WEBP", quality=90, method=6)
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)[cy0:cy1, cx0:cx1]).save("docs/arte/secaoMala/ajustada_v2.png")
sw, sh = cx1 - cx0, cy1 - cy0
print("folha", sw, sh, "proporção", round(sw / sh, 3))

# moldura de slot LIVRE (clara, sem malinha): vira um retalho para cobrir os slots comprados (3ª fileira em diante), que na folha nasceram escuros
fx0 = (X0S[2] - 80 if X0S[2] >= 180 else X0S[2]) - cx0
fy0 = Y0S[1] - cy0
Image.fromarray(rgba[fy0:fy0 + FH, fx0:fx0 + FW], "RGBA").save("public/assets/ficha/c-slot-livre.webp", "WEBP", quality=92, method=6)
print("moldura livre", FW, FH)

def nx(x):  # x original -> x% na folha nova
    return ((x - 80 if x >= 180 else x) - cx0) / sw * 100

for r in range(4):
    print("linha", r + 1, "y %.2f%% h %.2f%%" % ((Y0S[r] - cy0) / sh * 100, FH / sh * 100), "colunas x%:", ["%.2f" % nx(x) for x in X0S], "w %.2f%%" % (FW / sw * 100))
print("barra: x %.2f%% a %.2f%%, y %.2f%% a %.2f%%" % (nx(1795), nx(1825), (114 - cy0) / sh * 100, (1040 - cy0) / sh * 100))
