# 10 protótipos de TELA COMPLETA (topo + título/carimbo + Ficha + barra de botões), em 2400 x 1350 (16:9), para a IA redesenhar.
# Reaproveita os 10 topos (tools/hud_prototipos.py) e os 4 layouts da Ficha (tools/ficha_layouts.py).
# Uso: python -I tools/telas_prototipos.py   (gera docs/arte/tela_01.png ... tela_10.png)
from PIL import Image, ImageDraw, ImageFont

BASE = r"C:\Users\Rodrigo Cipolli\Desktop\NewGame"


def carrega(caminho, trocas, extra=None):
    src = open(caminho, encoding="utf8").read()
    for a, b in trocas:
        assert a in src, a
        src = src.replace(a, b)
    ns = {"__name__": "mod"}
    ns.update(extra or {})
    exec(compile(src, caminho, "exec"), ns)
    return ns


SUBS = {}
carrega(BASE + r"\tools\ficha_layouts.py", [("        compor(self.im, nome)", "        SUBS[nome] = self.im")], {"SUBS": SUBS})
hud = carrega(BASE + r"\tools\hud_prototipos.py", [("folha(1, DESENHOS[:5])\nfolha(2, DESENHOS[5:])\nprint(\"ok\")", "")])

W, H = 2400, 1350
FONT = r"C:\Windows\Fonts\arialbd.ttf"
F = lambda s: ImageFont.truetype(FONT, s)
GOLD, CREAM, PUR, GRAY, RED, BG = (212, 175, 55), (241, 227, 191), (190, 130, 230), (150, 150, 150), (230, 100, 90), (30, 24, 18)
NOMES_B = ["Ficha", "Missões", "Duelo", "Mercado", "Ranking", "Família", "Distritos", "Tarefas", "Eventos", "Simulador"]


def rb(d, x0, y0, x1, y1, col, fill=None, w=3, r=12):
    d.rounded_rectangle((x0, y0, x1, y1), radius=r, outline=col, width=w, fill=fill)


def botao(d, x, y, w, h, nome, ativo, forma="q", icone=True, fs=15):
    col = CREAM if ativo else GRAY
    if forma == "c":
        d.ellipse((x, y, x + w, y + h), outline=col, width=3 if ativo else 2, fill=(40, 32, 24) if ativo else None)
    else:
        rb(d, x, y, x + w, y + h, col, None, 3 if ativo else 2, 10)
    if icone:
        cx, cy, r = x + w // 2, y + h // 2 - (8 if forma != "c" else 0), min(w, h) // 5
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=PUR, width=2)
    tw = d.textlength(nome, font=F(fs))
    d.text((x + (w - tw) / 2, y + h - fs - 6), nome, font=F(fs), fill=col)


