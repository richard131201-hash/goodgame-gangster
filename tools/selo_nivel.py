"""Protótipos do selo de nível e da barra de XP (para gerar a arte final por IA).
Uso: python tools/selo_nivel.py  ->  docs/arte/selo_nivel_prototipos.png
"""
import math
from PIL import Image, ImageDraw, ImageFont

S = 4  # supersampling
W, H = 1500, 900
img = Image.new("RGB", (W * S, H * S), "#2b1d12")
d = ImageDraw.Draw(img)

GOLD, GOLD_D, INK = "#d4af37", "#7a5c12", "#2b1d05"
PAPER = ("#cdb98c", "#b9a276")


def font(sz, bold=False):
    for n in (["arialbd.ttf"] if bold else ["arial.ttf"]):
        try:
            return ImageFont.truetype(n, int(sz * S))
        except OSError:
            pass
    return ImageFont.load_default()


def txt(x, y, s, sz, fill="#e8dcc0", bold=False, anchor="la"):
    d.text((x * S, y * S), s, font=font(sz, bold), fill=fill, anchor=anchor)


def scallop(cx, cy, r, n, amp, steps=8):
    pts = []
    for i in range(n * steps):
        t = 2 * math.pi * i / (n * steps)
        rr = r + amp * math.cos(n * t)
        pts.append(((cx + rr * math.sin(t)) * S, (cy - rr * math.cos(t)) * S))
    return pts


def star(cx, cy, ro, ri, n):
    pts = []
    for i in range(n * 2):
        t = math.pi * i / n
        rr = ro if i % 2 == 0 else ri
        pts.append(((cx + rr * math.sin(t)) * S, (cy - rr * math.cos(t)) * S))
    return pts


def circle(cx, cy, r, **kw):
    d.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], **kw)


def seal(kind, cx, cy, r, num):
    if kind == "A":  # serrilhado (o que está no jogo)
        d.polygon(scallop(cx, cy, r * 0.91, 16, r * 0.065), fill=GOLD, outline=GOLD_D, width=int(1.4 * S))
        circle(cx, cy, r * 0.71, outline=GOLD_D, width=int(1.2 * S))
    elif kind == "B":  # redondo, anel duplo
        circle(cx, cy, r * 0.95, fill=GOLD, outline=GOLD_D, width=int(1.6 * S))
        circle(cx, cy, r * 0.78, outline=GOLD_D, width=int(1.2 * S))
        circle(cx, cy, r * 0.70, outline="#f3d97a", width=int(0.8 * S))
    elif kind == "C":  # selo de cera (borda irregular grossa)
        d.polygon(scallop(cx, cy, r * 0.88, 9, r * 0.10, 12), fill=GOLD, outline=GOLD_D, width=int(1.6 * S))
        circle(cx, cy, r * 0.62, fill="#e2c24f", outline=GOLD_D, width=int(1.2 * S))
    else:  # D estrela de 12 pontas (estilo xerife)
        d.polygon(star(cx, cy, r * 0.97, r * 0.78, 12), fill=GOLD, outline=GOLD_D, width=int(1.4 * S))
        circle(cx, cy, r * 0.58, outline=GOLD_D, width=int(1.2 * S))
    txt(cx, cy + r * 0.04, str(num), r * 0.72, INK, True, "mm")


def paper(x, y, w, h):
    d.rectangle([x * S, y * S, (x + w) * S, (y + h) * S], fill=PAPER[0])
    d.rectangle([x * S, (y + h * 0.5) * S, (x + w) * S, (y + h) * S], fill=PAPER[1])


def bar(kind, x, y, w, h, pct, label, seal_overlap=0):
    r = {1: h * 0.28, 2: h * 0.12, 3: h * 0.28}[kind]
    d.rounded_rectangle([x * S, y * S, (x + w) * S, (y + h) * S], radius=r * S, fill="#7d6c4c", outline="#3d2f1d", width=int(1.2 * S))
    fx = x + 2 + seal_overlap
    d.rounded_rectangle([fx * S, (y + 2) * S, (fx + (w - 4 - seal_overlap) * pct) * S, (y + h - 2) * S], radius=max(r - 2, 1) * S, fill="#3fcf7a")
    if kind == 3:
        d.rounded_rectangle([(x - 3) * S, (y - 3) * S, (x + w + 3) * S, (y + h + 3) * S], radius=(r + 3) * S, outline="#5a4727", width=int(1 * S))
    txt(x + w / 2 + seal_overlap / 2, y + h / 2, label, h * 0.6, "#1f1608", True, "mm")


txt(40, 30, "MOBSTER RISE - Selo de nível e barra de XP (protótipos para a IA)", 26, "#d4af37", True)
txt(40, 70, "Proporção do jogo: selo 2,7 rem de lado, barra 1,25 rem de altura, selo cobre 0,9 rem da ponta esquerda da barra.", 15, "#bfae8a")

# --- selos ---
txt(40, 120, "SELO DO NÍVEL (cada um mostrado grande e no tamanho real)", 18, "#e8dcc0", True)
names = {"A": "A  Serrilhado (no jogo)", "B": "B  Redondo, anel duplo", "C": "C  Selo de cera", "D": "D  Estrela de xerife"}
for i, k in enumerate("ABCD"):
    cx = 40 + 170 + i * 350
    seal(k, cx, 270, 90, 16)
    txt(cx, 385, names[k], 15, "#e8dcc0", True, "ma")
    seal(k, cx - 60, 450, 27, 16)
    seal(k, cx, 450, 27, 5)
    seal(k, cx + 60, 450, 27, 120)

# --- barras ---
txt(40, 520, "BARRA DE XP (no papel, com o selo cobrindo a ponta esquerda)", 18, "#e8dcc0", True)
bnames = {1: "1  Cantos suaves (no jogo)", 2: "2  Quase reta", 3: "3  Com moldura dupla"}
for i, k in enumerate((1, 2, 3)):
    px = 40 + i * 480
    paper(px, 560, 440, 150)
    bar(k, px + 90, 640, 320, 32, 0.24, "603 / 2520 XP", 24)
    seal("A", px + 80, 656, 34, 16)
    txt(px + 24, 585, "Chacal", 26, INK, True)
    txt(px, 722, bnames[k], 15, "#e8dcc0", True)

txt(40, 780, "Para a IA: peça cada peça separada, fundo transparente, vista frontal, sem sombra projetada:", 15, "#bfae8a")
txt(40, 805, "(1) selo dourado de nível, vazio, sem número, em 512 x 512;  (2) barra de XP vazia horizontal, proporção 10:1;  (3) preenchimento verde da barra.", 15, "#bfae8a")
txt(40, 830, "O número do nível e o texto de XP são escritos pelo jogo por cima, então a arte deve vir sem texto.", 15, "#bfae8a")

img = img.resize((W, H), Image.LANCZOS)
img.save("docs/arte/selo_nivel_prototipos.png")
print("ok")
