# Itens de equipamento (arte da IA, 4 itens em 2x2 sobre fundo verde): separa cada item, tira o verde (vira transparência),
# põe cada um numa tela 4:3 (800 x 600) com folga, e salva em public/assets/gear/<slot>_<n>.comum.webp. (R-ARTE-6)
# Os 4 itens são achados pelos 4 maiores pedaços (um cabide ou gancho que passa da metade da imagem não é cortado).
# Ordem: 1 cima-esquerda, 2 cima-direita, 3 baixo-esquerda, 4 baixo-direita (a mesma ordem dos nomes do slot).
# Uso: python -I tools/itens_recorte.py chapeu|peitoral        Entrada: docs/arte/itens/<slot>s_original.jpg
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SLOT = sys.argv[1] if len(sys.argv) > 1 else "chapeu"
ARQ = {"chapeu": "docs/arte/itens/chapeus_original.jpg", "peitoral": "docs/arte/itens/peitorais_original.jpg"}[SLOT]
W4, H4 = 800, 600
FIT = 0.88          # o item ocupa no máximo 88% da largura e da altura da tela 4:3
# Acabamento (R-ARTE-9): a arte da IA veio escura (o miolo quase igual ao contorno) e com o contorno meio craquelado.
# Clareia o miolo (o preto continua preto) e refaz o contorno por código: um anel preto liso e uniforme.
BRILHO, CONTRASTE, SATURA = 1.5, 1.08, 1.15
R_FORA, R_DENTRO = 4, 5        # espessura do anel preto, em px da tela 800 x 600: para fora e para dentro da silhueta


def acabamento(img):
    a = np.array(img).astype(float)
    m = ndi.gaussian_filter(a[..., 3] / 255, 1.5) > 0.5                       # silhueta lisa, sem serrilhado
    macio = np.clip((ndi.gaussian_filter(a[..., 3] / 255, 1.0) - 0.5) * 4 + 0.5, 0, 1)
    rgb = a[..., :3] / 255
    rgb = np.clip(rgb * BRILHO, 0, 1)
    rgb = np.clip((rgb - 0.5) * CONTRASTE + 0.5, 0, 1)
    g = (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2])[..., None]
    rgb = np.clip(g + (rgb - g) * SATURA, 0, 1)
    din, dout = ndi.distance_transform_edt(m), ndi.distance_transform_edt(~m)
    sd = np.where(m, -din, dout)                                              # distância com sinal: negativa dentro
    anel = np.clip(R_FORA + 0.5 - sd, 0, 1) * np.clip(sd + R_DENTRO + 0.5, 0, 1)
    anel = np.clip(ndi.gaussian_filter(anel, 0.9) * 1.25, 0, 1)                # borda sem degraus
    rgb = rgb * (1 - anel[..., None])
    alpha = np.maximum(macio * m, anel)
    out = np.dstack([rgb * 255, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")

A = np.array(Image.open(ARQ).convert("RGB")).astype(float)
H, W, _ = A.shape
r, g, b = A[..., 0], A[..., 1], A[..., 2]
verde = np.clip(g - np.maximum(r, b), 0, None)
alpha = np.clip(1 - verde / 150.0, 0, 1)
alpha[alpha > 0.97] = 1
rgb = np.dstack([r, np.minimum(g, np.maximum(r, b) + 4), b])

lab, k = ndi.label(ndi.binary_dilation(alpha > 0.5, iterations=4))
sizes = ndi.sum(alpha > 0.5, lab, range(1, k + 1))
top4 = list(np.argsort(sizes)[::-1][:4] + 1)
cent = {i: ndi.center_of_mass(lab == i) for i in top4}                         # (y, x)
top = sorted([i for i in top4 if cent[i][0] < H / 2], key=lambda i: cent[i][1])
bot = sorted([i for i in top4 if cent[i][0] >= H / 2], key=lambda i: cent[i][1])
ordem = top + bot
assert len(ordem) == 4, "esperava 4 itens"
for n, i in enumerate(ordem, start=1):
    m = lab == i
    a_ = alpha * ndi.binary_dilation(m, iterations=6)
    ys, xs = np.where(a_ > 0.5)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    im = Image.fromarray(np.dstack([rgb, a_ * 255])[y0:y1, x0:x1].astype(np.uint8), "RGBA")
    s = min(W4 * FIT / im.width, H4 * FIT / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    tela = Image.new("RGBA", (W4, H4), (0, 0, 0, 0))
    tela.alpha_composite(im, ((W4 - im.width) // 2, (H4 - im.height) // 2))
    tela = acabamento(tela)
    out = f"public/assets/gear/{SLOT}_{n}.comum.webp"
    tela.save(out, "WEBP", quality=88, method=6)
    print(out, "item", im.size, "escala", round(s, 3))
