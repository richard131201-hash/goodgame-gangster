# ATENCAO: as ARMAS agora sao geradas por tools/recorta_armas.py (2 versoes por arma). Este script ficou so para icones (chapeu).
# Recorta imagens de arma/ícone enviadas com o "xadrez de transparente" gravado no JPG e salva em WebP com transparência.
# Uso: python -I tools/recorta_arte.py (os arquivos de origem ficam em Downloads; veja FILES). Ver R-ARTE-1.
import glob, os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

DL = r"C:\Users\Rodrigo Cipolli\Downloads"
OUT = r"C:\Users\Rodrigo Cipolli\Desktop\NewGame\public\assets"
os.makedirs(os.path.join(OUT, "weapons"), exist_ok=True)
os.makedirs(os.path.join(OUT, "icons"), exist_ok=True)

FILES = {
    "weapons/colt_1911": "Colt_M1911_caliber_weapon_art_*_2K.jpg",
    "weapons/pump_trench": "Generate_Winchester_1897_weapon_*_2K.jpg",
    "weapons/springfield_1903": "Springfield_M1903_with_telescopi*_2K.jpg",
    "weapons/tommy_gun": "tommy gun.jpg",
    "weapons/bar_1918": "Generate_BAR_M1918_weapon_*_2K.jpg",
    "icons/chapeu": "Generate_1930s_mafia_hat_icon_*_2K.jpg",
}


VAOS = {"weapons/colt_1911": [(1008, 1005, 88)]}  # vãos fechados (guarda-mato): x, y, raio na imagem original


def recorta(path, maxlado, vaos=()):
    a = np.array(Image.open(path).convert("RGB")).astype(np.int16)
    mx, mn = a.max(axis=2), a.min(axis=2)
    gray = a.mean(axis=2)
    # candidato a fundo: cinza (sem cor) entre o xadrez escuro e o brilho do halo
    cand = ((mx - mn) < 16) & (gray >= 38) & (gray <= 176)
    lab, n = ndi.label(cand)
    borda = np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))
    borda = borda[borda != 0]
    fundo = np.isin(lab, borda)
    objeto = ~fundo
    yy, xx = np.mgrid[0:objeto.shape[0], 0:objeto.shape[1]]
    # vãos fechados com brilho branco por dentro (guarda-mato): região clara cercada por contorno escuro
    clara = ((mx - mn) < 20) & (gray >= 225)
    lc, nc = ndi.label(clara)
    for i in range(1, nc + 1):
        comp = lc == i
        if comp.sum() < 250:
            continue
        preenchida = ndi.binary_fill_holes(comp)
        anel = ndi.binary_dilation(preenchida, iterations=5) & ~preenchida
        if anel.sum() and (gray[anel] < 75).mean() >= 0.55 and not (preenchida[0, :].any() or preenchida[-1, :].any() or preenchida[:, 0].any() or preenchida[:, -1].any()):
            objeto &= ~ndi.binary_dilation(preenchida, iterations=2)
            print("  vao removido", int(preenchida.sum()))
    for (cx, cy, r) in vaos:
        objeto &= ((xx - cx) ** 2 + (yy - cy) ** 2) > r * r
    # tira poeira: mantém só componentes grandes (o objeto; descarta rabiscos soltos)
    lab2, n2 = ndi.label(objeto)
    if n2 > 0:
        tam = ndi.sum(objeto, lab2, index=np.arange(1, n2 + 1))
        manter = [i + 1 for i, t in enumerate(tam) if t >= 0.25 * tam.max()]
        objeto = np.isin(lab2, manter)
    # preenche buracos pequenos do objeto (ruído), mas não os vãos grandes (guarda-mato)
    objeto = ndi.binary_closing(objeto, iterations=2)
    # borda suave: 1 px de erosão e leve desfoque
    objeto = ndi.binary_erosion(objeto, iterations=1)
    alfa = Image.fromarray((objeto * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))
    rgba = Image.open(path).convert("RGBA")
    rgba.putalpha(alfa)
    bbox = rgba.getbbox()
    pad = 6
    bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(rgba.width, bbox[2] + pad), min(rgba.height, bbox[3] + pad))
    rgba = rgba.crop(bbox)
    s = maxlado / max(rgba.size)
    if s < 1:
        rgba = rgba.resize((round(rgba.width * s), round(rgba.height * s)), Image.LANCZOS)
    return rgba


for destino, padrao in FILES.items():
    achados = glob.glob(os.path.join(DL, padrao))
    if not achados:
        print("NAO ACHEI", padrao)
        sys.exit(1)
    lado = 256 if destino.startswith("icons") else 640
    img = recorta(achados[0], lado, VAOS.get(destino, ()))
    caminho = os.path.join(OUT, destino + ".webp")
    img.save(caminho, "WEBP", quality=90, method=6)
    print(destino, img.size, os.path.getsize(caminho) // 1024, "KB")
