# Recorta os icones de recursos do topo (JPG com xadrez gravado): energia (bateria), ouro (barras), cash (macos de notas) e podio (ranking). Ver R-ARTE-3 e R-ARTE-4 (podio).
# O ouro, o cash e o podio ganham uma borda preta nova, fina e uniforme (a original era um rabisco grosso e irregular).
# Uso: python -I tools/recorta_recursos.py (origens em Downloads, veja FILES).
import glob, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

DL = r"C:\Users\Rodrigo Cipolli\Downloads"
OUT = r"C:\Users\Rodrigo Cipolli\Desktop\NewGame\public\assets\icons"
SCR = r"C:\Users\RODRIG~1\AppData\Local\Temp\claude\37a8dbadb3cd7dce\556b6cd3-17e8-4e3e-80f0-b99cdeda3170\scratchpad"
FILES = {
    "energia": "Creating_character_energy_icon_*_2K.jpg",
    "ouro": "Create_gold_bars_icon_*_2K.jpg",
    "cash": "Creating_money_icon_for_game_*_2K.jpg",
    "duelos": "Create_game_duels_icon_*_2K.jpg",
    "podio": "Create_minimalist_podium_icon_*_2K.jpg",
}
LADO = 256


def fundo_xadrez(a, furos=False):
    mx, mn = a.max(axis=2), a.min(axis=2)
    g = a.mean(axis=2)
    cinza = (mx - mn) < 12
    xad = cinza & (((g >= 22) & (g <= 52)) | ((g >= 80) & (g <= 104)))
    xad |= g < 6  # moldura preta do JPG do ouro
    xad = ndi.binary_closing(xad, iterations=1)
    lab, _ = ndi.label(xad)
    B = 24  # faixa de borda: o JPG tem uma moldura de alguns pixels
    borda = np.unique(np.concatenate([lab[:B, :].ravel(), lab[-B:, :].ravel(), lab[:, :B].ravel(), lab[:, -B:].ravel()]))
    fundo = np.isin(lab, borda[borda != 0])
    if furos:  # vaos fechados que sao so xadrez (ex.: dentro do guarda-mato das pistolas)
        tam = ndi.sum(xad, lab, index=np.arange(1, lab.max() + 1))
        for i, t in enumerate(tam, start=1):
            if t >= 3000:
                m = lab == i
                esc, cla = (g[m] < 60).mean(), (g[m] > 78).mean()
                cx = np.where(m)[1].mean() / m.shape[1]
                if esc > 0.25 and cla > 0.25 and abs(cx - 0.5) < 0.12:  # so o furo do centro (o guarda-mato)  # xadrez de verdade tem os dois tons; metal escuro tem um so
                    fundo |= m
    return fundo


def maior_bloco(m):
    lab, n = ndi.label(m)
    tam = ndi.sum(m, lab, index=np.arange(1, n + 1))
    return np.isin(lab, [i + 1 for i, t in enumerate(tam) if t >= 0.02 * tam.max()])


def borda_nova(img, a, fundo, corte=75):
    """Mantem so o miolo dourado (sem o rabisco preto) e desenha uma borda preta fina e uniforme."""
    mx = a.max(axis=2)
    escuro = mx < corte
    miolo = ~fundo & ~escuro
    miolo = ndi.binary_closing(miolo, iterations=6)
    miolo = ndi.binary_fill_holes(miolo)
    miolo = maior_bloco(ndi.binary_opening(miolo, iterations=3))
    dist = ndi.distance_transform_edt(~miolo)
    larg = 9.0  # pixels em 2048; vira cerca de 1 px no icone
    anel = np.clip(larg + 0.5 - dist, 0, 1)  # 1 dentro do anel, suave na ponta
    corpo = np.array(Image.fromarray((miolo * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))) / 255.0
    alfa = np.maximum(corpo, anel)
    rgb = np.array(img).astype(float)
    k = corpo[..., None]
    rgb = rgb * k  # fora do miolo fica preto (a borda)
    return rgb, alfa


for nome, padrao in FILES.items():
    arq = glob.glob(os.path.join(DL, padrao))[0]
    img = Image.open(arq).convert("RGB")
    a = np.array(img).astype(np.int16)
    fundo = fundo_xadrez(a, furos=(nome == "duelos"))
    if nome in ("ouro", "cash", "podio"):
        rgb, alfa = borda_nova(img, a, fundo, 75 if nome == "ouro" else 58 if nome == "cash" else 40)
        rgba = np.dstack([rgb, alfa * 255])
    else:
        objeto = maior_bloco(~fundo)
        objeto = ndi.binary_erosion(ndi.binary_opening(objeto, iterations=1), iterations=1)
        alfa = np.array(Image.fromarray((objeto * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))).astype(float)
        rgba = np.dstack([np.array(img).astype(float), alfa])
    im = Image.fromarray(np.uint8(np.clip(rgba, 0, 255)), "RGBA")
    bb = im.getbbox()
    pad = 8
    im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))
    lado = max(im.size)
    quad = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    quad.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2))
    quad = quad.resize((LADO, LADO), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    caminho = os.path.join(OUT, nome + ".webp")
    quad.save(caminho, "WEBP", quality=90, method=6)
    print(nome, quad.size, os.path.getsize(caminho) // 1024, "KB")
    folha = Image.new("RGB", (3 * 300, 300))
    for j, cor in enumerate([(41, 32, 26), (232, 218, 180), (20, 20, 20)]):
        f = Image.new("RGB", (300, 300), cor)
        f.paste(quad, (22, 22), quad)
        folha.paste(f, (j * 300, 0))
    folha.save(os.path.join(SCR, "rec_" + nome + ".png"))
