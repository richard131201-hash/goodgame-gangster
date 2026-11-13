# 10 protótipos (esquemas) para o TOPO/HUD do jogo, para a IA redesenhar. Gera 2 folhas em docs/arte/.
# Todos têm os mesmos elementos: avatar, nome/classe, nível, barra de XP, Energia (com "+"), Cash, Ouro (com "+"),
# Ranking e os botões Tema, Som, Novo Gangster e Sair. Largura 2400 (tela inteira do jogo).
from PIL import Image, ImageDraw, ImageFont

W = 2400
FONT = r"C:\Windows\Fonts\arialbd.ttf"
F = lambda s: ImageFont.truetype(FONT, s)
GOLD, CREAM, BLUE, GREEN, RED, PUR, GRAY, BG = (212, 175, 55), (241, 227, 191), (90, 170, 230), (95, 200, 120), (230, 100, 90), (190, 130, 230), (150, 150, 150), (30, 24, 18)
NOTA = (170, 170, 176)


class D:
    def __init__(self, h):
        self.im = Image.new("RGB", (W, h), (14, 12, 10))
        self.d = ImageDraw.Draw(self.im)

    def rb(self, x0, y0, x1, y1, col, fill=None, w=3, r=12, label="", fs=20, lc=None, off=(10, 6)):
        self.d.rounded_rectangle((x0, y0, x1, y1), radius=r, outline=col, width=w, fill=fill)
        if label:
            self.d.text((x0 + off[0], y0 + off[1]), label, font=F(fs), fill=lc or col)

    def circ(self, cx, cy, r, col, fill=None, w=3, label="", fs=16):
        self.d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=col, width=w, fill=fill)
        if label:
            tw = self.d.textlength(label, font=F(fs))
            self.d.text((cx - tw / 2, cy - fs / 2), label, font=F(fs), fill=col)

    def t(self, x, y, s, fs=20, col=CREAM):
        self.d.text((x, y), s, font=F(fs), fill=col)

    def plate(self, x, y, w, h, nome, mais=False):
        """Placa de recurso: círculo de ícone + nome + valor (+ botão +)."""
        self.rb(x, y, x + w, y + h, PUR, (36, 28, 40), 3, 12)
        r = min(h // 2 - 10, 30)
        self.circ(x + 14 + r, y + h // 2, r, PUR, None, 3, "ícone", 13)
        self.t(x + 28 + 2 * r, y + h // 2 - 26, nome, 14, PUR)
        self.t(x + 28 + 2 * r, y + h // 2 - 4, "valor", 24)
        if mais:
            self.rb(x + w - 62, y + h // 2 - 15, x + w - 14, y + h // 2 + 15, GOLD, None, 3, 6, "+", 22)

    def botoes(self, x_right, y, h=54, redondo=False, tam=60):
        xr = x_right
        for texto, w in [("Sair", 100), ("Novo Gangster", 190), ("som", tam), ("tema", tam)]:
            if redondo and w == tam:
                self.circ(xr - w // 2, y + h // 2, h // 2, GRAY, None, 3, texto, 14)
            else:
                self.rb(xr - w, y, xr, y + h, RED if w > tam else GRAY, None, 3, 10, texto, 20)
            xr -= w + 12
        return xr

    def avatar_info(self, x, y, ds=84, xp_w=260):
        self.circ(x + ds // 2, y + ds // 2, ds // 2, BLUE, (20, 40, 60), 4, "avatar", 18)
        self.rb(x + ds + 16, y + 4, x + ds + 16 + 310, y + 44, CREAM, None, 3, 10, "nome do jogador   [classe]", 20)
        self.circ(x + ds + 34, y + 70, 18, GOLD, None, 3, "N", 16)
        self.rb(x + ds + 60, y + 60, x + ds + 60 + xp_w, y + 84, GREEN, None, 3, 8, "barra de XP", 16)


def p1():
    d = D(130)
    d.rb(34, 4, W - 34, 124, GOLD, BG, 4, 16)
    d.avatar_info(60, 20)
    x = 760
    for n, w, m in [("ENERGIA", 266, True), ("CASH", 161, False), ("OURO", 243, True), ("RANKING", 147, False)]:
        d.plate(x, 20, w, 86, n, m)
        x += w + 16
    d.botoes(W - 60, 36)
    return d.im


def p2():
    d = D(250)
    d.rb(34, 4, 260, 236, BLUE, (20, 40, 60), 4, 10, "RETRATO GRANDE", 18)
    d.t(80, 100, "foto do", 22, BLUE)
    d.t(80, 130, "avatar", 22, BLUE)
    d.rb(270, 4, 312, 236, GREEN, None, 3, 8)
    d.rb(270, 150, 312, 236, GOLD, (50, 40, 10), 3, 8, "N", 22, off=(12, 24))
    d.t(280, 20, "XP", 18, GREEN)
    d.rb(330, 8, 700, 62, CREAM, None, 3, 10, "nome do jogador   [classe]", 22)
    x = 730
    for n, w, m in [("OURO", 300, True), ("CASH", 270, False), ("RANKING", 260, False)]:
        d.plate(x, 8, w, 70, n, m)
        x += w + 14
    d.rb(730, 100, 1730, 180, PUR, (36, 28, 40), 3, 14)
    d.circ(780, 140, 30, PUR, None, 3, "ícone", 13)
    d.rb(830, 118, 1560, 162, GREEN, None, 3, 10, "BARRA DE ENERGIA (comprida)", 18)
    d.t(1580, 126, "valor / máx", 22)
    d.rb(1690, 118, 1722, 162, GOLD, None, 3, 6, "+", 22, off=(8, 8))
    d.t(740, 188, "tempo para a próxima energia: 06:42", 20, PUR)
    xr = 2366
    for i, n in enumerate(["tema", "som", "novo", "sair"]):
        d.rb(xr - 78, 10, xr, 88, RED if i > 1 else GRAY, None, 3, 10, n, 18)
        xr -= 90
    return d.im


def p3():
    d = D(210)
    d.circ(150, 100, 90, BLUE, (20, 40, 60), 5, "avatar", 22)
    d.d.arc((55, 5, 245, 195), -90, 120, fill=GREEN, width=10)
    d.t(60, 190, "anel de XP", 16, GREEN)
    d.circ(228, 168, 28, GOLD, BG, 4, "N", 24)
    d.rb(250, 36, 640, 96, CREAM, BG, 3, 30, "nome do jogador   [classe]", 24, off=(40, 16))
    x = 700
    for n, w, m in [("ENERGIA", 290, True), ("CASH", 200, False), ("OURO", 270, True), ("RANKING", 190, False)]:
        d.rb(x, 36, x + w, 106, PUR, (36, 28, 40), 3, 35)
        d.circ(x + 38, 71, 28, PUR, None, 3, "ícone", 12)
        d.t(x + 78, 44, n, 14, PUR)
        d.t(x + 78, 66, "valor", 24)
        if m:
            d.circ(x + w - 36, 71, 20, GOLD, None, 3, "+", 22)
        x += w + 18
    xr = 2340
    for n in ["tema", "som", "novo", "sair"]:
        d.circ(xr - 32, 70, 32, RED if n in ("novo", "sair") else GRAY, None, 3, n, 14)
        xr -= 76
    return d.im


def p4():
    d = D(190)
    d.rb(34, 4, W - 34, 76, GOLD, BG, 4, 14)
    d.circ(120, 112, 70, BLUE, (20, 40, 60), 5, "avatar", 20)
    d.circ(172, 160, 24, GOLD, BG, 4, "N", 20)
    d.rb(210, 12, 560, 64, CREAM, None, 3, 10, "nome do jogador   [classe]", 20)
    x = 800
    for n, w, m in [("CASH", 230, False), ("OURO", 270, True), ("RANKING", 220, False)]:
        d.plate(x, 8, w, 64, n, m)
        x += w + 20
    d.botoes(W - 60, 12, 48, True, 48)
    d.rb(300, 96, 2100, 176, PUR, (36, 28, 40), 4, 18)
    d.circ(360, 136, 30, PUR, None, 3, "ícone", 13)
    d.rb(410, 112, 1560, 160, GREEN, None, 3, 10, "BARRA DE ENERGIA EM SEGMENTOS (100)", 18)
    d.t(1580, 118, "valor / máx", 24)
    d.t(1760, 120, "próxima em 06:42", 20, PUR)
    d.rb(2020, 118, 2080, 158, GOLD, None, 3, 8, "+", 24, off=(18, 6))
    return d.im


def p5():
    d = D(210)
    d.rb(34, 4, W - 34, 70, GOLD, BG, 4, 14)
    d.circ(90, 37, 26, BLUE, (20, 40, 60), 3, "av.", 14)
    d.rb(130, 14, 480, 58, CREAM, None, 3, 10, "nome do jogador   [classe]", 20)
    d.circ(520, 37, 18, GOLD, None, 3, "N", 16)
    d.rb(550, 24, 1000, 50, GREEN, None, 3, 8, "barra de XP", 16)
    d.botoes(W - 60, 10, 52, False, 56)
    x = 140
    for n, w, m in [("ENERGIA", 520, True), ("CASH", 480, False), ("OURO", 520, True), ("RANKING", 460, False)]:
        d.plate(x, 84, w, 116, n, m)
        x += w + 20
    return d.im


def p6():
    d = D(260)
    d.rb(34, 4, W - 34, 34, GOLD, BG, 4, 10)
    d.t(60, 8, "TRILHO (corda ou barra de couro) de onde tudo pende", 16, GOLD)
    d.rb(70, 34, 440, 240, BLUE, (24, 34, 50), 4, 8)
    d.circ(170, 120, 54, BLUE, None, 3, "avatar", 18)
    d.rb(90, 188, 420, 226, CREAM, None, 3, 8, "nome   [classe]  N", 18)
    x = 700
    for n, w, m in [("ENERGIA", 250, True), ("CASH", 200, False), ("OURO", 250, True), ("RANKING", 200, False)]:
        d.d.line((x + 40, 34, x + 60, 64), fill=GOLD, width=3)
        d.d.line((x + w - 40, 34, x + w - 60, 64), fill=GOLD, width=3)
        d.rb(x, 64, x + w, 200, PUR, (36, 28, 40), 3, 10)
        d.circ(x + w // 2, 108, 30, PUR, None, 3, "ícone", 13)
        d.t(x + 14, 148, n, 14, PUR)
        d.t(x + 14, 168, "valor", 22)
        if m:
            d.rb(x + w - 56, 160, x + w - 12, 192, GOLD, None, 3, 6, "+", 22, off=(14, 4))
        x += w + 40
    xr = 2340
    for n in ["sair", "novo", "som", "tema"]:
        d.rb(xr - 110, 40, xr, 96, RED if n in ("sair", "novo") else GRAY, None, 3, 8, n, 18)
        xr -= 124
    return d.im


def p7():
    d = D(170)
    d.rb(34, 10, 700, 160, BLUE, (24, 34, 50), 4, 14)
    d.rb(54, 24, 190, 146, BLUE, (20, 40, 60), 3, 6, "foto", 18)
    d.rb(210, 28, 670, 64, CREAM, None, 3, 8, "nome do jogador   [classe]", 20)
    d.circ(228, 100, 18, GOLD, None, 3, "N", 16)
    d.rb(256, 88, 670, 112, GREEN, None, 3, 8, "barra de XP", 16)
    d.t(210, 124, "crachá de identificação (papel, clipe, carimbo)", 16, NOTA)
    d.rb(740, 20, 1720, 150, CREAM, (60, 52, 40), 3, 6)
    xs = [740, 985, 1230, 1475]
    for i, (n, m) in enumerate([("ENERGIA", True), ("CASH", False), ("OURO", True), ("RANKING", False)]):
        x = xs[i]
        d.t(x + 14, 28, n, 16, CREAM)
        d.circ(x + 50, 98, 28, PUR, None, 3, "ícone", 12)
        d.t(x + 90, 82, "valor", 26)
        if m:
            d.rb(x + 190, 90, x + 236, 120, GOLD, None, 3, 6, "+", 20, off=(16, 3))
        if i:
            d.d.line((x - 2, 36, x - 2, 140), fill=GRAY, width=2)
    d.t(740, 152, "faixa de papel quadriculada (recibo)", 16, NOTA)
    xr = 2366
    for n in ["sair", "novo", "som", "tema"]:
        w = 112 if n in ("sair", "novo") else 84
        d.rb(xr - w, 40, xr, 124, RED if n in ("sair", "novo") else GRAY, None, 3, 6, n, 18)
        xr -= w + 12
    return d.im


def p8():
    d = D(230)
    d.rb(34, 4, W - 34, 224, GOLD, BG, 4, 16)
    d.circ(130, 100, 70, BLUE, (20, 40, 60), 5, "avatar", 20)
    d.rb(230, 30, 620, 76, CREAM, None, 3, 10, "nome do jogador   [classe]", 20)
    d.circ(248, 114, 20, GOLD, None, 3, "N", 18)
    d.rb(278, 102, 620, 128, GREEN, None, 3, 8, "barra de XP", 16)
    d.t(230, 150, "painel de instrumentos (medidores)", 16, NOTA)
    d.rb(700, 30, 1030, 110, PUR, (36, 28, 40), 3, 10)
    d.t(716, 36, "CASH (hodômetro)", 14, PUR)
    for i in range(7):
        d.rb(720 + i * 42, 62, 756 + i * 42, 100, CREAM, None, 2, 4)
    d.rb(700, 124, 1030, 204, PUR, (36, 28, 40), 3, 10)
    d.t(716, 130, "OURO (hodômetro)", 14, PUR)
    for i in range(7):
        d.rb(720 + i * 42, 156, 756 + i * 42, 194, CREAM, None, 2, 4)
    d.rb(996, 134, 1022, 164, GOLD, None, 3, 6, "+", 18, off=(6, 4))
    d.d.pieslice((1070, 40, 1350, 320), 180, 360, outline=PUR, width=5, fill=(36, 28, 40))
    d.d.line((1210, 180, 1280, 110), fill=GOLD, width=6)
    d.t(1120, 60, "ENERGIA (mostrador)", 16, PUR)
    d.t(1150, 190, "valor / máx", 22)
    d.rb(1292, 186, 1340, 216, GOLD, None, 3, 6, "+", 20, off=(14, 3))
    d.rb(1400, 60, 1700, 160, PUR, (36, 28, 40), 3, 10, "RANKING (placa de pódio)", 16)
    d.circ(1450, 118, 30, PUR, None, 3, "ícone", 13)
    d.t(1500, 100, "#valor", 32)
    xr = 2330
    for n in ["tema", "som", "novo", "sair"]:
        d.rb(xr - 96, 60, xr, 150, RED if n in ("novo", "sair") else GRAY, None, 3, 40)
        d.d.rounded_rectangle((xr - 90, 66, xr - 6, 108), radius=20, outline=GRAY, width=2)
        d.t(xr - 82, 118, n, 18, RED if n in ("novo", "sair") else GRAY)
        xr -= 108
    d.t(1780, 180, "botões como interruptores", 16, NOTA)
    return d.im


def p9():
    d = D(120)
    d.circ(76, 60, 50, BLUE, (20, 40, 60), 4, "avatar", 16)
    d.circ(110, 96, 16, GOLD, BG, 3, "N", 14)
    d.t(140, 20, "nome do jogador   [classe]", 22)
    d.rb(140, 56, 420, 76, GREEN, None, 3, 8, "barra de XP", 14)
    x = 800
    for n, w, m in [("ENERGIA", 250, True), ("CASH", 190, False), ("OURO", 230, True), ("RANKING", 170, False)]:
        d.rb(x, 24, x + w, 80, PUR, None, 2, 28)
        d.circ(x + 34, 52, 22, PUR, None, 2, "ícone", 11)
        d.t(x + 66, 34, "valor", 24)
        if m:
            d.circ(x + w - 28, 52, 15, GOLD, None, 3, "+", 18)
        d.t(x + 10, 84, n, 12, PUR)
        x += w + 20
    xr = 2350
    for n in ["sair", "novo", "som", "tema"]:
        d.circ(xr - 24, 50, 24, RED if n in ("sair", "novo") else GRAY, None, 2, "", 12)
        d.t(xr - 52, 80, n, 12, GRAY)
        xr -= 62
    d.t(34, 100, "SEM faixa de fundo: peças soltas sobre a cena", 14, NOTA)
    return d.im


def p10():
    d = D(240)
    cx = W // 2
    d.d.pieslice((cx - 190, 4, cx + 190, 400), 180, 360, outline=GOLD, width=5, fill=BG)
    d.circ(cx, 100, 80, BLUE, (20, 40, 60), 5, "avatar", 20)
    d.circ(cx + 78, 156, 26, GOLD, BG, 4, "N", 20)
    d.rb(cx - 200, 192, cx + 200, 236, CREAM, BG, 3, 10, "nome do jogador   [classe]", 20)
    d.rb(cx - 150, 168, cx - 40, 188, GREEN, None, 3, 6, "barra de XP", 12, off=(4, 2))
    d.plate(cx - 760, 30, 300, 80, "ENERGIA", True)
    d.plate(cx - 440, 30, 220, 80, "CASH", False)
    d.plate(cx + 220, 30, 300, 80, "OURO", True)
    d.plate(cx + 540, 30, 220, 80, "RANKING", False)
    d.t(cx - 760, 120, "esquerda: energia e cash   |   direita: ouro e ranking", 16, NOTA)
    xl = 60
    for n in ["tema", "som"]:
        d.rb(xl, 30, xl + 84, 100, GRAY, None, 3, 10, n, 18)
        xl += 96
    xr = 2340
    for n, w in [("sair", 100), ("novo", 120)]:
        d.rb(xr - w, 30, xr, 100, RED, None, 3, 10, n, 18)
        xr -= w + 12
    return d.im


DESENHOS = [
    (1, "Clássico compacto", "faixa de couro baixa: avatar, recursos no centro, botões à direita (o atual, refinado)", p1),
    (2, "Estilo GGG: retrato grande", "retrato alto com XP vertical; recursos em cima e barra de energia comprida embaixo", p2),
    (3, "Medalhão com anel de XP", "avatar em medalhão redondo que vaza da faixa; recursos em pílulas; botões redondos", p3),
    (4, "Energia em destaque", "linha de energia larga e segmentada; cash, ouro e ranking em fichas pequenas em cima", p4),
    (5, "Dois andares", "andar fino (perfil e botões) e andar com 4 placas grandes de recursos", p5),
    (6, "Cartões pendurados", "trilho em cima; retrato e recursos pendem como etiquetas; botões como abas", p6),
    (7, "Crachá e recibo", "crachá de identificação à esquerda; faixa de papel com os recursos; botões de latão", p7),
    (8, "Painel de instrumentos", "mostrador para energia, hodômetros para cash e ouro, pódio e botões interruptor", p8),
    (9, "Peças soltas, sem faixa", "sem fundo: avatar, pílulas e botões flutuam sobre a cena; o mais limpo", p9),
    (10, "Letreiro simétrico art déco", "arco central com o retrato; recursos em duas asas; botões nos cantos", p10),
]


def folha(idx, itens):
    ims = [(n, nome, desc, f()) for (n, nome, desc, f) in itens]
    h = sum(im.height + 70 for (_, _, _, im) in ims) + 20
    sheet = Image.new("RGB", (W, h), (8, 7, 6))
    d = ImageDraw.Draw(sheet)
    y = 10
    for n, nome, desc, im in ims:
        d.text((34, y), f"{n} · {nome}", font=F(30), fill=GOLD)
        d.text((34 + d.textlength(f"{n} · {nome}", font=F(30)) + 24, y + 8), desc, font=F(20), fill=NOTA)
        sheet.paste(im, (0, y + 44))
        y += im.height + 70
    sheet.save(rf"C:\Users\Rodrigo Cipolli\Desktop\NewGame\docs\arte\hud_prototipos_{idx}.png")


folha(1, DESENHOS[:5])
folha(2, DESENHOS[5:])
print("ok")
