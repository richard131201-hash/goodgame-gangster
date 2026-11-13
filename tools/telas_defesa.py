# Protótipos da aba Ficha COMPLETA com o brasão de defesa acima da arma (3 variações). Segue o layout vigente (R-UI-4).
# Gera docs/arte/ficha_defesa_A.png, _B.png e _C.png (2400 x 1350). Uso: python -I tools/telas_defesa.py
from PIL import Image, ImageDraw

BASE = r"C:\Users\Rodrigo Cipolli\Desktop\NewGame"
_src = open(BASE + r"\tools\telas_prototipos.py", encoding="utf8").read()
_src = _src[:_src.index("# número, nome, topo")]
ns = {"__name__": "mod"}
exec(compile(_src, "telas_prototipos", "exec"), ns)
nav, F = ns["nav"], ns["F"]
W, H = 2400, 1350
GOLD, CREAM, BLUE, GREEN, RED, PUR, GRAY, BG = (212, 175, 55), (241, 227, 191), (90, 170, 230), (95, 200, 120), (230, 100, 90), (190, 130, 230), (150, 150, 150), (30, 24, 18)
NOTA = (170, 170, 176)
R = 19.75  # px por rem (palco de 2400 px com zoom 0,86)


def rb(d, x0, y0, x1, y1, col, fill=None, w=3, r=12, label="", fs=20, off=(10, 6)):
    d.rounded_rectangle((x0, y0, x1, y1), radius=r, outline=col, width=w, fill=fill)
    if label:
        d.text((x0 + off[0], y0 + off[1]), label, font=F(fs), fill=col)


def txt(d, x, y, s, fs=20, col=CREAM, centro=None):
    if centro:
        x = centro - d.textlength(s, font=F(fs)) / 2
    d.text((x, y), s, font=F(fs), fill=col)


def escudo(d, x, y, w, h, texto="10%", legenda="DEFESA", fs=34):
    """Brasão (escudo) com a defesa em %. (x, y) = canto superior esquerdo."""
    pts = [(x, y + h * 0.10), (x + w * 0.5, y), (x + w, y + h * 0.10), (x + w, y + h * 0.55), (x + w * 0.5, y + h), (x, y + h * 0.55)]
    d.polygon(pts, outline=GOLD, fill=(48, 38, 20))
    d.line(pts + [pts[0]], fill=GOLD, width=5)
    inner = [(x + w * 0.12, y + h * 0.17), (x + w * 0.5, y + h * 0.08), (x + w * 0.88, y + h * 0.17), (x + w * 0.88, y + h * 0.52), (x + w * 0.5, y + h * 0.88), (x + w * 0.12, y + h * 0.52)]
    d.line(inner + [inner[0]], fill=(120, 96, 40), width=2)
    txt(d, 0, y + h * 0.27, texto, fs, GOLD, centro=x + w / 2)
    if legenda:
        txt(d, 0, y + h * 0.60, legenda, 14, CREAM, centro=x + w / 2)


def topo(d):
    cw, ch = int(11.2 * R), int(12.6 * R)
    x0 = 212 + int(1.5 * R) + int(1.1 * R)
    rb(d, x0, 22, x0 + cw, 22 + ch, BLUE, (20, 40, 60), 5, 12)
    txt(d, x0 + 40, 90, "FOTO DO", 28, BLUE)
    txt(d, x0 + 40, 126, "PERSONAGEM", 28, BLUE)
    rb(d, x0 + cw - 62, 22 + ch - 62, x0 + cw - 8, 22 + ch - 8, WHITE if False else CREAM, (30, 24, 18), 3, 8, "✂", 26, (12, 8))
    ix = x0 + cw + 28
    rb(d, ix, 30, ix + 240, 76, CREAM, None, 3, 8, "nome do jogador", 20)
    rb(d, ix + 252, 36, ix + 352, 70, GOLD, None, 3, 6, "classe", 18)
    d.ellipse((ix, 86, ix + 44, 130), outline=GOLD, width=4, fill=BG)
    txt(d, ix + 12, 94, "N", 24, GOLD)
    rb(d, ix + 56, 92, ix + 352, 124, GREEN, None, 3, 8, "barra de XP", 18, (10, 5))
    x = 930
    for nome, w, mais in [("energia", 225, True), ("cash", 180, False), ("ouro", 210, True), ("ranking", 150, False)]:
        rb(d, x, 26, x + w, 100, PUR, (36, 28, 40), 3, 14)
        d.ellipse((x + 10, 36, x + 62, 88), outline=PUR, width=3)
        txt(d, x + 74, 34, nome, 13, PUR)
        txt(d, x + 74, 54, "valor", 26)
        if mais:
            rb(d, x + w - 46, 48, x + w - 12, 78, GOLD, None, 3, 6, "+", 20, (10, 2))
        x += w + 14
    xr = 212 + 1975 - 40
    for texto, w in [("Sair", 90), ("Novo Gangster", 180), ("som", 54), ("tema", 54)]:
        rb(d, xr - w, 30, xr, 82, RED if w > 54 else GRAY, None, 3, 10, texto, 18)
        xr -= w + 10
    return 22 + ch


