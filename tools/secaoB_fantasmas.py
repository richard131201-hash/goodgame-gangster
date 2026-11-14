# Folha do Equipamento: os 8 desenhos-fantasma (chapéu, colete, calça...) saem da folha e viram 8 sprites. Assim o item equipado
# entra no slot SEM fundo (nada de retalho bege): o slot vazio mostra o fantasma, o slot cheio mostra só o item. (R-UI-17, R-ARTE-6)
# Uso: python -I tools/secaoB_fantasmas.py        Entrada: docs/arte/secaoB/b-equipamento_com_fantasmas.webp
# Saída: public/assets/ficha/b-equipamento.webp (sem fantasmas) e public/assets/ficha/b-fantasma-<slot>.webp
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.restoration import inpaint_biharmonic

SLOTS = ["chapeu", "peitoral", "calca", "calcado", "amuleto", "pet", "relicia", "veiculo"]
im = Image.open("docs/arte/secaoB/b-equipamento_com_fantasmas.webp").convert("RGBA")
A = np.array(im).astype(float)
rgb, alp = A[..., :3], A[..., 3]
H, W = alp.shape
L = rgb.mean(axis=2)

# molduras (tinta escura)
ink = ndi.binary_closing(L < 95, iterations=6)
lab, n = ndi.label(ink)
boxes = []
for s in ndi.find_objects(lab):
    bh, bw = s[0].stop - s[0].start, s[1].stop - s[1].start
    if 250 < bw < 600 and bh > 200:
        boxes.append((s[1].start, s[0].start, s[1].stop, s[0].stop))
boxes.sort(key=lambda b: (round(b[1] / 300), b[0]))
assert len(boxes) == 8, len(boxes)

# células do CSS (em px da folha): grade em left 2,5% right 2,25% top 15,2% bottom 3,8%; colunas iguais; linhas 39,3fr 37,8fr
gl, gr, gt, gb = 0.025 * W, 0.0225 * W, 0.152 * H, 0.038 * H
gw, gh = W - gl - gr, H - gt - gb
cg, rg = 0.0235 * gw, 0.039 * gh
cw = (gw - 3 * cg) / 4
rh1 = (gh - rg) * 39.3 / 77.1
rh2 = (gh - rg) * 37.8 / 77.1
cells = []
for r_, rh, top in ((0, rh1, gt), (1, rh2, gt + rh1 + rg)):
    for c in range(4):
        cells.append((gl + c * (cw + cg), top, cw, rh))

clean = rgb.copy()
grain_band = rgb[40:120, 100:1900]          # faixa de papel liso acima das molduras: mede o grão do papel
GRAIN = float((grain_band - ndi.gaussian_filter(grain_band, (8, 8, 0))).std())
rng = np.random.default_rng(7)
for i, (bx0, by0, bx1, by1) in enumerate(boxes):
    M = 34                                   # fica longe da tinta da moldura
    x0, y0, x1, y1 = bx0 + M, by0 + M, bx1 - M, by1 - M
    sub = rgb[y0:y1, x0:x1]
    Ls = sub.mean(axis=2)
    tone = np.median(Ls)
    d = tone - Ls
    # o fantasma é a tinta fraca: o que está bem mais escuro que o papel perto dele
    est = ndi.gaussian_filter(Ls, 40)
    d = est - Ls
    mask = ndi.binary_opening(d > 9, iterations=1)
    lab2, n2 = ndi.label(ndi.binary_dilation(mask, iterations=14))
    sizes = ndi.sum(mask, lab2, range(1, n2 + 1))
    keep = lab2 == (1 + int(np.argmax(sizes)))
    mask = mask & keep
    yy, xx = np.where(mask)
    ya, yb, xa, xb = yy.min() - 8, yy.max() + 9, xx.min() - 8, xx.max() + 9
    inkc = np.array([0.50, 0.40, 0.32]) * 255
    papel = est
    a_ = np.clip(d / (papel - 105), 0, 1)
    a_[~ndi.binary_dilation(mask, iterations=3)] = 0
    a_[a_ < 0.04] = 0
    sp = np.dstack([np.broadcast_to(inkc, a_.shape + (3,)), a_ * 255])[ya:yb, xa:xb].astype(np.uint8)
    Image.fromarray(sp, "RGBA").save(f"public/assets/ficha/b-fantasma-{SLOTS[i]}.webp", "WEBP", quality=92, method=6)
    # posição do sprite dentro da célula do CSS, em % (tamanho em % da célula; posição pela regra do background-position)
    sx, sy, sw, sh = x0 + xa, y0 + ya, xb - xa, yb - ya
    cx, cy, cwid, chei = cells[i]
    pw, ph = sw / cwid * 100, sh / chei * 100
    px_ = (sx - cx) / (cwid - sw) * 100
    py_ = (sy - cy) / (chei - sh) * 100
    print(f"{SLOTS[i]}: background-position {px_:.2f}% {py_:.2f}% / {pw:.2f}% {ph:.2f}%")
    # apaga o fantasma da folha: preenche com o papel interpolado e devolve o grão
    reg = (slice(y0 + ya - 20, y0 + yb + 20), slice(x0 + xa - 20, x0 + xb + 20))
    box = clean[reg] / 255.0
    K = 6
    small = np.array(Image.fromarray((box * 255).astype(np.uint8)).resize((box.shape[1] // K, box.shape[0] // K), Image.BILINEAR)).astype(float) / 255.0
    mk = np.zeros(small.shape[:2], bool)
    mk[3:-3, 3:-3] = True
    fillsm = inpaint_biharmonic(small, mk, channel_axis=-1)
    fill = np.array(Image.fromarray((np.clip(fillsm, 0, 1) * 255).astype(np.uint8)).resize((box.shape[1], box.shape[0]), Image.BICUBIC)).astype(float)
    hh, ww = box.shape[:2]
    grain = ndi.gaussian_filter(rng.normal(0, 1, (hh, ww, 1)), (1.2, 1.2, 0)) * GRAIN * 2.2   # grão suave com a mesma força do papel
    patch = np.clip(fill + grain, 0, 255)
    ry = np.minimum(np.arange(hh), hh - 1 - np.arange(hh)) / 20.0
    rx = np.minimum(np.arange(ww), ww - 1 - np.arange(ww)) / 20.0
    wgt = np.clip(np.minimum(ry[:, None], rx[None, :]), 0, 1)[..., None]
    clean[reg] = patch * wgt + clean[reg] * (1 - wgt)

out = np.dstack([np.clip(clean, 0, 255).astype(np.uint8), alp.astype(np.uint8)])
Image.fromarray(out, "RGBA").save("public/assets/ficha/b-equipamento.webp", "WEBP", quality=90, method=6)
bg = Image.new("RGBA", (W, H), (20, 20, 31, 255))
bg.alpha_composite(Image.fromarray(out, "RGBA"))
bg.convert("RGB").save("docs/arte/secaoB/sem_fantasmas.png")
print("ok")
