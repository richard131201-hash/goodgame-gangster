# Esquemas de posições (wireframes) para a IA redesenhar a Ficha. Gera 4 opções de layout em docs/arte/.
# Todos em 2200 x 1000 (proporção ~2,2:1 = área disponível do jogo sem a coluna lateral). A "área livre" (equipamento de
# duelo: consumíveis, coletes, bombas...) tem sempre o mesmo tamanho (840 x 450).
from PIL import Image, ImageDraw, ImageFont
W, H = 2200, 1000
FONT = r"C:\Windows\Fonts\arialbd.ttf"
F = lambda s: ImageFont.truetype(FONT, s)
GOLD, CREAM, BLUE, GREEN, RED, PUR, GRAY = (212, 175, 55), (241, 227, 191), (90, 170, 230), (95, 200, 120), (230, 100, 90), (190, 130, 230), (150, 150, 150)
SZ = dict(R=(300, 345), A=(410, 330), W=(285, 220), F=(840, 450), SLOT_E=(184, 138), SLOT_M=(190, 142))
G = 10  # espaço entre slots


class Canvas:
    def __init__(self, titulo):
        self.im = Image.new("RGB", (W, H), (24, 22, 26))
        self.d = ImageDraw.Draw(self.im)
        self.boxes = []
        self.d.text((30, 6), titulo, font=F(20), fill=(120, 120, 130))

    def box(self, name, x, y, w, h, col, fill, label, fs=22):
        self.boxes.append((name, x, y, x + w, y + h))
        self.d.rounded_rectangle((x, y, x + w, y + h), radius=12, outline=col, width=4, fill=fill)
        self.d.text((x + 10, y + 6), label, font=F(fs), fill=col)

    def title(self, x, y, text):
        self.d.text((x, y), text, font=F(24), fill=CREAM)

    def retrato(self, x, y):
        self.title(x, y - 32, "RETRATO"); self.box("R", x, y, *SZ["R"], BLUE, (20, 40, 60), "foto do avatar + nome/nível", 20)

    def atributos(self, x, y, w=None):
        self.title(x, y - 32, "ATRIBUTOS"); w0, h = SZ["A"]; w = w or w0
        self.box("A", x, y, w, h, GREEN, (24, 40, 30), "")
        for i, n in enumerate(["Ataque", "Vida", "Astúcia", "Tenacidade"]):
            yy = y + 16 + i * 74
            self.d.rounded_rectangle((x + 14, yy, x + w - 14, yy + 62), radius=10, outline=GREEN, width=3)
            self.d.text((x + 26, yy + 18), n + "          (valor)    [+]", font=F(22), fill=GREEN)

    def arma(self, x, y):
        self.title(x, y - 32, "ARMA"); self.box("W", x, y, *SZ["W"], RED, (60, 30, 28), "slot da arma 4:3", 20)

    def livre(self, x, y):
        self.title(x, y - 32, "ÁREA LIVRE")
        w, h = SZ["F"]
        self.boxes.append(("F", x, y, x + w, y + h))
        self.d.rounded_rectangle((x, y, x + w, y + h), radius=12, outline=GRAY, width=4, fill=(40, 40, 44))
        for k in range(-h, w, 26):
            self.d.line((x + max(k, 0), y + max(-k, 0), x + min(k + h, w), y + min(h, w - k)), fill=(60, 60, 66), width=2)
        self.d.text((x + 24, y + h // 2 - 40), "ÁREA LIVRE (sem desenho)", font=F(30), fill=(200, 200, 205))
        self.d.text((x + 24, y + h // 2), "equipamento de duelo: consumíveis, coletes, bombas...", font=F(24), fill=(170, 170, 176))
        self.d.text((x + 24, y + h // 2 + 40), f"tamanho fixo: {w} x {h} px", font=F(22), fill=(140, 140, 146))

    def equip(self, x, y, cols, rows, nomes):
        w, h = SZ["SLOT_E"]
        self.title(x, y - 32, "EQUIPAMENTO")
        for i, n in enumerate(nomes):
            c, r = (i % cols, i // cols) if cols * rows == 8 else (0, i)
            xx, yy = x + c * (w + G), y + r * (h + G)
            self.box(f"E{i}", xx, yy, w, h, PUR, (44, 34, 52), "", 20)
            self.d.text((xx + 12, yy + 8), n, font=F(20), fill=PUR)
            self.d.text((xx + w // 2 - 50, yy + h // 2 - 8), "slot 4:3", font=F(20), fill=PUR)

    def equip_pos(self, pos, nomes):
        w, h = SZ["SLOT_E"]
        for (xx, yy), n in zip(pos, nomes):
            self.box(f"E{n}", xx, yy, w, h, PUR, (44, 34, 52), "", 20)
            self.d.text((xx + 12, yy + 8), n, font=F(20), fill=PUR)
            self.d.text((xx + w // 2 - 50, yy + h // 2 - 8), "slot 4:3", font=F(20), fill=PUR)

    def mala(self, x, y, cols, rows, tabs_on=True, slot=None):
        w, h = slot or SZ["SLOT_M"]
        tabs = ["MALA", "FAMÍLIA", "CONQUISTAS", "HONRA"] if tabs_on else []; xx = x
        if not tabs_on:
            self.title(x, y - 32, "MALA")
        for t in tabs:
            tw = 140 if t != "CONQUISTAS" else 190
            if cols == 3: tw = 140 if t == "MALA" else 120 if t == "HONRA" else 148 if t == "FAMÍLIA" else 150
            self.d.rounded_rectangle((xx, y - 44, xx + tw, y), radius=10, outline=GOLD, width=4)
            self.d.text((xx + 12, y - 34), t, font=F(18), fill=GOLD); xx += tw + 8
        n = 0
        for r in range(rows):
            for c in range(cols):
                locked = n >= 10
                px, py = x + c * (w + G), y + r * (h + G)
                self.box(f"M{n}", px, py, w, h, GRAY if locked else BLUE, (46, 40, 36) if locked else (22, 40, 60), "", 20)
                self.d.text((px + 10, py + 8), "BLOQUEADO" if locked else "slot da mala", font=F(18), fill=GRAY if locked else BLUE)
                n += 1

    def pastas(self, retangulos):
        for (x, y, w, h) in retangulos:
            self.d.rounded_rectangle((x, y, x + w, y + h), radius=22, outline=(110, 85, 40), width=3)

    def salvar(self, nome):
        # confere sobreposição e limites
        for i, (n1, a0, b0, a1, b1) in enumerate(self.boxes):
            assert 0 <= a0 and 0 <= b0 and a1 <= W and b1 <= H, (nome, n1, a0, b0, a1, b1)
            for (n2, c0, d0, c1, d1) in self.boxes[i + 1:]:
                assert a1 <= c0 or c1 <= a0 or b1 <= d0 or d1 <= b0, (nome, "sobrepõe", n1, n2)
        compor(self.im, nome)


SW, SH = 2400, 1350  # tela inteira do jogo (16:9), 22,97 px por rem


def compor(sub, nome):
    """Monta a TELA INTEIRA: topo (perfil, recursos, botões), título e carimbo da pasta, o layout escolhido e a barra de botões."""
    im = Image.new("RGB", (SW, SH), (14, 12, 10))
    d = ImageDraw.Draw(im)

    def caixa(x0, y0, x1, y1, col, texto="", fs=22, fill=None, w=3, r=14):
        d.rounded_rectangle((x0, y0, x1, y1), radius=r, outline=col, width=w, fill=fill)
        if texto:
            d.text((x0 + 10, y0 + 6), texto, font=F(fs), fill=col)

    # --- topo (HUD): 5,2 rem de altura ---
    caixa(34, 23, SW - 34, 142, GOLD, "", 20, (30, 24, 18), 4, 16)
    d.text((600, 28), "TOPO (HUD)", font=F(16), fill=(150, 130, 70))
    d.ellipse((58, 40, 141, 123), outline=BLUE, width=4, fill=(20, 40, 60))
    d.text((72, 70), "avatar", font=F(18), fill=BLUE)
    caixa(160, 44, 470, 86, CREAM, "nome do jogador   [classe]", 20)
    d.ellipse((160, 96, 198, 134), outline=GOLD, width=3)
    d.text((171, 104), "N", font=F(18), fill=GOLD)
    caixa(206, 102, 470, 128, GREEN, "barra de XP", 18)
    cards = [("ENERGIA", 266, True), ("CASH", 161, False), ("OURO", 243, True), ("RANKING", 147, False)]
    x = 760
    for nome_c, w, mais in cards:
        caixa(x, 40, x + w, 126, PUR, "", 20, (36, 28, 40), 3, 12)
        d.ellipse((x + 12, 52, x + 62, 102), outline=PUR, width=3)
        d.text((x + 72, 56), nome_c, font=F(14), fill=PUR)
        d.text((x + 72, 82), "valor", font=F(24), fill=CREAM)
        if mais:
            caixa(x + w - 62, 70, x + w - 14, 100, GOLD, "+", 22, None, 3, 6)
        x += w + 16
    xr = SW - 34 - 25
    for texto, w in [("Sair", 100), ("Novo Gangster", 190), ("som", 60), ("tema", 60)]:
        caixa(xr - w, 50, xr, 104, RED if w > 60 else GRAY, texto, 20, None, 3, 10)
        xr -= w + 12
    # --- título da pasta e carimbo ---
    caixa(110, 154, 690, 208, GOLD, "ABA DO TÍTULO DA PASTA  (FICHA · NOME)", 20, None, 4, 12)
    caixa(1980, 150, 2330, 206, RED, "CARIMBO (texto da pasta)", 20, None, 3, 8)
    # --- layout escolhido (2200 x 1000 -> 2260 x 1027) ---
    k = 1.027
    sub2 = sub.resize((int(2200 * k), int(1000 * k)), Image.LANCZOS)
    im.paste(sub2, ((SW - sub2.width) // 2, 212))
    # --- barra de botões flutuante, embaixo no centro ---
    bw, bh = 1107, 101
    bx, by = (SW - bw) // 2, SH - bh - 2
    caixa(bx, by, bx + bw, by + bh, GOLD, "", 20, (30, 24, 18), 4, 18)
    nomes_b = ["Ficha", "Missões", "Duelo", "Mercado", "Ranking", "Família", "Distritos", "Tarefas", "Eventos", "Simulador"]
    for i, n in enumerate(nomes_b):
        xx = bx + 18 + i * (99 + 9)
        up = 9 if i == 0 else 0
        caixa(xx, by + 14 - up, xx + 99, by + 14 - up + 76, CREAM if i == 0 else GRAY, "", 18, None, 3, 10)
        d.ellipse((xx + 33, by + 22 - up, xx + 66, by + 55 - up), outline=PUR, width=2)
        d.text((xx + 10, by + 58 - up), n, font=F(15), fill=CREAM if i == 0 else GRAY)
    d.text((bx + 20, by - 30), "BARRA DE BOTÕES (10) · botão ativo levantado · nome em balão ao passar o mouse", font=F(20), fill=GOLD)
    d.text((34, SH - 30), f"TELA INTEIRA · layout {nome} · 2400 x 1350 (16:9)", font=F(18), fill=(120, 120, 130))
    im.save(rf"C:\Users\Rodrigo Cipolli\Desktop\NewGame\docs\arte\ficha_tela_{nome}.png")


NOMES = ["CHAPÉU", "PEITORAL", "CALÇA", "CALÇADO", "AMULETO", "PET", "RELÍQUIA", "VEÍCULO"]

# A: faixa de cima com personagem, atributos, arma e equipamento; embaixo, Mala e a área livre lado a lado
c = Canvas("OPÇÃO A · Duas faixas: personagem em cima, Mala e área livre embaixo")
c.retrato(30, 64); c.atributos(360, 64); c.arma(800, 64); c.equip(1115, 64, 4, 2, NOMES)
c.mala(30, 540, 5, 3); c.livre(1070, 496)
c.salvar("A")

# B: esquerda = personagem + área livre; direita = arma + equipamento + Mala
c = Canvas("OPÇÃO B · Esquerda: personagem e área livre · Direita: arma, equipamento e Mala")
c.retrato(30, 64); c.atributos(360, 64); c.livre(30, 484)
c.arma(940, 64); c.equip(1260, 64, 4, 2, NOMES); c.mala(940, 484, 5, 3)
c.salvar("B")

# C: três colunas: personagem | Mala vertical | área livre + equipamento
c = Canvas("OPÇÃO C · Três colunas: personagem · Mala vertical · área livre e equipamento")
c.retrato(30, 64); c.arma(360, 64); c.atributos(30, 450)
c.mala(700, 110, 3, 5); c.livre(1330, 64); c.equip(1330, 560, 4, 2, NOMES)
c.salvar("C")

# D: boneco no centro com os 8 equipamentos ao redor (estilo ficha de RPG)
c = Canvas("OPÇÃO D · Boneco com os 8 equipamentos ao redor · área livre ao centro · Mala vertical à direita")
w, h = SZ["SLOT_E"]
xs_l, xs_r = 30, 30 + w + 14 + SZ["R"][0] + 14
c.retrato(30 + w + 14, 64)
pos = [(xs_l, 64 + i * (h + G)) for i in range(4)] + [(xs_r, 64 + i * (h + G)) for i in range(4)]
c.equip_pos(pos, NOMES)
c.arma(30 + w + 14 - 0, 450)
c.atributos(740, 64)
c.livre(740, 450)
c.mala(1600, 110, 3, 5)
c.salvar("D")

# C3 (estilo 2 revisado): 3 colunas x 2 linhas; atributos largos ao lado do retrato; arma embaixo do retrato; Mala horizontal;
# sem abas na Mala (Família, Conquistas e Honra saem por ora)
c = Canvas("OPÇÃO C3 · 3 colunas: retrato/arma · atributos/Mala · equipamento/área livre (sem abas)")
c.retrato(30, 64); c.atributos(360, 64, 960); c.equip(1350, 64, 4, 2, NOMES)
c.arma(30, 473); c.mala(360, 473, 5, 3, False, (184, 138)); c.livre(1350, 473)
c.salvar("C3")
print("ok")
