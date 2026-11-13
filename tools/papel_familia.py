"""Protótipos do papel do nome COM nome da família (5 opções), em escala real do jogo.
Uso: python tools/papel_familia.py  ->  docs/arte/papel_familia_prototipos.png
1 rem = R px. Papel do jogo = 16,2 x 6,5 rem; card = 13,8 x 16 rem, 11,6 rem à esquerda e 7,4 rem acima do papel.
"""
import math
from PIL import Image, ImageDraw, ImageFont

S = 2
R = 17
W, H = 1640, 1330
img = Image.new("RGB", (W * S, H * S), "#2b1d12")
d = ImageDraw.Draw(img)
GOLD, GOLD_D, INK, INK2 = "#d4af37", "#7a5c12", "#2b1d05", "#5b4524"
P1, P2 = "#cdb98c", "#b9a276"


def font(sz, bold=False, serif=False):
    if serif:
        names = ["georgiab.ttf", "timesbd.ttf"] if bold else ["georgiai.ttf", "georgia.ttf"]
    else:
        names = ["arialbd.ttf"] if bold else ["arial.ttf"]
    for n in names:
        try:
            return ImageFont.truetype(n, int(sz * S))
        except OSError:
            pass
    return ImageFont.load_default()


def txt(x, y, s, sz, fill="#e8dcc0", bold=False, anchor="la", serif=False):
    d.text((x * S, y * S), s, font=font(sz, bold, serif), fill=fill, anchor=anchor)


def circle(cx, cy, r, **kw):
    d.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], **kw)


def seal(cx, cy, r, num):
    pts = []
    for i in range(16 * 6):
        t = 2 * math.pi * i / (16 * 6)
        rr = r * 0.91 + r * 0.065 * math.cos(16 * t)
        pts.append(((cx + rr * math.sin(t)) * S, (cy - rr * math.cos(t)) * S))
    d.polygon(pts, fill=GOLD, outline=GOLD_D, width=int(1.4 * S))
    circle(cx, cy, r * 0.71, outline=GOLD_D, width=int(1.2 * S))
    txt(cx, cy + r * 0.04, str(num), r * 0.72, INK, True, "mm")


def shield(cx, cy, s, fill=INK2):
    pts = [(cx - s * .5, cy - s * .55), (cx + s * .5, cy - s * .55), (cx + s * .5, cy), (cx, cy + s * .6), (cx - s * .5, cy)]
    d.polygon([(a * S, b * S) for a, b in pts], fill=fill)


def bar(x, y, w, h, pct, label, overlap):
    d.rounded_rectangle([x * S, y * S, (x + w) * S, (y + h) * S], radius=h * 0.28 * S, fill="#7d6c4c", outline="#3d2f1d", width=int(1.2 * S))
    fx = x + 2 + overlap
    d.rounded_rectangle([fx * S, (y + 2) * S, (fx + (w - 4 - overlap) * pct) * S, (y + h - 2) * S], radius=max(h * 0.28 - 2, 1) * S, fill="#3fcf7a")
    txt(x + w / 2 + overlap / 2, y + h / 2, label, h * 0.6, "#1f1608", True, "mm")


def scene(ox, oy, ph_rem=6.5, name_rem=0.5, bar_rem=None, deco=None):
    """ox,oy = canto do papel (px). Devolve helpers em rem relativos ao papel."""
    pw = 16.2 * R
    ph = ph_rem * R
    # card do personagem (atrás do papel)
    cx, cy = ox - 11.6 * R, oy - 7.4 * R
    d.rounded_rectangle([cx * S, cy * S, (cx + 13.8 * R) * S, (cy + 16 * R) * S], radius=0.6 * R * S, fill="#14202c", outline=GOLD, width=int(2 * S))
    circle(cx + 6.9 * R, cy + 6 * R, 2.8 * R, fill="#3a4a5a")
    d.rectangle([(cx + 2.4 * R) * S, (cy + 10 * R) * S, (cx + 11.4 * R) * S, (cy + 16 * R) * S], fill="#3a4a5a")
    # papel
    d.rectangle([ox * S, oy * S, (ox + pw) * S, (oy + ph) * S], fill=P1)
    d.rectangle([ox * S, (oy + ph / 2) * S, (ox + pw) * S, (oy + ph) * S], fill=P2)
    d.rectangle([ox * S, (oy + ph) * S, (ox + pw) * S, (oy + ph + 3) * S], fill="#1c130b")
    if deco:
        deco(ox, oy, pw, ph)
    tx = ox + 3.2 * R
    by = oy + (bar_rem if bar_rem is not None else ph_rem - 1.25 - 0.75) * R
    bar(tx - 0.9 * R, by, pw - 3.2 * R - 1 * R + 0.9 * R, 1.25 * R, 0.24, "603 / 2520 XP", 0.9 * R)
    seal(tx - 0.9 * R + 1.35 * R, by + 0.625 * R, 1.35 * R, 16)
    return tx, oy + name_rem * R, pw, ph


def label(x, y, t, sub):
    txt(x, y, t, 17, "#e8dcc0", True)
    txt(x, y + 24, sub, 13, "#bfae8a")


