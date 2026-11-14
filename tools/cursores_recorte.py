# Cursores do jogo (arte da IA, fundo verde): tira o verde (vira transparência), engrossa o contorno vermelho, recorta,
# reduz os TRÊS com a MESMA escala (assim a seta e as mãos ficam do mesmo tamanho) e imprime o ponto do clique. (R-UI-20)
# Uso: python -I tools/cursores_recorte.py        Entrada: docs/arte/cursores/{seta,clicavel,segurando}.jpg   Saída: public/assets/cursors/*.png
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

S = 36          # lado do cursor (px)
ALTURA_MAO = 32 # altura da mão clicável (a maior das três) dentro dele; as outras seguem a mesma escala
GROSSURA = 36   # engrossa o contorno vermelho em px da imagem original (2000 px): cresce dos dois lados
ARQ = {"normal": "seta", "pointer": "clicavel", "grab": "segurando"}

recortes = {}
for nome, arq in ARQ.items():
    A = np.array(Image.open(f"docs/arte/cursores/{arq}.jpg").convert("RGB")).astype(float)
    r, g, b = A[..., 0], A[..., 1], A[..., 2]
    alpha = np.clip(1 - np.clip(g - np.maximum(r, b), 0, None) / 190.0, 0, 1)
    alpha[alpha > 0.97] = 1
    rgb = np.dstack([r, np.minimum(g, np.maximum(r, b) + 6), b])
    vermelho = (r > g + 50) & (r > b + 50)
    perto = ndi.distance_transform_edt(~vermelho) <= GROSSURA
    rgb[perto] = (140, 28, 28)
    alpha[perto] = 1
    ys, xs = np.where(alpha > 0.5)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    recortes[nome] = Image.fromarray(np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].astype(np.uint8), "RGBA")

k = ALTURA_MAO / recortes["pointer"].height      # escala única para os três
for nome, im in recortes.items():
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    tela = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ox, oy = (S - im.width) // 2, (S - im.height) // 2
    if nome == "normal": ox, oy = 1, 1
    if nome == "pointer": oy = 1
    tela.alpha_composite(im, (ox, oy))
    tela.save(f"public/assets/cursors/{nome}.png", optimize=True)
    yy, xx = np.where(np.array(tela)[..., 3] > 100)
    if nome == "normal":
        i = np.argmin(xx + yy); hot = (int(xx[i]), int(yy[i]))
    elif nome == "pointer":
        top = yy.min(); hot = (int(xx[yy <= top + 1].mean()), int(top))
    else:
        hot = (int(xx.mean()), int(yy.mean()))
    print(nome, tela.size, "desenho", im.size, "ponto do clique:", hot)
