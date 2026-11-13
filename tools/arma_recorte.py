# Folha da Arma (arte da IA, com a pistola de placeholder): corta papel liso para a proporção do painel, fundo transparente,
# e separa a pistola em um sprite (some quando há arma equipada). (R-UI-19)
# Uso: python -I tools/arma_recorte.py        Entrada: docs/arte/arma_nova.jpg
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

A = np.array(Image.open("docs/arte/arma_nova.jpg").convert("RGB")).astype(float)
H, W, _ = A.shape
FX0, FX1, FY0, FY1 = 219, 1795, 475, 1752      # miolo da moldura de tinta (px da imagem original)

# --- pistola: sprite e apagar da folha -----------------------------------------------------------------------------------
reg = (slice(FY0 + 40, FY1 - 40), slice(FX0 + 40, FX1 - 40))
sub = A[reg]
Ls = sub.mean(axis=2)
valid = np.ones(Ls.shape, bool)
est = ndi.gaussian_filter(Ls, 60)
d = est - Ls
mask = d > 12
mask = ndi.binary_opening(mask, iterations=1)
ys, xs = np.where(ndi.binary_dilation(mask, iterations=6))
# caixa do desenho (ignora ruído isolado)
lab, n = ndi.label(ndi.binary_dilation(mask, iterations=12))
sizes = ndi.sum(mask, lab, range(1, n + 1))
keep = lab == (1 + int(np.argmax(sizes)))
yy, xx = np.where(keep & ndi.binary_dilation(mask, iterations=0))
by0, by1, bx0, bx1 = yy.min() - 6, yy.max() + 7, xx.min() - 6, xx.max() + 7
dd = np.clip((est - Ls) / 60.0, 0, 1)
dd[~keep] = 0
dd[dd < 0.05] = 0
ink = np.array([0.42, 0.33, 0.26]) * 255
rgba = np.dstack([np.broadcast_to(ink, sub.shape[:2] + (3,)), np.clip(dd * 1.9, 0, 1) * 255])[by0:by1, bx0:bx1].astype(np.uint8)
Image.fromarray(rgba, "RGBA").save("public/assets/ficha/a-arma-vazia.webp", "WEBP", quality=92, method=6)
sx = (FX0 + 40 + bx0 - FX0) / (FX1 - FX0) * 100
sy = (FY0 + 40 + by0 - FY0) / (FY1 - FY0) * 100
sw = (bx1 - bx0) / (FX1 - FX0) * 100
sh = (by1 - by0) / (FY1 - FY0) * 100
print("pistola: left %.2f%% top %.2f%% w %.2f%% h %.2f%% (do miolo da moldura)" % (sx, sy, sw, sh))

# apaga a pistola: preenche a caixa dela com o papel interpolado das bordas (em baixa resolução) e devolve o grão do papel
from skimage.restoration import inpaint_biharmonic
clean = A.copy()
ry0, ry1 = FY0 + 40 + by0 - 24, FY0 + 40 + by1 + 24
rx0, rx1 = FX0 + 40 + bx0 - 24, FX0 + 40 + bx1 + 24
box = clean[ry0:ry1, rx0:rx1] / 255.0
K = 8
small = np.array(Image.fromarray((box * 255).astype(np.uint8)).resize((box.shape[1] // K, box.shape[0] // K), Image.BILINEAR)).astype(float) / 255.0
mk = np.zeros(small.shape[:2], bool)
mk[3:-3, 3:-3] = True
fillsm = inpaint_biharmonic(small, mk, channel_axis=-1)
fill = np.array(Image.fromarray((np.clip(fillsm, 0, 1) * 255).astype(np.uint8)).resize((box.shape[1], box.shape[0]), Image.BICUBIC)).astype(float)
# grão: alta frequência de uma faixa lisa de papel dentro da moldura, acima da pistola (repetida espelhada)
strip = A[FY0 + 25:FY0 + 150, rx0:rx1]
tiles = []
while sum(t.shape[0] for t in tiles) < box.shape[0]:
    tiles.append(strip if len(tiles) % 2 == 0 else strip[::-1])
grain_src = np.vstack(tiles)[:box.shape[0]]
grain = grain_src - ndi.gaussian_filter(grain_src, (8, 8, 0))
patch = np.clip(fill + grain, 0, 255)
ramp_y = np.minimum(np.arange(box.shape[0]), box.shape[0] - 1 - np.arange(box.shape[0])) / 22.0
ramp_x = np.minimum(np.arange(box.shape[1]), box.shape[1] - 1 - np.arange(box.shape[1])) / 22.0
wgt = np.clip(np.minimum(ramp_y[:, None], ramp_x[None, :]), 0, 1)[..., None]
clean[ry0:ry1, rx0:rx1] = patch * wgt + clean[ry0:ry1, rx0:rx1] * (1 - wgt)

# --- corta papel liso do topo para a proporção do painel -------------------------------------------------------------
ADD = 44   # papel liso a MAIS no topo (copiado da faixa lisa de cima), para o título respirar
F = 20
band = clean[170:170 + ADD]
a_ = clean[:260]
ramp = np.linspace(0, 1, F)[:, None, None]
top_blend = a_[-F:] * (1 - ramp) + band[:F] * ramp
img = np.vstack([a_[:-F], top_blend, band[F:], clean[260:]])
cy = -ADD
Lp = img.mean(axis=2)
paper = ndi.binary_fill_holes(ndi.binary_opening(Lp > 70, iterations=2))
lab, n = ndi.label(paper)
paper = lab == (1 + int(np.argmax(ndi.sum(paper, lab, range(1, n + 1)))))
paper = ndi.binary_erosion(paper, iterations=1)
ys, xs = np.where(paper)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
alpha = np.clip(ndi.gaussian_filter(paper.astype(float), 0.8), 0, 1)
rgba = np.dstack([np.clip(img, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])[y0:y1, x0:x1]
Image.fromarray(rgba, "RGBA").save("public/assets/ficha/a-arma.webp", "WEBP", quality=90, method=6)
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)[y0:y1, x0:x1]).save("docs/arte/arma_ajustada.png")
sw_, sh_ = x1 - x0, y1 - y0
print("folha", sw_, sh_, "proporção", round(sw_ / sh_, 3))
print("miolo da moldura (slot): left %.2f%% right %.2f%% top %.2f%% bottom %.2f%%" % ((FX0 - x0) / sw_ * 100, (sw_ - (FX1 - x0)) / sw_ * 100, (FY0 - cy - y0) / sh_ * 100, (sh_ - (FY1 - cy - y0)) / sh_ * 100))
