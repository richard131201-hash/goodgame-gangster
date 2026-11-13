# Limpa a moldura da Ficha gerada por IA (R-FICHA-ARTE-1): tira as "quinas" (cantos de foto) de todos os slots
# e o clipe do retrato (o clipe volta por cima, em código). Gera também o recorte de slot vazio.
# Uso: python -I tools/ficha_limpa.py    (origem: docs/arte/ficha_original.jpg)
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.restoration import inpaint_biharmonic

SRC = "docs/arte/ficha_original.jpg"
OUT = "public/assets/ficha/"
im = Image.open(SRC).convert("RGB")
a = np.array(im)
g = a.astype(float).mean(axis=2)

# 1) acha o papel dos slots (claro e amarelado)
papel = (g > 185) & ((a[..., 0].astype(int) - a[..., 2]) > 18)
papel = ndi.binary_opening(papel, iterations=2)
lab, _ = ndi.label(papel)
slots = []  # (y0, x0, y1, x1) do papel de cada slot
for s in ndi.find_objects(lab):
    h, w = s[0].stop - s[0].start, s[1].stop - s[1].start
    if 120 < w < 300 and 100 < h < 230 and s[1].start > 800:
        slots.append((s[0].start, s[1].start, s[0].stop, s[1].stop))
# a 3ª fileira da Mala (com cadeado) tem o papel mais listrado: completa pela grade
xs = [89, 286, 484, 681, 879]
for x in xs:
    for y in (652, 803, 954):
        if not any(abs(s[0] - y) < 6 and abs(s[1] - x) < 6 for s in slots):
            slots.append((y, x, y + 120, x + 166))
print("slots:", len(slots))

# 2) máscara das quinas: pixels de tom médio (nem papel claro, nem couro escuro) nos 4 cantos de cada slot
mask = np.zeros(g.shape, bool)
C = 58  # lado do canto procurado
for (y0, x0, y1, x1) in slots:
    for cy, cx in ((y0 - 12, x0 - 12), (y0 - 12, x1 + 12 - C), (y1 + 12 - C, x0 - 12), (y1 + 12 - C, x1 + 12 - C)):
        sub = (g[cy:cy + C, cx:cx + C] > 62) & (g[cy:cy + C, cx:cx + C] < 178)
        mask[cy:cy + C, cx:cx + C] |= sub
mask = ndi.binary_opening(mask, iterations=1)
mask = ndi.binary_dilation(mask, iterations=3)
# só dentro do slot (não mexe no couro em volta)
dentro = np.zeros_like(mask)
for (y0, x0, y1, x1) in slots:
    dentro[y0 - 14:y1 + 14, x0 - 14:x1 + 14] = True
mask &= dentro

# A remoção automática das quinas deixa os cantos borrados (testado); por isso fica desligada até haver
# uma versão sem quinas gerada pela IA. O clipe sai bem.
REMOVER_QUINAS = False
if not REMOVER_QUINAS:
    mask[:] = False

# 3) clipe do retrato: contorno desenhado à mão (o clipe não é mais cinza que o fundo, então não dá para achar por cor)
from PIL import ImageDraw
def _pt(px, py):
    return (248 + px / 6, 98 + py / 6)
_perna = [(92, 135), (62, 430), (70, 480), (110, 500), (150, 490), (185, 440), (200, 235)]
_alca = [(92, 135), (105, 80), (150, 35), (200, 35), (240, 75), (245, 130)]
_m = Image.new("L", (g.shape[1], g.shape[0]), 0)
_d = ImageDraw.Draw(_m)
for linha in (_perna, _alca):
    _d.line([_pt(*q) for q in linha], fill=255, width=17, joint="curve")
clip = np.array(_m) > 0

def inpaint(img, m, pad=30):
    out = img.copy()
    lab_, n = ndi.label(ndi.binary_dilation(m, iterations=6))
    for sl in ndi.find_objects(lab_):
        ys = slice(max(0, sl[0].start - pad), min(img.shape[0], sl[0].stop + pad))
        xs_ = slice(max(0, sl[1].start - pad), min(img.shape[1], sl[1].stop + pad))
        mm = m[ys, xs_]
        if not mm.any():
            continue
        out[ys, xs_] = (inpaint_biharmonic(img[ys, xs_].astype(float) / 255, mm, channel_axis=-1) * 255).clip(0, 255).astype(np.uint8)
    return out

# quinas: o buraco é preenchido com o papel mais próximo (as quinas ficam sobre o papel), depois suavizado
conhecido = papel & ~ndi.binary_dilation(mask, iterations=2)
idx = ndi.distance_transform_edt(~conhecido, return_distances=False, return_indices=True)
papel_prox = a[idx[0], idx[1]].astype(float)
suave = np.stack([ndi.gaussian_filter(papel_prox[..., k], 2.0) for k in range(3)], axis=-1)
quinas = ndi.binary_dilation(mask, iterations=1)
res = a.astype(float)
w = ndi.gaussian_filter(quinas.astype(float), 1.2)[..., None]
res = res * (1 - w) + suave * w
res = res.clip(0, 255).astype(np.uint8)
# clipe: continua por inpaint (fica sobre fundo variado)
res = inpaint(res, clip)

# o canto superior esquerdo fica limpo; os outros três são cópias espelhadas dele (o papel dos slots é igual)
Cn = 58
ref_y0, ref_x0 = slots[0][0] - 12, slots[0][1] - 12
canto = Image.fromarray(res[ref_y0:ref_y0 + Cn, ref_x0:ref_x0 + Cn])
feather = Image.new("L", (Cn, Cn), 0)
ImageDraw.Draw(feather).rectangle((4, 4, Cn - 5, Cn - 5), fill=255)
from PIL import ImageFilter
feather = feather.filter(ImageFilter.GaussianBlur(2.5))
base = Image.fromarray(res)
for (y0, x0, y1, x1) in []:
    yt, xl, yb, xr = y0 - 12, x0 - 12, y1 + 12 - Cn, x1 + 12 - Cn
    base.paste(canto, (xl, yt), feather)
    base.paste(canto.transpose(Image.FLIP_LEFT_RIGHT), (xr, yt), feather.transpose(Image.FLIP_LEFT_RIGHT))
    base.paste(canto.transpose(Image.FLIP_TOP_BOTTOM), (xl, yb), feather.transpose(Image.FLIP_TOP_BOTTOM))
    base.paste(canto.transpose(Image.ROTATE_180), (xr, yb), feather.transpose(Image.ROTATE_180))
res = np.array(base)
Image.fromarray(res).save(OUT + "moldura.webp", "WEBP", quality=88, method=6)
# recorte de slot vazio (a partir de um slot vazio já sem quinas)
y0, x0, y1, x1 = 652, 89, 772, 255
Image.fromarray(res[y0 + 3:y1 - 3, x0 + 3:x1 - 3]).save(OUT + "slot-vazio.webp", "WEBP", quality=92)
Image.fromarray(res).save("docs/arte/ficha_limpa.png")
print("ok")
