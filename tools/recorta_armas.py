# Recorta as armas (JPG com xadrez gravado) e gera 2 versoes por arma: "comum" (so borda preta) e "epico" (borda branca + brilho vermelho). Ver R-ARTE-2.
# Uso: python -I tools/recorta_armas.py (origens em Downloads, veja FILES).
import glob, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

DL = r"C:\Users\Rodrigo Cipolli\Downloads"
OUT = r"C:\Users\Rodrigo Cipolli\Desktop\NewGame\public\assets\weapons"
SCR = r"C:\Users\RODRIG~1\AppData\Local\Temp\claude\37a8dbadb3cd7dce\556b6cd3-17e8-4e3e-80f0-b99cdeda3170\scratchpad"
FILES = {
    "colt_1911": "Colt_M1911_caliber_weapon_art_*_2K.jpg",
    "pump_trench": "Generate_Winchester_1897_weapon_*_2K.jpg",
    "springfield_1903": "Springfield_M1903_with_telescopi*_2K.jpg",
    "tommy_gun": "tommy gun.jpg",
    "bar_1918": "Generate_BAR_M1918_weapon_*_2K.jpg",
}
VAOS = {"colt_1911": [(1008, 1005, 88)]}
LADO = 640
MARGEM = 0.075  # folga em volta para o brilho (igual nas duas versões, para a arma ter o mesmo tamanho)


def mascara_arma(path, vaos):
    """Devolve (rgb, mascara_interna): só a arma com o contorno preto dela, sem o adesivo branco nem o brilho."""
    im = Image.open(path).convert("RGB")
    a = np.array(im).astype(np.int16)
    mx, mn = a.max(axis=2), a.min(axis=2)
    gray = a.mean(axis=2)
    cand = ((mx - mn) < 16) & (gray >= 38) & (gray <= 176)
    lab, n = ndi.label(cand)
    borda = np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))
    borda = borda[borda != 0]
    fundo = np.isin(lab, borda)
    objeto = ~fundo
    yy, xx = np.mgrid[0:objeto.shape[0], 0:objeto.shape[1]]
    # vãos fechados com brilho branco (guarda-mato): região clara cercada por contorno escuro
    clara = ((mx - mn) < 20) & (gray >= 225)
    lc, nc = ndi.label(clara)
    for i in range(1, nc + 1):
        comp = lc == i
        if comp.sum() < 250:
            continue
        pre = ndi.binary_fill_holes(comp)
        anel = ndi.binary_dilation(pre, iterations=5) & ~pre
        if anel.sum() and (gray[anel] < 75).mean() >= 0.55 and not (pre[0, :].any() or pre[-1, :].any() or pre[:, 0].any() or pre[:, -1].any()):
            objeto &= ~ndi.binary_dilation(pre, iterations=2)
    for (cx, cy, r) in vaos:
        objeto &= ((xx - cx) ** 2 + (yy - cy) ** 2) > r * r
    lab2, n2 = ndi.label(objeto)
    tam = ndi.sum(objeto, lab2, index=np.arange(1, n2 + 1))
    objeto = np.isin(lab2, [i + 1 for i, t in enumerate(tam) if t >= 0.25 * tam.max()])
    objeto = ndi.binary_closing(objeto, iterations=2)

    # a arma é o que está DENTRO do contorno preto dela: pega o contorno (escuro e ligado) e preenche por dentro.
    # Assim o adesivo branco e o brilho de fora saem, e os detalhes claros por dentro (janela da culatra) ficam.
    escuro = objeto & (gray < 92)
    ld, nd = ndi.label(ndi.binary_closing(escuro, iterations=2))
    tamd = ndi.sum(escuro, ld, index=np.arange(1, nd + 1))
    d0 = ld == (1 + int(np.argmax(tamd)))
    preenchido = ndi.binary_fill_holes(ndi.binary_closing(d0, iterations=5))
    interno = objeto & preenchido
    # limpeza: poeira, buracos minúsculos e bordas serrilhadas
    interno = ndi.binary_opening(interno, iterations=1)
    lab3, n3 = ndi.label(interno)
    if n3:
        tam3 = ndi.sum(interno, lab3, index=np.arange(1, n3 + 1))
        interno = np.isin(lab3, [i + 1 for i, t in enumerate(tam3) if t >= 0.05 * tam3.max()])
    furos = ndi.binary_fill_holes(interno) & ~interno
    lf, nf = ndi.label(furos)
    for i in range(1, nf + 1):
        if (lf == i).sum() < 120:
            interno |= lf == i
    interno = ndi.binary_closing(interno, iterations=1)
    return im, interno


