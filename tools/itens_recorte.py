# Itens de equipamento (arte da IA, 4 itens em 2x2 sobre fundo verde): separa cada item, tira o verde (vira transparência),
# põe cada um numa tela 4:3 (800 x 600) com folga, e salva em public/assets/gear/<slot>_<n>.comum.webp. (R-ARTE-6)
# Uso: python -I tools/itens_recorte.py chapeu        Entrada: docs/arte/itens/<slot>s_original.jpg (chapeus)
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SLOT = sys.argv[1] if len(sys.argv) > 1 else "chapeu"
ARQ = {"chapeu": "docs/arte/itens/chapeus_original.jpg"}[SLOT]
W4, H4 = 800, 600
FIT = 0.88          # o item ocupa no máximo 88% da largura e da altura da tela 4:3

A = np.array(Image.open(ARQ).convert("RGB")).astype(float)
H, W, _ = A.shape
quads = [(0, 0), (W // 2, 0), (0, H // 2), (W // 2, H // 2)]   # 1 2 / 3 4
for n, (qx, qy) in enumerate(quads, start=1):
    c = A[qy:qy + H // 2, qx:qx + W // 2]
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    verde = np.clip(g - np.maximum(r, b), 0, None)
    alpha = np.clip(1 - verde / 150.0, 0, 1)
    alpha[alpha > 0.97] = 1
    rgb = np.dstack([r, np.minimum(g, np.maximum(r, b) + 4), b])
    # só o maior pedaço (o item): tira respingos soltos
    lab, k = ndi.label(alpha > 0.5)
    sizes = ndi.sum(alpha > 0.5, lab, range(1, k + 1))
    keep = ndi.binary_dilation(lab == (1 + int(np.argmax(sizes))), iterations=6)
    alpha = alpha * keep
    ys, xs = np.where(alpha > 0.5)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    im = Image.fromarray(np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].astype(np.uint8), "RGBA")
    s = min(W4 * FIT / im.width, H4 * FIT / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    tela = Image.new("RGBA", (W4, H4), (0, 0, 0, 0))
    tela.alpha_composite(im, ((W4 - im.width) // 2, (H4 - im.height) // 2))
    out = f"public/assets/gear/{SLOT}_{n}.comum.webp"
    tela.save(out, "WEBP", quality=88, method=6)
    print(out, "item", im.size, "escala", round(s, 3))
