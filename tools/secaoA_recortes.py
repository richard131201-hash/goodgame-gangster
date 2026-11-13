# Recorta as 5 peças da seção A (arte da IA, ajustada) em fundo transparente, para a Ficha (R-UI-16).
# Uso: python -I tools/secaoA_recortes.py        Entrada: docs/arte/secaoA/ajustada.png   Saída: public/assets/ficha/a-*.webp
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src = Image.open("docs/arte/secaoA/ajustada.png").convert("RGB")
a = np.array(src)
L = a.astype(float).mean(axis=2)

# (nome, x0, x1, y0, y1, limiar de luminância)
PIECES = [
    ("a-retrato", 45, 668, 0, 748, 58),
    ("a-nota", 674, 1242, 205, 592, 58),     # a ponta esquerda fica escondida atrás do retrato no jogo
    ("a-placa", 1350, 1962, 255, 552, 58),
    ("a-arma", 1350, 1962, 558, 1102, 58),
    ("a-cartao", 48, 1328, 745, 1188, 58),
]

for name, x0, x1, y0, y1, th in PIECES:
    sub = a[y0:y1, x0:x1]
    m = L[y0:y1, x0:x1] > th
    if name == "a-retrato":
        m[205 - y0:600 - y0, 612 - x0:] = False   # a ponta esquerda da nota não faz parte do retrato
    m = ndi.binary_opening(m, iterations=1)
    m = ndi.binary_fill_holes(m)
    lab, n = ndi.label(m)
    if n > 1:
        sizes = ndi.sum(m, lab, range(1, n + 1))
        m = lab == (1 + int(np.argmax(sizes)))
    m = ndi.binary_erosion(m, iterations=1)
    alpha = np.clip(ndi.gaussian_filter(m.astype(float), 0.8), 0, 1)
    ys, xs = np.where(alpha > 0.02)
    cy0, cy1, cx0, cx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([sub, (alpha * 255).astype(np.uint8)])[cy0:cy1, cx0:cx1]
    im = Image.fromarray(rgba, "RGBA")
    im.save(f"public/assets/ficha/{name}.webp", "WEBP", quality=90, method=6)
    print(name, im.size, "recorte em", (x0 + cx0, y0 + cy0))
