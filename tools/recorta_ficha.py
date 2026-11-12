# Recorta a imagem do ícone Ficha (JPG com xadrez gravado, tons 25 e 88) e salva em WebP com transparência. Ver R-ARTE-1.
import glob, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

DL = r"C:\Users\Rodrigo Cipolli\Downloads"
OUT = r"C:\Users\Rodrigo Cipolli\Desktop\NewGame\public\assets\icons"
arq = glob.glob(os.path.join(DL, "Resizing_paper_into_square_shape_*_2K.jpg"))[0]
img = Image.open(arq).convert("RGB")
a = np.array(img).astype(np.int16)
mx, mn = a.max(axis=2), a.min(axis=2)
g = a.mean(axis=2)

# xadrez: dois tons de cinza (25 e 88), sem cor; tolerância pequena para não comer o metal do clipe
xad = ((mx - mn) < 14) & ((np.abs(g - 25) <= 10) | (np.abs(g - 88) <= 10))
xad = ndi.binary_closing(xad, iterations=1)
lab, n = ndi.label(xad)
borda = np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))
borda = borda[borda != 0]
fundo = np.isin(lab, borda)
# vãos fechados que são só xadrez (dentro do clipe)
for i in range(1, n + 1):
    if i in set(borda.tolist()):
        continue
    m = lab == i
    if m.sum() >= 300:
        fundo |= m
objeto = ~fundo
# só o maior bloco (papel + clipe); tira poeira
lab2, n2 = ndi.label(objeto)
tam = ndi.sum(objeto, lab2, index=np.arange(1, n2 + 1))
manter = [i + 1 for i, t in enumerate(tam) if t >= 0.02 * tam.max()]
objeto = np.isin(lab2, manter)
objeto = ndi.binary_opening(objeto, iterations=1)
objeto = ndi.binary_erosion(objeto, iterations=1)
alfa = Image.fromarray((objeto * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
rgba = img.convert("RGBA")
rgba.putalpha(alfa)
bb = rgba.getbbox()
pad = 6
rgba = rgba.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(rgba.width, bb[2] + pad), min(rgba.height, bb[3] + pad)))
print("recorte", rgba.size)
s = 256 / max(rgba.size)
if s < 1:
    rgba = rgba.resize((round(rgba.width * s), round(rgba.height * s)), Image.LANCZOS)
os.makedirs(OUT, exist_ok=True)
rgba.save(os.path.join(OUT, "ficha.webp"), "WEBP", quality=90, method=6)
print("ficha", rgba.size, os.path.getsize(os.path.join(OUT, "ficha.webp")) // 1024, "KB")
for j, cor in enumerate([(41, 32, 26), (232, 218, 180), (58, 36, 24)]):
    f = Image.new("RGB", (300, 300), cor)
    f.paste(rgba, ((300 - rgba.width) // 2, (300 - rgba.height) // 2), rgba)
    f.save(rf"C:\Users\RODRIG~1\AppData\Local\Temp\claude\37a8dbadb3cd7dce\556b6cd3-17e8-4e3e-80f0-b99cdeda3170\scratchpad\ficha{j}.png")
