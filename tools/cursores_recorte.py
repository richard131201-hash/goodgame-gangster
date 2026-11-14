# Cursores do jogo (arte da IA, fundo verde): tira o verde (vira transparência), recorta, reduz para 40 px e imprime o ponto do clique. (R-UI-20)
# Uso: python -I tools/cursores_recorte.py        Entrada: docs/arte/cursores/{seta,clicavel,segurando}.jpg   Saída: public/assets/cursors/*.png
import numpy as np
from PIL import Image

S = 40
ARQ = {"normal": "seta", "pointer": "clicavel", "grab": "segurando"}
for nome, arq in ARQ.items():
    A = np.array(Image.open(f"docs/arte/cursores/{arq}.jpg").convert("RGB")).astype(float)
    r, g, b = A[..., 0], A[..., 1], A[..., 2]
    verde = np.clip(g - np.maximum(r, b), 0, None)
    alpha = np.clip(1 - verde / 190.0, 0, 1)
    alpha[alpha > 0.97] = 1
    g2 = np.minimum(g, np.maximum(r, b) + 6)            # tira o respingo verde das bordas
    rgb = np.dstack([r, g2, b])
    ys, xs = np.where(alpha > 0.5)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    k = (S - 2) / max(im.size)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    tela = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ox, oy = (S - im.width) // 2, (S - im.height) // 2
    if nome == "normal": ox, oy = 1, 1                   # seta encostada no canto: a ponta fica perto de (1,1)
    if nome == "pointer": oy = 1
    tela.alpha_composite(im, (ox, oy))
    tela.save(f"public/assets/cursors/{nome}.png", optimize=True)
    m = np.array(tela)[..., 3] > 100
    yy, xx = np.where(m)
    if nome == "normal":
        i = np.argmin(xx + yy); hot = (xx[i], yy[i])
    elif nome == "pointer":
        top = yy.min(); hot = (int(xx[yy <= top + 1].mean()), top)
    else:
        hot = (int(xx.mean()), int(yy.mean()))
    print(nome, tela.size, "ponto do clique:", hot)
