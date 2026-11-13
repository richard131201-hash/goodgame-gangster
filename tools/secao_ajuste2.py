# Ajuste da seção A (segunda imagem do fundador): sobe o retrato em relação ao cartão de atributos e arredonda a base do cartão.
# Uso: python -I tools/secao_ajuste2.py [deslocamento_px]
# Entrada: docs/arte/secaoA/original2.jpg    Saída: docs/arte/secaoA/ajustada.png
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import color

D = int(sys.argv[1]) if len(sys.argv) > 1 else 72     # quanto o cartão desce em relação ao retrato
R = 20                                                # raio dos cantos do cartão
src = Image.open("docs/arte/secaoA/original2.jpg").convert("RGB")
im = np.array(src).astype(float) / 255.0
H, W, _ = im.shape
L = im.mean(axis=2) * 255
lab = color.rgb2lab(im)
navy = im[5, 1000].copy()

CX0, CX1, CY0 = 57, 1317, 682          # cartão (x0, x1, y0) na imagem original
CY1 = 1106                              # base nova do cartão (a original sai da imagem: era "infinita")

# 1) cartão limpo: refaz a faixa de cima que o retrato cobria (e a sombra dele) copiando um trecho liso do próprio cartão
card = im[CY0:CY1, CX0:CX1].copy()
y_fix = 772 - CY0
tile = im[CY0:CY0 + y_fix, 705:1105].copy()
x_a, x_b = 105 - CX0, 668 - CX0
w = x_b - x_a
reps = int(np.ceil(w / tile.shape[1]))
fill = np.tile(tile, (1, reps, 1))[:, :w]
ramp = np.clip(np.arange(w) / 16.0, 0, 1)[None, :, None]            # mistura suave na costura da esquerda
card[:y_fix, x_a:x_b] = fill * ramp + card[:y_fix, x_a:x_b] * (1 - ramp)

# 2) máscara do cartão: retângulo com cantos arredondados (a base agora fecha)
ch, cw = card.shape[:2]
yy, xx = np.mgrid[0:ch, 0:cw]
inside = np.ones((ch, cw), bool)
for cy, cx in ((R, R), (R, cw - 1 - R), (ch - 1 - R, R), (ch - 1 - R, cw - 1 - R)):
    corner = ((yy < R) if cy == R else (yy > ch - 1 - R)) & ((xx < R) if cx == R else (xx > cw - 1 - R))
    inside &= ~(corner & ((yy - cy) ** 2 + (xx - cx) ** 2 > R * R))
alpha_card = ndi.gaussian_filter(inside.astype(float), 0.9)

# 3) retrato: a parte dele que desce sobre o cartão (2 folhas empilhadas) é um polígono inclinado, medido na imagem
from PIL import ImageDraw
poly = [(108, 674), (656, 674), (655, 681), (634, 686), (630, 697), (400, 708), (340, 735), (250, 741), (145, 743), (121, 730), (113, 712)]
big = Image.new("L", (W * 4, H * 4), 0)
ImageDraw.Draw(big).polygon([(x * 4, y * 4) for x, y in poly], fill=255)
Pa = np.array(big.resize((W, H), Image.LANCZOS)).astype(float) / 255.0   # alfa suave
P = Pa > 0.5

# 4) monta numa tela maior: fundo, retrato/nota/placa/arma como estão, cartão deslocado
out = np.zeros((H + D, W, 3))
out[:] = navy
out[:H] = im
rm = np.zeros((H, W), bool)
rm[CY0 - 8:, CX0 - 6:CX1 + 6] = True          # região do cartão original (e sua sombra) sai
rm &= ~P
out[:H][rm] = navy
# sombra suave embaixo do cartão
sh = np.zeros((H + D, W))
sh[CY0 + D:CY1 + D, CX0:CX1] = inside.astype(float) * 0 + 1
sh = ndi.shift(sh, (7, 0), order=0)
sh = ndi.gaussian_filter(sh, 9) * 0.35
out = out * (1 - sh[..., None]) + np.array([0, 0, 0]) * sh[..., None]
# cartão
sl = (slice(CY0 + D, CY1 + D), slice(CX0, CX1))
a = alpha_card[..., None]
out[sl] = card * a + out[sl] * (1 - a)
# sombra suave do retrato caindo sobre o cartão
psh = np.zeros((H + D, W)); psh[:H] = Pa
psh = ndi.shift(psh, (10, 5), order=1)
psh = ndi.gaussian_filter(psh, 9) * 0.45
psh[:CY0 + D - 1] = 0
out = out * (1 - psh[..., None])
# retrato por cima (com borda suave)
orig = np.pad(im, ((0, D), (0, 0), (0, 0)), constant_values=0)
pa = np.zeros((H + D, W)); pa[:H] = Pa
out = out * (1 - pa[..., None]) + orig * pa[..., None]

Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save("docs/arte/secaoA/ajustada.png")
print("ok", out.shape)