def tela(arq, variante, nota, linhas=3):
    im = Image.new("RGB", (W, H), (14, 12, 10))
    d = ImageDraw.Draw(im)
    nav(d, 2)
    # pasta (coluna central de 100 rem)
    fx0, fx1 = 212, 212 + 1975
    top, bot = 170, 1225
    rb(d, fx0, top, fx1, bot, GOLD, (34, 28, 22), 4, 18)
    rb(d, 212 + int(14.4 * R), top - 46, 212 + int(14.4 * R) + 520, top, GOLD, (34, 28, 22), 4, 12, "ABA DO TÍTULO (FICHA · NOME)", 20, (14, 12))
    rb(d, fx1 - 420, top - 52, fx1 - 60, top - 6, RED, None, 3, 8, "CARIMBO (texto da pasta)", 20)
    # conteúdo centralizado
    A, B, C, gap = int(30 * R), int(14 * R), int(36 * R), int(1.2 * R)
    total = A + B + C + 2 * gap
    ax = fx0 + (1975 - total) // 2
    bx = ax + A + gap
    cx = bx + B + gap
    sw, sh, sg = int(8.4 * R), int(6.6 * R), 16
    conteudo = 2 * sh + sg + 40 if False else 0
    row1 = int(6.2 * R) + int(14.4 * R)
    row2 = linhas * sh + (linhas - 1) * 10
    total_h = row1 + 56 + row2
    y1 = top + (bot - top - total_h) // 2
    y2 = y1 + row1 + 56
    # atributos (abaixo do card)
    ay = y1 + int(6.2 * R)
    txt(d, ax, ay - 30, "ATRIBUTOS", 22)
    rb(d, ax, ay, ax + A, ay + int(14.4 * R), GREEN, (24, 40, 30), 4, 12)
    pitch = int(14.4 * R) / 4
    for i, n in enumerate(["Ataque", "Vida", "Astúcia", "Tenacidade"]):
        yy = int(ay + 8 + i * pitch)
        rb(d, ax + 10, yy, ax + A - 10, int(yy + pitch - 8), GREEN, None, 2, 8)
        txt(d, ax + 22, int(yy + pitch / 2 - 14), n + "           (valor)       [+]", 20, GREEN)
    # arma + brasão
    aw = B
    if variante == "A":  # escudo centrado acima da arma
        escudo(d, bx + aw // 2 - 62, y1, 124, 142)
        wy = y1 + 142 + 44
    elif variante == "B":  # placa com escudo pequeno e texto ao lado
        rb(d, bx, y1, bx + aw, y1 + 100, GOLD, (34, 28, 22), 3, 12)
        escudo(d, bx + 14, y1 + 8, 70, 84, "", "", 20)
        txt(d, bx + 96, y1 + 14, "DEFESA", 15, CREAM)
        txt(d, bx + 96, y1 + 40, "10%", 40, GOLD)
        wy = y1 + 100 + 44
    else:  # C: escudo "preso" na borda de cima da arma
        wy = y1 + 74
    txt(d, bx if variante != "C" else bx, wy - 32 if variante != "C" else wy + int(9 * R) + 8, "ARMA", 22)
    rb(d, bx, wy, bx + aw, wy + int(9 * R), RED, (60, 30, 28), 4, 12, "slot da arma", 18)
    if variante == "C":  # o emblema fica POR CIMA da borda de cima do painel da arma
        escudo(d, bx + aw // 2 - 50, y1 + 4, 100, 116, "10%", "DEFESA", 30)
    # equipamento
    txt(d, cx, y1 + 2, "EQUIPAMENTO", 22)
    nomes = ["CHAPÉU", "PEITORAL", "CALÇA", "CALÇADO", "AMULETO", "PET", "RELÍQUIA", "VEÍCULO"]
    for i, n in enumerate(nomes):
        c, r = i % 4, i // 4
        sx, sy = cx + c * (sw + sg), y1 + 34 + r * (sh + sg)
        rb(d, sx, sy, sx + sw, sy + sh, PUR, (44, 34, 52), 3, 10)
        txt(d, sx + 10, sy + 6, n, 16, PUR)
    # mala 5 x 3 (embaixo, esquerda) e área livre (embaixo, direita)
    txt(d, ax, y2 - 30, "MALA", 22)
    mw = (A + gap + B - 4 * 10) // 5
    for r in range(linhas):
        for c in range(5):
            locked = r >= 2
            sx, sy = ax + c * (mw + 10), y2 + r * (sh + 10)
            rb(d, sx, sy, sx + mw, sy + sh, GRAY if locked else BLUE, (46, 40, 36) if locked else (22, 40, 60), 3, 10)
            txt(d, sx + 8, sy + 6, "BLOQUEADO" if locked else "slot da mala", 15, GRAY if locked else BLUE)
    txt(d, cx, y2 - 30, "ÁREA LIVRE (equipamento de duelo)", 22, CREAM)
    rb(d, cx, y2, cx + C, y2 + row2, GRAY, (40, 40, 44), 4, 12)
    txt(d, cx + 24, y2 + row2 // 2 - 30, "ÁREA LIVRE (sem desenho)", 28, (200, 200, 205))
    txt(d, cx + 24, y2 + row2 // 2 + 6, "consumíveis, coletes, bombas...", 22, NOTA)
    topo(d)
    txt(d, 1990, H - 150, arq.replace("ficha_defesa_", "Ficha · opção ").replace("A2", "A, 4 fileiras"), 26, GOLD)
    import textwrap
    for j, linha in enumerate(textwrap.wrap(nota, 40)):
        txt(d, 1990, H - 116 + j * 20, linha, 15, NOTA)
    im.save(rf"{BASE}\docs\arte\{arq}.png")


tela("ficha_defesa_A", "A", "Escudo médio centrado acima da arma, com o percentual dentro e a palavra DEFESA embaixo")
tela("ficha_defesa_A2", "A", "Escudo centrado acima da arma; Mala com 4 fileiras (2 bloqueadas) e área livre da mesma altura", linhas=4)
tela("ficha_defesa_B", "B", "Placa baixa acima da arma: escudo pequeno à esquerda e o percentual ao lado")
tela("ficha_defesa_C", "C", "Escudo pequeno 'preso' na borda de cima do painel da arma, como um emblema")
print("ok")