def camadas(rgb, interno, tipo):
    """Monta a imagem RGBA completa (na resolução da origem). tipo: 'comum' ou 'epico'."""
    d = ndi.distance_transform_edt(~interno)  # distância (px) até a arma
    h, w = interno.shape
    out = np.zeros((h, w, 4), dtype=np.float32)

    def sobre(cor, alfa):
        a = np.clip(alfa, 0, 1)[..., None]
        base_a = out[..., 3:4]
        novo_a = a + base_a * (1 - a)
        out[..., :3] = np.where(novo_a > 0, (np.array(cor, dtype=np.float32) * a + out[..., :3] * base_a * (1 - a)) / np.maximum(novo_a, 1e-6), 0)
        out[..., 3:4] = novo_a

    if tipo == "epico":
        borda_preta, branca, brilho = 6, 15, 95
        t = np.clip(1 - (d - (borda_preta + branca)) / brilho, 0, 1)
        sobre((255, 40, 30), (t ** 1.35) * 1.0)  # brilho vermelho (desfoque)
        sobre((255, 255, 255), (d <= borda_preta + branca).astype(np.float32))  # borda branca
        sobre((20, 14, 14), (d <= borda_preta).astype(np.float32))  # contorno preto fino
    else:
        sobre((20, 14, 14), (d <= 11).astype(np.float32))  # só a borda preta, grossa
    # a arma por cima (com a suavização da borda)
    suave = ndi.gaussian_filter(interno.astype(np.float32), 1.2)
    sobre(np.array(Image.fromarray(np.uint8(np.zeros((1, 1, 3)))))[0, 0] * 0, np.zeros_like(suave))  # no-op: mantém a ordem
    art = np.array(rgb).astype(np.float32)
    a = np.clip(suave * 1.15 - 0.075, 0, 1)[..., None]
    base_a = out[..., 3:4]
    novo_a = a + base_a * (1 - a)
    out[..., :3] = np.where(novo_a > 0, (art * a + out[..., :3] * base_a * (1 - a)) / np.maximum(novo_a, 1e-6), 0)
    out[..., 3:4] = novo_a
    return out


def salvar(out, caixa, nome):
    x0, y0, x1, y1 = caixa
    rec = out[y0:y1, x0:x1]
    img = Image.fromarray(np.uint8(np.clip(np.dstack([rec[..., :3], rec[..., 3] * 255]), 0, 255)), "RGBA")
    s = LADO / max(img.size)
    if s < 1:
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    caminho = os.path.join(OUT, nome + ".webp")
    img.save(caminho, "WEBP", quality=90, method=6)
    return img, os.path.getsize(caminho) // 1024


resultados = {}
for wid, padrao in FILES.items():
    achados = glob.glob(os.path.join(DL, padrao))
    if not achados:
        print("NAO ACHEI", padrao)
        sys.exit(1)
    rgb, interno = mascara_arma(achados[0], VAOS.get(wid, ()))
    ys, xs = np.where(interno)
    lado = max(xs.max() - xs.min(), ys.max() - ys.min())
    m = int(lado * MARGEM)
    h, w = interno.shape
    caixa = (max(0, xs.min() - m), max(0, ys.min() - m), min(w, xs.max() + m), min(h, ys.max() + m))
    for tipo in ("comum", "epico"):
        out = camadas(rgb, interno, tipo)
        img, kb = salvar(out, caixa, f"{wid}.{tipo}")
        resultados[(wid, tipo)] = img
        print(wid, tipo, img.size, kb, "KB")

# folha de conferência: comum e épico, sobre laranja (como o do antigo) e sobre o couro do jogo
ids = list(FILES)
W = 340
for nome, cor in (("laranja", (232, 122, 28)), ("couro", (41, 32, 26))):
    folha = Image.new("RGB", (W * len(ids), W * 2), cor)
    for i, wid in enumerate(ids):
        for j, tipo in enumerate(("comum", "epico")):
            im = resultados[(wid, tipo)].copy()
            im.thumbnail((W - 16, W - 16))
            folha.paste(im, (i * W + (W - im.width) // 2, j * W + (W - im.height) // 2), im)
    folha.save(os.path.join(SCR, f"armas_{nome}.png"))
print("ok")