def nav(d, estilo):
    """Barra de botões embaixo no centro. Devolve a altura ocupada."""
    if estilo == 1:  # barra de couro com botões quadrados
        bw, bh = 1107, 101; bx, by = (W - bw) // 2, H - bh - 2
        rb(d, bx, by, bx + bw, by + bh, GOLD, BG, 4, 18)
        for i, n in enumerate(NOMES_B):
            up = 9 if i == 0 else 0
            botao(d, bx + 18 + i * 108, by + 14 - up, 99, 76, n, i == 0)
        return 105
    if estilo == 2:  # barra larga, botões com rótulo grande
        bw, bh = 1500, 96; bx, by = (W - bw) // 2, H - bh - 2
        rb(d, bx, by, bx + bw, by + bh, GOLD, BG, 4, 14)
        for i, n in enumerate(NOMES_B):
            botao(d, bx + 14 + i * 147, by + 10 - (8 if i == 0 else 0), 138, 76, n, i == 0, fs=17)
        return 100
    if estilo == 3:  # botões redondos soltos, sem barra
        for i, n in enumerate(NOMES_B):
            r = 46 if i == 0 else 40
            cx = W // 2 - 5 * 100 + 50 + i * 100
            botao(d, cx - r, H - 2 * r - 14 - (6 if i == 0 else 0), 2 * r, 2 * r, "", i == 0, "c")
            tw = d.textlength(n, font=F(13)); d.text((cx - tw / 2, H - 18), n, font=F(13), fill=CREAM if i == 0 else GRAY)
        return 112
    if estilo == 4:  # barra com elevação central (arco)
        bw, bh = 1180, 92; bx, by = (W - bw) // 2, H - bh - 2
        rb(d, bx, by, bx + bw, by + bh, GOLD, BG, 4, 30)
        d.pieslice((W // 2 - 190, by - 52, W // 2 + 190, by + 90), 180, 360, outline=GOLD, width=4, fill=BG)
        for i, n in enumerate(NOMES_B):
            cx = bx + 70 + i * 120
            botao(d, cx - 46, by + 8 - (22 if i in (4, 5) else 0), 92, 74, n, i == 0)
        return 140
    if estilo == 5:  # abas coladas na borda de baixo (como abas de pasta ao contrário)
        tw = 150; total = tw * 10 + 9 * 6; bx = (W - total) // 2
        for i, n in enumerate(NOMES_B):
            x = bx + i * (tw + 6); up = 12 if i == 0 else 0
            rb(d, x, H - 84 - up, x + tw, H + 20, CREAM if i == 0 else GOLD, BG if i else (50, 40, 30), 3, 14)
            d.ellipse((x + tw // 2 - 14, H - 74 - up, x + tw // 2 + 14, H - 46 - up), outline=PUR, width=2)
            t = d.textlength(n, font=F(16)); d.text((x + (tw - t) / 2, H - 38 - up), n, font=F(16), fill=CREAM if i == 0 else GRAY)
        return 88
    if estilo == 6:  # dock: ícones grandes, o ativo cresce com nome
        for i, n in enumerate(NOMES_B):
            big = i == 0; s = 110 if big else 84
            x = W // 2 - 5 * 118 + i * 118 + (118 - s) // 2
            botao(d, x, H - s - 10, s, s, n if big else "", big, "q", True, 18)
        return 122
    if estilo == 7:  # placa de latão com rebites
        bw, bh = 1160, 104; bx, by = (W - bw) // 2, H - bh - 2
        rb(d, bx, by, bx + bw, by + bh, GOLD, (60, 48, 20), 5, 12)
        for (rx, ry) in [(bx + 14, by + 14), (bx + bw - 14, by + 14), (bx + 14, by + bh - 14), (bx + bw - 14, by + bh - 14)]:
            d.ellipse((rx - 6, ry - 6, rx + 6, ry + 6), outline=GOLD, width=3)
        for i, n in enumerate(NOMES_B):
            botao(d, bx + 36 + i * 109, by + 12, 100, 80, n, i == 0)
        return 108
    if estilo == 8:  # trilha longa com medalhões em encaixes
        bw, bh = 1260, 96; bx, by = (W - bw) // 2, H - bh - 2
        rb(d, bx, by, bx + bw, by + bh, GOLD, BG, 4, 48)
        for i, n in enumerate(NOMES_B):
            cx = bx + 60 + i * 126
            d.ellipse((cx - 38, by + 10, cx + 38, by + 86), outline=CREAM if i == 0 else GRAY, width=3 if i == 0 else 2, fill=(46, 36, 26) if i == 0 else None)
            d.ellipse((cx - 12, by + 26, cx + 12, by + 50), outline=PUR, width=2)
            t = d.textlength(n, font=F(13)); d.text((cx - t / 2, by + 60), n, font=F(13), fill=CREAM if i == 0 else GRAY)
        return 100
    if estilo == 9:  # mínimo: só ícones com sublinhado no ativo
        for i, n in enumerate(NOMES_B):
            cx = W // 2 - 5 * 96 + 48 + i * 96
            d.ellipse((cx - 20, H - 70, cx + 20, H - 30), outline=PUR, width=2)
            t = d.textlength(n, font=F(13)); d.text((cx - t / 2, H - 26), n, font=F(13), fill=CREAM if i == 0 else GRAY)
            if i == 0:
                d.line((cx - 30, H - 8, cx + 30, H - 8), fill=GOLD, width=4)
        return 78
    # 10: dois grupos simétricos com botão central da Ficha
    for i, n in enumerate(NOMES_B[1:]):
        lado = -1 if i < 5 else 1
        k = (4 - i) if i < 5 else (i - 5)
        x = W // 2 + lado * (130 + k * 112) - 48
        botao(d, x, H - 92, 96, 82, n, False)
    d.ellipse((W // 2 - 74, H - 150, W // 2 + 74, H - 2), outline=GOLD, width=5, fill=BG)
    d.ellipse((W // 2 - 20, H - 112, W // 2 + 20, H - 72), outline=PUR, width=3)
    t = d.textlength("Ficha", font=F(18)); d.text((W // 2 - t / 2, H - 46), "Ficha", font=F(18), fill=CREAM)
    return 154


# número, nome, topo (p1..p10), layout (A..D), barra (1..10), descrição
PROTOS = [
    (1, "Clássico em couro", hud["p1"], "B", 1, "topo baixo e familiar, Ficha em duas metades, barra de couro com botões quadrados"),
    (2, "Estilo GGG", hud["p2"], "C", 2, "retrato grande com XP vertical, energia comprida, Ficha em 3 colunas, barra larga com rótulos"),
    (3, "Medalhão", hud["p3"], "A", 3, "avatar em medalhão com anel de XP, pílulas, botões redondos soltos embaixo (sem barra)"),
    (4, "Energia em destaque", hud["p4"], "D", 4, "barra de energia segmentada, Ficha com boneco ao centro, barra com arco no meio"),
    (5, "Dois andares", hud["p5"], "A", 5, "topo em dois andares com 4 placas grandes, barra de abas coladas na borda de baixo"),
    (6, "Cartões pendurados", hud["p6"], "D", 6, "etiquetas penduradas no trilho, Ficha estilo RPG, dock de ícones grandes"),
    (7, "Crachá e recibo", hud["p7"], "C", 7, "crachá e faixa de recibo, Ficha em 3 colunas, barra de placa de latão com rebites"),
    (8, "Painel de instrumentos", hud["p8"], "B", 8, "mostrador e hodômetros, Ficha em duas metades, trilha com medalhões"),
    (9, "Peças soltas", hud["p9"], "B", 9, "sem faixa no topo e só ícones embaixo: a tela mais limpa, com o máximo de espaço para a Ficha"),
    (10, "Letreiro art déco", hud["p10"], "A", 10, "simetria total: arco central no topo e botão central da Ficha embaixo"),
]

PROTOS.append((2, "Estilo GGG (revisado)", hud["p2"], "C3", 2, "atributos largos ao lado do retrato, arma embaixo do retrato, Mala horizontal, sem abas na Mala"))

for idx_p, (n, nome, fhud, lay_id, est, desc) in enumerate(PROTOS):
    im = Image.new("RGB", (W, H), (14, 12, 10))
    d = ImageDraw.Draw(im)
    hi = fhud()
    im.paste(hi, (0, 6))
    hy = 6 + hi.height
    # título da pasta e carimbo
    rb(d, 110, hy + 6, 690, hy + 56, GOLD, None, 4, 12)
    d.text((124, hy + 18), "ABA DO TÍTULO DA PASTA (FICHA · NOME)", font=F(20), fill=GOLD)
    rb(d, 1980, hy + 4, 2330, hy + 54, RED, None, 3, 8)
    d.text((1994, hy + 16), "CARIMBO (texto da pasta)", font=F(20), fill=RED)
    nav_h = nav(d, est)
    top = hy + 60
    avail = H - nav_h - 10 - top
    k = min(2330 / 2200, avail / 1000)
    sub = SUBS[lay_id].resize((int(2200 * k), int(1000 * k)), Image.LANCZOS)
    im.paste(sub, ((W - sub.width) // 2, top))
    import textwrap
    d.text((1990, H - 150), f"PROTÓTIPO {n}", font=F(26), fill=GOLD)
    d.text((1990, H - 118), nome, font=F(22), fill=CREAM)
    for j, linha in enumerate(textwrap.wrap(f"topo {n} + layout {lay_id} + barra {est}: {desc}", 40)):
        d.text((1990, H - 90 + j * 20), linha, font=F(15), fill=(170, 170, 176))
    sufixo = "_v2" if lay_id == "C3" else ""
    im.save(rf"{BASE}\docs\arte\tela_{n:02d}{sufixo}.png")
    print(n, nome, "escala", round(k, 2))