txt(40, 28, "MOBSTER RISE - Nome da família no papel (5 opções, escala real do jogo)", 26, GOLD, True)
txt(40, 66, "A família só aparece se o jogador tiver uma; sem família o papel fica como hoje (referência no fim). Nome de exemplo: Corleone / Irmandade da Navalha.", 14, "#bfae8a")

OXs = [14.5 * R + 40, 14.5 * R + 40 + 790]
OYs = [8.8 * R + 105, 8.8 * R + 105 + 410, 8.8 * R + 105 + 820]
LBL = 8.6 * R + 18

# 1: linha miúda sob o nome (papel igual)
x, y = OXs[0], OYs[0]
tx, ny, pw, ph = scene(x, y, 6.5, 0.45, bar_rem=4.1)
txt(tx, ny, "Chacal", 1.5 * R, INK, True, "la", True)
shield(tx + 0.45 * R, ny + 2.05 * R, 0.8 * R)
txt(tx + 1.05 * R, ny + 1.62 * R, "FAMÍLIA CORLEONE", 0.8 * R, INK2, True)
label(x - 11.6 * R, y + LBL, "1  Linha miúda sob o nome", "Papel do mesmo tamanho de hoje; escudinho + 'FAMÍLIA CORLEONE' em letra pequena.")

# 2: etiqueta ao lado do nome
x, y = OXs[1], OYs[0]
tx, ny, pw, ph = scene(x, y, 6.5, 0.95)
txt(tx, ny, "Chacal", 1.5 * R, INK, True, "la", True)
ex = tx + 5.6 * R
d.rounded_rectangle([ex * S, (ny + 0.35 * R) * S, (ex + 5.6 * R) * S, (ny + 1.5 * R) * S], radius=0.2 * R * S, fill=INK2)
txt(ex + 2.8 * R, ny + 0.92 * R, "CORLEONE", 0.78 * R, "#f1e3bd", True, "mm")
label(x - 11.6 * R, y + LBL, "2  Etiqueta ao lado do nome", "Como era a classe: etiqueta escura. Nome de família longo precisa ser cortado ('Irmandade da Na...').")

# 3: aba no topo do papel
x, y = OXs[0], OYs[1]
def aba(ox, oy, pw, ph):
    d.rectangle([(ox + 1.2 * R) * S, (oy - 1.5 * R) * S, (ox + 10.2 * R) * S, oy * S], fill=INK2)
    txt(ox + 5.7 * R, oy - 0.75 * R, "FAMÍLIA CORLEONE", 0.8 * R, "#f1e3bd", True, "mm")
tx, ny, pw, ph = scene(x, y, 6.5, 0.95, deco=aba)
txt(tx, ny, "Chacal", 1.5 * R, INK, True, "la", True)
label(x - 11.6 * R, y + LBL, "3  Aba colada no topo do papel", "A família vira uma abinha de pasta em cima do papel. O papel não cresce; a aba pode ficar sobre o card.")

# 4: papel mais alto, linha própria com escudo
x, y = OXs[1], OYs[1]
tx, ny, pw, ph = scene(x, y, 8, 0.6, bar_rem=5.9)
txt(tx, ny, "Chacal", 1.5 * R, INK, True, "la", True)
d.line([tx * S, (ny + 2.3 * R) * S, (x + pw - 1 * R) * S, (ny + 2.3 * R) * S], fill="#8f7a52", width=int(1 * S))
shield(tx + 0.55 * R, ny + 3.4 * R, 1.0 * R)
txt(tx + 1.4 * R, ny + 2.8 * R, "Irmandade da Navalha", 0.9 * R, "#3b2c14", True, "la", True)
label(x - 11.6 * R, y + LBL, "4  Linha própria com escudo (papel 1,5 rem mais alto)", "Cabe nome de família longo inteiro. É a única que aumenta o papel (8 rem em vez de 6,5).")

# 5: família acima do nome
x, y = OXs[0], OYs[2]
tx, ny, pw, ph = scene(x, y, 6.5, 1.2, bar_rem=4.1)
txt(tx, y + 0.35 * R, "da família Corleone", 0.85 * R, INK2, False, "la", True)
txt(tx, ny + 0.1 * R, "Chacal", 1.5 * R, INK, True, "la", True)
label(x - 11.6 * R, y + LBL, "5  Família acima do nome (tipo sobrenome)", "'da família Corleone' em itálico pequeno, nome grande embaixo. Papel do mesmo tamanho.")

# referência: sem família
x, y = OXs[1], OYs[2]
tx, ny, pw, ph = scene(x, y, 6.5, 0.9)
txt(tx, ny + 0.3 * R, "Chacal", 1.5 * R, INK, True, "la", True)
label(x - 11.6 * R, y + LBL, "Referência: jogador sem família (como está no jogo)", "Nada aparece no lugar da família. Nas opções 1, 3 e 5 o papel não muda de tamanho.")

img = img.resize((W, H), Image.LANCZOS)
img.save("docs/arte/papel_familia_prototipos.png")
print("ok")
