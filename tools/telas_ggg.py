# Telas completas com o topo estilo GGG: card grande no canto superior esquerdo, recursos centralizados em cima, botões no canto direito.
# Gera docs/arte/tela_ggg_ficha.png e docs/arte/tela_ggg_missoes.png. Uso: python -I tools/telas_ggg.py
from PIL import Image, ImageDraw

BASE = r"C:\Users\Rodrigo Cipolli\Desktop\NewGame"
_src = open(BASE + r"\tools\telas_prototipos.py", encoding="utf8").read()
_src = _src[:_src.index("# número, nome, topo")]
ns = {"__name__": "mod"}
exec(compile(_src, "telas_prototipos", "exec"), ns)
SUBS, nav, F = ns["SUBS"], ns["nav"], ns["F"]
W, H = 2400, 1350
GOLD, CREAM, BLUE, GREEN, RED, PUR, GRAY, BG = (212, 175, 55), (241, 227, 191), (90, 170, 230), (95, 200, 120), (230, 100, 90), (190, 130, 230), (150, 150, 150), (30, 24, 18)
NOTA = (170, 170, 176)


def rb(d, x0, y0, x1, y1, col, fill=None, w=3, r=12, label="", fs=20, off=(10, 6)):
    d.rounded_rectangle((x0, y0, x1, y1), radius=r, outline=col, width=w, fill=fill)
    if label:
        d.text((x0 + off[0], y0 + off[1]), label, font=F(fs), fill=col)


def topo(d):
    """Card grande no canto, recursos no centro, botões no canto direito (sem faixa de fundo)."""
    # card do perfil
    rb(d, 40, 16, 233, 227, BLUE, (20, 40, 60), 5, 12)
    d.text((70, 70), "FOTO DO", font=F(24), fill=BLUE)
    d.text((70, 100), "PERSONAGEM", font=F(24), fill=BLUE)
    rb(d, 48, 180, 225, 219, CREAM, (34, 28, 22), 3, 8, "nome do jogador", 18, (8, 8))
    d.text((52, 160), "classe", font=F(16), fill=GOLD)
    # azul: nome, classe, nível e XP, ao lado do card
    rb(d, 262, 22, 560, 66, CREAM, None, 3, 8, "nome do jogador", 22)
    rb(d, 574, 28, 690, 60, GOLD, None, 3, 6, "classe", 18)
    d.ellipse((262, 74, 308, 120), outline=GOLD, width=4, fill=BG)
    d.text((274, 84), "N", font=F(24), fill=GOLD)
    rb(d, 320, 82, 690, 112, GREEN, None, 3, 8, "barra de XP  603 / 2520", 18, (10, 4))
    # recursos no centro
    x = 740
    for nome, w, mais in [("energia", 250, True), ("cash", 200, False), ("ouro", 230, True), ("ranking", 170, False)]:
        rb(d, x, 22, x + w, 100, PUR, (36, 28, 40), 3, 14)
        d.ellipse((x + 10, 34, x + 66, 90), outline=PUR, width=3)
        d.text((x + 20, 53), "ico", font=F(14), fill=PUR)
        d.text((x + 78, 32), nome, font=F(14), fill=PUR)
        d.text((x + 78, 54), "valor", font=F(28), fill=CREAM)
        if mais:
            rb(d, x + w - 48, 44, x + w - 12, 76, GOLD, None, 3, 6, "+", 22, off=(11, 3))
        x += w + 18
    # botões do canto direito
    xr = W - 40
    for texto, w in [("Sair", 100), ("Novo Gangster", 190), ("som", 60), ("tema", 60)]:
        rb(d, xr - w, 26, xr, 82, RED if w > 60 else GRAY, None, 3, 10, texto, 20)
        xr -= w + 12


def titulo(d, texto, x0):
    rb(d, x0, 124, x0 + 580, 174, GOLD, None, 4, 12)
    d.text((x0 + 14, 136), texto, font=F(20), fill=GOLD)
    rb(d, 1980, 124, 2330, 174, RED, None, 3, 8)
    d.text((1994, 136), "CARIMBO (texto da pasta)", font=F(20), fill=RED)


def tela(nome, conteudo, tit, nota):
    im = Image.new("RGB", (W, H), (14, 12, 10))
    d = ImageDraw.Draw(im)
    titulo(d, tit, 300)
    nav_h = nav(d, 2)
    top = 180
    avail = H - nav_h - 10 - top
    if conteudo == "ficha":
        k = min(2330 / 2200, avail / 1000)
        sub = SUBS["C6"].resize((int(2200 * k), int(1000 * k)), Image.LANCZOS)
        im.paste(sub, ((W - sub.width) // 2, top))
    else:
        rb(d, 35, top, W - 35, top + avail, GOLD, (34, 28, 22), 4, 14)
        d.text((300, top + 14), "CENA DE MISSÕES: fundo ilustrado + 3 chefões (a missão aparece ao passar o mouse)", font=F(24), fill=GOLD)
        for i, (n, tam) in enumerate([("Chefão leve", 0.46), ("Chefão médio", 0.53), ("Chefão pesado", 0.62)]):
            cx = 35 + int((W - 70) * (0.30 + 0.25 * i))
            h = int(avail * tam); b = top + avail - 70
            rb(d, cx - 110, b - h, cx + 110, b, BLUE, (22, 40, 60), 3, 24)
            t = d.textlength(n, font=F(24)); d.text((cx - t / 2, b - h // 2), n, font=F(24), fill=BLUE)
    topo(d)  # o card fica POR CIMA da pasta, como no GGG
    d.text((1990, H - 150), nome, font=F(26), fill=GOLD)
    for j, linha in enumerate(__import__("textwrap").wrap(nota, 40)):
        d.text((1990, H - 116 + j * 20), linha, font=F(15), fill=NOTA)
    im.save(rf"{BASE}\docs\arte\{nome}.png")


tela("tela_ggg_ficha", "ficha", "ABA DO TÍTULO (FICHA · NOME)", "Ficha: o card sobe para o canto do topo; atributos embaixo do card; nome, classe, nível e XP ao lado do card; arma e equipamento ao lado; Mala e área livre embaixo")
tela("tela_ggg_missoes", "missoes", "ABA DO TÍTULO (MISSÕES DO DON)", "Outras abas: o mesmo topo; o card grande fica por cima do canto da pasta")
print("ok")
