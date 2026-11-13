# Prepara a folha de papel gerada por IA (R-UI-15): tira os 9 quadros de tinta desenhados pela IA
# (os lugares dos itens são desenhados em código, em 4:3) e salva o fundo da Ficha.
# Uso: python -I tools/folha_limpa.py     (origem: docs/arte/folha_original.jpg)
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.restoration import inpaint_biharmonic

SRC = "docs/arte/folha_original.jpg"
OUT = "public/assets/ficha/folha.webp"
im = Image.open(SRC).convert("RGB")
a = np.array(im)
g = a.astype(float).mean(axis=2)

# região onde a IA desenhou os quadros (em px da imagem 2000 x 1116)
x0, x1, y0, y1 = 770, 1890, 55, 610
sub_g = g[y0:y1, x0:x1]
mask = np.zeros(g.shape, bool)
mask[y0:y1, x0:x1] = sub_g < 125          # tinta escura (a mancha de café é bem mais clara)
mask = ndi.binary_dilation(mask, iterations=4)
print("pixels de tinta:", int(mask.sum()))

pad = 12
cy0, cy1, cx0, cx1 = y0 - pad, y1 + pad, x0 - pad, x1 + pad
crop = a[cy0:cy1, cx0:cx1].astype(float) / 255.0
m = mask[cy0:cy1, cx0:cx1]
out = inpaint_biharmonic(crop, m, channel_axis=-1)
res = a.copy()
res[cy0:cy1, cx0:cx1] = np.clip(out * 255, 0, 255).astype(np.uint8)
img = Image.fromarray(res)
img.save(OUT, "WEBP", quality=88, method=6)
img.save("docs/arte/folha_limpa.png")
print("ok", OUT)
