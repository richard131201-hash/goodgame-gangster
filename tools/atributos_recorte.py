# Cartão de atributos (arte da IA, folha da Arma com 4 faixas e 4 caixas): corta a folha, iguala os 4 espaços entre as 5 linhas
# horizontais (a IA errou por até 4 px), tira o fundo azul-marinho (vira transparência) e mede linhas e caixas. (R-UI-22)
# Uso: python -I tools/atributos_recorte.py        Entrada: docs/arte/atributos/original.jpg   Saída: public/assets/ficha/a-cartao.webp
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

A = np.array(Image.open("docs/arte/atributos/original.jpg").convert("RGB")).astype(float)
L = A.mean(axis=2)
paper = ndi.binary_fill_holes(ndi.binary_opening(L[:735] > 70, iterations=2))
lab, n = ndi.label(paper)
paper = lab == (1 + int(np.argmax(ndi.sum(paper, lab, range(1, n + 1)))))
ys, xs = np.where(paper)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
img = A[y0:y1, x0:x1]
pap = paper[y0:y1, x0:x1].astype(float)
CUT_A, CUT_B, FEATHER = 600, 913, 24   # faixa de papel liso (entre o nome e os botões) que sai: a folha fica menos comprida
f = np.linspace(0, 1, FEATHER)
def splice_x(a):
    ra = f[None, :] if a.ndim == 2 else f[None, :, None]
    blend = a[:, CUT_A - FEATHER:CUT_A] * (1 - ra) + a[:, CUT_B:CUT_B + FEATHER] * ra
    return np.concatenate([a[:, :CUT_A - FEATHER], blend, a[:, CUT_B + FEATHER:]], axis=1)
H, W = img.shape[:2]

# linhas horizontais (moldura de cima, 3 divisórias, moldura de baixo), medidas no meio da folha
prof = (200 - img.mean(axis=2)[:, 300:1500]).clip(0).mean(axis=1)
src = []
for lo, hi in ((30, 60), (120, 150), (215, 245), (310, 340), (400, 430)):
    seg = prof[lo:hi]
    ws = np.maximum(seg - seg.max() * 0.4, 0)
    src.append(lo + float((ws * np.arange(len(seg))).sum() / ws.sum()) + 0.5)
gap = (src[-1] - src[0]) / 4
dst = [src[0] + gap * k for k in range(5)]
print("linhas antes :", [round(v, 1) for v in src], "espacos", [round(src[i + 1] - src[i], 1) for i in range(4)])
print("linhas depois:", [round(v, 1) for v in dst], "espaco", round(gap, 2))

# remapeia só na vertical: cada faixa entre linhas é esticada/encolhida para o espaço igual
yo = np.arange(H, dtype=float)
xp = [0.0] + dst + [H - 1.0]
fp = [0.0] + src + [H - 1.0]
ysrc = np.interp(yo, xp, fp)
def remap(a):
    out = np.empty_like(a)
    i0 = np.clip(np.floor(ysrc).astype(int), 0, H - 2)
    t = (ysrc - i0)[:, None] if a.ndim == 2 else (ysrc - i0)[:, None, None]
    return a[i0] * (1 - t) + a[i0 + 1] * t
img2 = splice_x(remap(img))
pap2 = splice_x(remap(pap))
W = img2.shape[1]

# tira as duas linhas verticais de moldura (esquerda e direita), só entre a linha de cima e a de baixo; ficam as linhas de cima e de baixo
SIDE_R = 11                   # meia largura apagada, em px
GAP = 16                      # de onde vem o papel que preenche (px ao lado)
ytop, ybot = int(round(dst[0])) - 14, int(round(dst[4])) + 14   # as linhas de cima e de baixo não chegam a estas colunas
Lcol = (200 - img2.mean(axis=2)[ytop + 21:ybot - 21, :]).clip(0).mean(axis=0)
left_x = 20 + int(np.argmax(Lcol[20:100]))
right_x = W - 100 + int(np.argmax(Lcol[W - 100:W - 20]))
for cx, sgn in ((left_x, 1), (right_x, -1)):
    xa, xb = cx - SIDE_R, cx + SIDE_R + 1
    src_cols = img2[ytop:ybot, xa + sgn * GAP:xb + sgn * GAP]
    ramp = np.minimum(np.minimum(np.arange(xb - xa), np.arange(xb - xa)[::-1]) / 3.0, 1)[None, :, None]
    img2[ytop:ybot, xa:xb] = src_cols * ramp + img2[ytop:ybot, xa:xb] * (1 - ramp)
# pontinhas soltas das linhas de cima e de baixo, depois do fim delas (à direita): somem também
for yy in (dst[0], dst[4]):
    ya, yb = int(round(yy)) - 6, int(round(yy)) + 7
    xa2 = int(W * 0.9505)
    img2[ya:yb, xa2:W - 24] = img2[ya - 16:yb - 16, xa2:W - 24] if yy == dst[4] else img2[ya + 16:yb + 16, xa2:W - 24]
print("linhas laterais apagadas em x =", left_x, right_x, "de", W)
alpha = np.clip(ndi.gaussian_filter(ndi.binary_erosion(pap2 > 0.5, iterations=1).astype(float), 0.8), 0, 1)
rgba = np.dstack([np.clip(img2, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save("public/assets/ficha/a-cartao.webp", "WEBP", quality=90, method=6)
Image.fromarray(np.clip(img2, 0, 255).astype(np.uint8)).save("docs/arte/atributos/ajustada.png")
print("folha", W, H, "proporção", round(W / H, 3))

# medidas (em % da folha): linhas e caixas
Lc = img2.mean(axis=2)
print("linhas y%:", [round(v / H * 100, 2) for v in dst])
colp = (200 - Lc[60:-60, :]).clip(0).mean(axis=0)
print("colunas escuras x%:", [round(i / W * 100, 2) for i in range(2, W - 2) if colp[i] > 40 and colp[i] >= colp[i - 2] and colp[i] >= colp[i + 2]])
bx = (200 - Lc[:, 1700 - (CUT_B - CUT_A):1710 - (CUT_B - CUT_A)]).clip(0).mean(axis=1)
runs = [i for i in range(H) if bx[i] > 40]
print("caixas (varredura x=1700-1710) y%:", [round(i / H * 100, 2) for i in runs][:40])

# onde as 3 divisórias e as linhas de cima/baixo começam e terminam (em % da folha)
Lc2 = img2.mean(axis=2)
for name, yy in zip(("cima", "div1", "div2", "div3", "baixo"), dst):
    row = (200 - Lc2[int(round(yy)) - 2:int(round(yy)) + 3, :]).clip(0).mean(axis=0)
    xs_ = np.where(row[40:W - 40] > 60)[0] + 40
    print(name, "linha de x%.2f%% a x%.2f%%" % (xs_.min() / W * 100, xs_.max() / W * 100))
