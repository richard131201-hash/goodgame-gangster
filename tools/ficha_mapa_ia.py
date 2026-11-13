"""Mapa de referência da Ficha para gerar a arte por IA (medido no jogo a 1920x1080, em % do palco 16:9).
Saídas em docs/arte/:  ficha_mapa_rotulado.png (para humanos)  e  ficha_mapa_limpo.png (referência para a IA).
Uso: python tools/ficha_mapa_ia.py
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 2560, 1440
S = 1  # já em alta resolução

# (x%, y%, w%, h%) medidos no jogo
CARD = (12.39, 3.51, 11.36, 23.41)
PAPER = (21.89, 14.13, 13.42, 9.92)
FAMTAB = (24.52, 11.20, 8.20, 2.93)
STATS = (12.31, 29.07, 24.69, 13.64)
ROWS_Y = [29.16, 32.52, 35.89, 39.25]
ROW_H = 3.36
PLUS_X, PLUS_W, PLUS_H = 33.25, 2.96, 2.56
CREST = (37.98, 13.27, 11.52, 9.66)
WEAPON = (37.98, 24.24, 11.52, 18.47)
WEAPON_SLOT = (38.76, 28.22, 9.98, 13.30)
GEAR = (50.49, 13.27, 37.20, 29.44)
GEAR_X = [51.28, 60.35, 69.42, 78.49]
GEAR_Y = [17.24, 29.63]
GEAR_W, GEAR_H = 8.41, 11.21
MALA = (12.31, 44.02, 37.20, 44.03)
MALA_X = [13.10, 20.31, 27.51, 34.71, 41.92]
MALA_Y = [48.80, 58.59, 68.38, 78.17]
MALA_W, MALA_H = 6.79, 9.06
DUEL = (50.49, 44.02, 37.20, 44.03)
NAV = (21.66, 91.99, 56.67, 7.86)
HEADER_ZONE = (12.0, 1.5, 76.0, 6.5)


def px(b):
    x, y, w, h = b
    return (x / 100 * W, y / 100 * H, (x + w) / 100 * W, (y + h) / 100 * H)


def font(sz, bold=True):
    for n in (["arialbd.ttf"] if bold else ["arial.ttf"]):
        try:
            return ImageFont.truetype(n, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def draw(labeled):
    bg = "#1a1410" if labeled else "#000000"
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    line = 4
    col = "#ffffff"

    def box(b, label=None, fill=None, color=None, width=line, text_color="#f1e3bf", dashed=False):
        x0, y0, x1, y1 = px(b)
        d.rectangle([x0, y0, x1, y1], outline=color or col, width=width, fill=fill)
        if labeled and label:
            d.text((x0 + 10, y0 + 6), label, font=font(24), fill=text_color)

    def rect(x, y, w, h, **kw):
        box((x, y, w, h), **kw)

    if labeled:
        # faixa do topo e barra de baixo: o jogo desenha, a IA só deixa livre
        box(HEADER_ZONE, "TOPO: recursos e botoes (o jogo desenha, deixar livre)", fill="#2a2018", color="#7a6a4a", width=2)
    box(CARD, "1 RETRATO", fill="#14202c" if labeled else None)
    box(FAMTAB, "aba familia", fill="#5b4524" if labeled else None, text_color="#f1e3bd")
    box(PAPER, "2 PAPEL", fill="#cdb98c" if labeled else None, text_color="#2b1d05")
    box(STATS, "3 ATRIBUTOS (4 linhas)", fill="#29201a" if labeled else None)
    for i, y in enumerate(ROWS_Y):
        rect(STATS[0] + 0.4, y, STATS[2] - 0.8, ROW_H, color="#8a7a5a" if labeled else "#888888", width=2)
        rect(PLUS_X, y + (ROW_H - PLUS_H) / 2, PLUS_W, PLUS_H, color="#d4af37" if labeled else "#ffffff", width=3,
             fill="#d4af37" if labeled else None)
    box(CREST, "4 BRASAO", fill="#29201a" if labeled else None)
    cx, cy, cw, ch = CREST
    d.line([px(CREST)[0] + CREST[2] / 100 * W / 2, px(CREST)[1], px(CREST)[0] + CREST[2] / 100 * W / 2, px(CREST)[3]], fill="#8a7a5a" if labeled else "#888888", width=3)
    box(WEAPON, "5 ARMA", fill="#29201a" if labeled else None)
    box(WEAPON_SLOT, "slot arma 4:3", color="#d4af37" if labeled else "#ffffff")
    box(GEAR, "6 EQUIPAMENTO (8 slots 4:3, 4 x 2)", fill="#29201a" if labeled else None)
    for x in GEAR_X:
        for y in GEAR_Y:
            rect(x, y, GEAR_W, GEAR_H, color="#8a7a5a" if labeled else "#aaaaaa", width=3)
    box(MALA, "7 MALA (20 slots 4:3, 5 x 4; 4a fileira = cadeados)", fill="#29201a" if labeled else None)
    for r, y in enumerate(MALA_Y):
        for x in MALA_X:
            rect(x, y, MALA_W, MALA_H, color="#8a7a5a" if labeled else "#aaaaaa", width=3)
    box(DUEL, "8 AREA DE DUELO (livre, 'em breve')", fill="#241c16" if labeled else None)
    box(NAV, "9 BARRA DE ABAS (10 abas)", fill="#2a1d14" if labeled else None)
    nx0, ny0, nx1, ny1 = px(NAV)
    for i in range(1, 10):
        xx = nx0 + (nx1 - nx0) * i / 10
        d.line([xx, ny0 + 8, xx, ny1 - 8], fill="#7a6a4a" if labeled else "#888888", width=2)
    return img


def colored():
    """Esquema colorido e rotulado, no mesmo formato do que funcionou na 1a geração (caixas numeradas, fundo azul-marinho chapado)."""
    img = Image.new("RGB", (W, H), "#14141f")
    d = ImageDraw.Draw(img)

    def box(b, outline, fill, label=None, width=5, sub=None, size=26):
        x0, y0, x1, y1 = px(b)
        d.rounded_rectangle([x0, y0, x1, y1], radius=14, outline=outline, fill=fill, width=width)
        if label:
            d.text((x0 + 12, y0 + 8), label, font=font(size), fill=outline)
        if sub:
            d.text(((x0 + x1) / 2, (y0 + y1) / 2), sub, font=font(size), fill=outline, anchor="mm")

    # o papel do nome e a aba da família ficam ATRÁS do retrato (o retrato cobre a ponta esquerda deles)
    box(FAMTAB, "#e0b84a", "#3a2a14", None, width=4)
    box(PAPER, "#e8d9a8", "#3a3220", "2 PAPEL do nome (nota de papel, ATRAS do retrato)", size=22)
    box(CARD, "#4aa3ff", "#12263c", "1 RETRATO (por CIMA do papel do nome)", sub="vazio")
    box(STATS, "#3ddc84", "#12281c", None)
    names = ["Ataque", "Vida", "Astucia", "Tenacidade"]
    for n, y in zip(names, ROWS_Y):
        box((STATS[0] + 0.5, y, STATS[2] - 1.0, ROW_H), "#3ddc84", None, None, width=3)
        x0, y0, x1, y1 = px((STATS[0] + 0.5, y, STATS[2] - 1.0, ROW_H))
        d.text((x0 + 14, (y0 + y1) / 2), n, font=font(24), fill="#3ddc84", anchor="lm")
        box((PLUS_X, y + (ROW_H - PLUS_H) / 2, PLUS_W, PLUS_H), "#e0b84a", "#5a4414", None, width=3, sub="+", size=24)
    box(CREST, "#e0b84a", "#2a2218", "4 CLASSE | DEFESA", size=24)
    x0, y0, x1, y1 = px(CREST)
    d.line([(x0 + x1) / 2, y0 + 8, (x0 + x1) / 2, y1 - 8], fill="#e0b84a", width=4)
    box(WEAPON, "#ff6a5c", "#2e1614", "5 ARMA")
    box(WEAPON_SLOT, "#ff6a5c", "#4a1e1a", None, sub="slot 4:3", size=26)
    box(GEAR, "#b583ff", "#1f1630", "6 EQUIPAMENTO (8 slots: 4 colunas x 2 linhas)")
    gnames = ["chapeu", "peitoral", "calca", "calcado", "amuleto", "pet", "reliquia", "veiculo"]
    for i, n in enumerate(gnames):
        box((GEAR_X[i % 4], GEAR_Y[i // 4], GEAR_W, GEAR_H), "#b583ff", "#2d2046", None, sub="slot 4:3 - " + n, size=22)
    box(MALA, "#4aa3ff", "#101e30", "7 MALA (20 slots: 5 colunas x 4 linhas)")
    for r, y in enumerate(MALA_Y):
        for x in MALA_X:
            if r < 2:
                box((x, y, MALA_W, MALA_H), "#4aa3ff", "#16304d", None, sub="slot 4:3", size=22)
            else:
                box((x, y, MALA_W, MALA_H), "#aaaaaa", "#2e2c2a", None, sub="BLOQUEADO", size=22)
    box(DUEL, "#e0b84a", "#1e1a12", "8 AREA LIVRE (duelo) - painel vazio", sub="vazio", size=28)
    box(NAV, "#e0b84a", "#2a1d14", "9 ABAS (10 iguais)", size=22)
    nx0, ny0, nx1, ny1 = px(NAV)
    for i in range(1, 10):
        xx = nx0 + (nx1 - nx0) * i / 10
        d.line([xx, ny0 + 10, xx, ny1 - 10], fill="#e0b84a", width=3)
    d.text((W / 2, 40), "FAIXA DO TOPO: vazia, so fundo chapado azul-marinho (o jogo desenha recursos e botoes)", font=font(26), fill="#6a6a88", anchor="mm")
    return img


draw(True).save("docs/arte/ficha_mapa_rotulado.png")
draw(False).save("docs/arte/ficha_mapa_limpo.png")
colored().save("docs/arte/ficha_mapa_colorido.png")
print("ok")
