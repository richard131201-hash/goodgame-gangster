# Folha da Mala (arte da IA, aprovada): mais respiro embaixo, margens laterais cortadas (proporção do painel), fundo transparente,
# cadeados fechados saem da folha e viram sprites (fechado e aberto) para trocar ao passar o mouse. (R-UI-18)
# Uso: python -I tools/secaoMala_recorte.py
# Entrada: docs/arte/secaoMala/fechados.jpg e aberto.jpg   Saída: public/assets/ficha/c-mala.webp, c-cadeado-fechado.webp, c-cadeado-aberto.webp
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.restoration import inpaint_biharmonic

A = np.array(Image.open("docs/arte/secaoMala/fechados.jpg").convert("RGB")).astype(float)
B = np.array(Image.open("docs/arte/secaoMala/aberto.jpg").convert("RGB")).astype(float)
H, W, _ = A.shape
L = A.mean(axis=2)

# --- 1) acha as 20 molduras (tinta escura) -----------------------------------------------------------------------------
ink = ndi.binary_closing(L < 95, iterations=6)
lab, n = ndi.label(ink)
boxes = []
for s in ndi.find_objects(lab):
    bh, bw = s[0].stop - s[0].start, s[1].stop - s[1].start
    if 250 < bw < 400 and 200 < bh < 330:
        boxes.append([s[1].start, s[0].start, s[1].stop, s[0].stop])
print("molduras achadas:", len(boxes))

# --- 2) tira os cadeados fechados da folha (preenche com o tom liso do slot) --------------------------------------------
def slot_tone(img, box):
    x0, y0, x1, y1 = box
    return np.median(img[y0 + 20:y1 - 20, x0 + 20:x1 - 20].reshape(-1, 3), axis=0)

sprites = {}
clean = A.copy()
locked = [b for b in boxes if b[1] > 600]
for b in locked:
    x0, y0, x1, y1 = b
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    reg = (slice(cy - 80, cy + 80), slice(cx - 75, cx + 75))
    tone = np.median(A[y0 + 25:y0 + 55, x0 + 25:x1 - 25].reshape(-1, 3), axis=0)
    dark = A[reg].mean(axis=2) < tone.mean() - 45
    dark = ndi.binary_dilation(dark, iterations=7)
    sub = clean[reg] / 255.0
    out = inpaint_biharmonic(sub, dark, channel_axis=-1)
    clean[reg] = out * 255.0
    b.append(tuple(tone))

# --- 3) sprites do cadeado fechado e do aberto (coluna do meio da 1ª fileira de cadeados) -----------------------------
ref = sorted(locked, key=lambda b: (b[1], b[0]))[2]
x0, y0, x1, y1, tone = ref
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
INK = np.array([0.26, 0.19, 0.14])
meta = {}
for name, img in (("fechado", A), ("aberto", B)):
    reg = img[cy - 100:cy + 70, cx - 90:cx + 90]
    t = np.array(tone)
    d = (t.mean() - reg.mean(axis=2)) / (t.mean() - 55)
    alpha = np.clip(d, 0, 1)
    alpha[alpha < 0.08] = 0
    ys, xs = np.where(alpha > 0.15)
    ya, yb, xa, xb = ys.min() - 3, ys.max() + 4, xs.min() - 3, xs.max() + 4
    rgba = np.dstack([np.broadcast_to(INK, reg.shape[:2] + (3,)) * 255, alpha * 255])[ya:yb, xa:xb].astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(f"public/assets/ficha/c-cadeado-{name}.webp", "WEBP", quality=92, method=6)
    # posição do sprite em relação à moldura (em % da largura/altura da moldura)
    meta[name] = ((cx - 90 + xa - x0) / (x1 - x0) * 100, (cy - 100 + ya - y0) / (y1 - y0) * 100, (xb - xa) / (x1 - x0) * 100, (yb - ya) / (y1 - y0) * 100, yb)
    print(name, "x%.2f%% y%.2f%% w%.2f%% h%.2f%% (base y=%d)" % meta[name])

# --- 4) respiro embaixo (+EXTRA linhas de papel liso) e margens laterais cortadas --------------------------------------
EXTRA = 44
INS = 1104
src = clean
band_rows = src[48:48 + EXTRA]
mid = np.vstack([src[:INS], band_rows, src[INS:]])
side_strip = src[1060:]                                            # canto torto de baixo
tall = np.array(Image.fromarray(side_strip.astype(np.uint8)).resize((W, side_strip.shape[0] + EXTRA), Image.BICUBIC)).astype(float)
sid = np.vstack([src[:1060], tall])
wx = np.ones(W)
wx[110:1890] = 0
wx[86:110] = np.linspace(1, 0, 24)
wx[1890:1914] = np.linspace(0, 1, 24)
img = sid * wx[None, :, None] + mid * (1 - wx[None, :, None])
h = img.shape[0]
img = np.hstack([img[:, :55], img[:, 180:1830], img[:, 1955:]])
w = img.shape[1]
print("folha:", w, h, "proporção", round(w / h, 3))

# --- 5) fundo azul-marinho vira transparência ---------------------------------------------------------------------------
Lp = img.mean(axis=2)
paper = ndi.binary_fill_holes(ndi.binary_opening(Lp > 70, iterations=2))
lab, n = ndi.label(paper)
paper = lab == (1 + int(np.argmax(ndi.sum(paper, lab, range(1, n + 1)))))
paper = ndi.binary_erosion(paper, iterations=1)
alpha = np.clip(ndi.gaussian_filter(paper.astype(float), 0.8), 0, 1)
rgba = np.dstack([np.clip(img, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save("public/assets/ficha/c-mala.webp", "WEBP", quality=90, method=6)
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save("docs/arte/secaoMala/ajustada.png")

# --- 6) mede as molduras na folha nova (em %) ---------------------------------------------------------------------------
L2 = img.mean(axis=2)
ink = ndi.binary_closing(L2 < 95, iterations=6)
lab, n = ndi.label(ink)
bx = []
for s in ndi.find_objects(lab):
    bh, bw = s[0].stop - s[0].start, s[1].stop - s[1].start
    if 250 < bw < 400 and 200 < bh < 330:
        bx.append((s[1].start, s[0].start, s[1].stop, s[0].stop))
bx.sort(key=lambda b: (round(b[1] / 120), b[0]))
for b in bx:
    print("moldura x%.2f%% y%.2f%% w%.2f%% h%.2f%%" % (b[0] / w * 100, b[1] / h * 100, (b[2] - b[0]) / w * 100, (b[3] - b[1]) / h * 100))
