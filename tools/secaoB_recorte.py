# Folha do equipamento (arte da IA): ajusta a proporção do painel (corta faixas de papel liso sem tocar nas molduras),
# tira o fundo azul-marinho (vira transparência) e mede as 8 molduras. Saída: public/assets/ficha/b-equipamento.webp
# Uso: python -I tools/secaoB_recorte.py        Entrada: docs/arte/secaoB/original.jpg
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src = np.array(Image.open("docs/arte/secaoB/original.jpg").convert("RGB")).astype(float)
H, W, _ = src.shape

# faixas de papel liso que saem (y0, y1): título muito alto, vão entre as fileiras e margem de baixo
CUTS = [(50, 167), (636, 672), (1058, 1094)]
FEATHER = 22


def splice(img, cuts):
    out = img
    off = 0
    for y0, y1 in cuts:
        y0 -= off
        y1 -= off
        a, b = out[:y0], out[y1:]
        f = FEATHER
        ramp = np.linspace(0, 1, f)[:, None, None]
        # mistura o fim de "a" com o trecho logo antes do começo de "b" (papel liso nos dois)
        blend = a[-f:] * (1 - ramp) + out[y1 - f:y1] * ramp
        out = np.vstack([a[:-f], blend, b])
        off += (y1 - y0)
    return out


img = splice(src, CUTS)
h, w, _ = img.shape
print("novo tamanho", w, h, "proporção", round(w / h, 3))

L = img.mean(axis=2)
paper = ndi.binary_fill_holes(ndi.binary_opening(L > 70, iterations=2))
lab, n = ndi.label(paper)
paper = lab == (1 + int(np.argmax(ndi.sum(paper, lab, range(1, n + 1)))))
paper = ndi.binary_erosion(paper, iterations=1)
alpha = np.clip(ndi.gaussian_filter(paper.astype(float), 0.8), 0, 1)
rgba = np.dstack([np.clip(img, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save("public/assets/ficha/b-equipamento.webp", "WEBP", quality=90, method=6)

# molduras (tinta escura)
ink = ndi.binary_closing(L < 95, iterations=6)
lab, n = ndi.label(ink)
boxes = []
for s in ndi.find_objects(lab):
    bh, bw = s[0].stop - s[0].start, s[1].stop - s[1].start
    if bw > 250 and bh > 200 and bw < 600:
        boxes.append((s[1].start, s[0].start, s[1].stop, s[0].stop))
boxes.sort(key=lambda b: (round(b[1] / 300), b[0]))
for b in boxes:
    print("moldura x%.2f%% y%.2f%% w%.2f%% h%.2f%%" % (b[0] / w * 100, b[1] / h * 100, (b[2] - b[0]) / w * 100, (b[3] - b[1]) / h * 100))
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save("docs/arte/secaoB/ajustada.png")
