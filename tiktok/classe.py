# Intro : salle de classe, Mac au loin, élève qui clique, travelling avant jusqu'à l'écran (Parcoursup)
import math, random
from PIL import Image, ImageDraw, ImageFilter
from make_v2 import W, H, BOLD, MED, REG, font, ease, lin, prog, GOLD, WHITE, BG

SS = 2
CW, CH = W * SS, H * SS          # 2160 x 3840 (espace « canevas »)
VPX, VPY = 1080, 1450
FLOOR, CEIL, HALF = 2390, -1700, 1080
SB = 0.42                         # profondeur du mur du fond
DESK = 1370                       # hauteur du plateau (y monde)
SCR_S = 0.60                      # profondeur de l'écran du portable
SX0, SX1 = 1080 - 180 * SCR_S, 1080 + 180 * SCR_S
SY0, SY1 = VPY + (DESK - 230) * SCR_S, VPY + DESK * SCR_S
DW, DH = 2000, 1250               # espace de dessin de l'écran


def P(xw, yw, s):
    return (VPX + xw * s, VPY + yw * s)


def smooth(a, b, t0, t1, t):
    k = lin((t - t0) / (t1 - t0))
    k = k * k * (3 - 2 * k)
    return a + (b - a) * k


def camera(t):
    """zoom de sortie z (px sortie / px canevas) et centre c (canevas)"""
    z, cx, cy = 0.5, 1080, 1920
    z = smooth(z, 0.6, 0.0, 2.0, t)
    cy = smooth(cy, 1980, 0.0, 2.0, t)
    zs = 1000 / (SX1 - SX0)
    scx, scy = (SX0 + SX1) / 2, (SY0 + SY1) / 2
    z = smooth(z, zs, 2.1, 4.1, t) if t >= 2.1 else z
    if t >= 2.1:
        k = lin((t - 2.1) / 2.0); k = k * k * (3 - 2 * k)
        # la position suit le zoom (en log) pour un travelling naturel
        lz = (math.log(z) - math.log(0.6)) / (math.log(zs) - math.log(0.6))
        cx = 1080 + (scx - 1080) * lz
        cy = 1980 + (scy - 1980) * lz
    if t >= 4.1:
        z = zs * (1 + 0.04 * (t - 4.1) / 3.3)
    # zoom final sur la question
    qx, qy = SX0 + 1000 / DW * (SX1 - SX0), SY0 + 930 / DH * (SY1 - SY0)
    if t >= 7.8:
        k = lin((t - 7.8) / 0.8); k = k ** 2.2
        z = z * (1 + 5 * k)
        cx = cx + (qx - cx) * min(1, k * 2.5)
        cy = cy + (qy - cy) * min(1, k * 2.5)
    return z, cx, cy


# ---------- interface de l'écran (dessinée en 2000 x 1250) ----------
NAVY = (22, 38, 88)


def cursor(d, x, y, sc=1.0, pressed=False):
    pts = [(0, 0), (0, 62), (16, 48), (28, 76), (40, 70), (28, 44), (50, 44)]
    k = sc * (0.9 if pressed else 1.0)
    d.polygon([(x + a * k, y + b * k) for a, b in pts], fill=(20, 20, 24), outline=(255, 255, 255), width=4)


def screen_ui(t):
    im = Image.new("RGB", (DW, DH), (14, 16, 24))
    d = ImageDraw.Draw(im)
    if t < 1.95:
        d.polygon([(1200, 0), (1500, 0), (900, DH), (600, DH)], fill=(24, 27, 38))
        return im
    wake = lin((t - 1.95) / 0.35)
    # navigateur
    d.rectangle((0, 0, DW, DH), fill=(246, 247, 250))
    d.rectangle((0, 0, DW, 120), fill=(226, 229, 236))
    for i, c in enumerate([(255, 95, 87), (255, 189, 46), (40, 200, 64)]):
        d.ellipse((40 + i * 52, 42, 76 + i * 52, 78), fill=c)
    d.rounded_rectangle((260, 26, 1740, 96), 35, fill=(255, 255, 255))
    url = "parcoursup.gouv.fr"
    n = int(max(0, t - 4.15) * 15)
    f = font(MED, 40)
    if n <= 0:
        d.text((310, 61), "Rechercher ou saisir une adresse", font=f, fill=(150, 155, 168), anchor="lm")
    else:
        s = url[:n]
        d.text((310, 61), s, font=f, fill=(30, 32, 40), anchor="lm")
        if n < len(url) and int(t * 4) % 2 == 0:
            w = f.getlength(s)
            d.rectangle((314 + w, 38, 318 + w, 84), fill=(30, 32, 40))
    pl = lin((t - 5.35) / 0.35)
    if 0 < pl < 1:
        d.rectangle((0, 116, int(DW * pl), 122), fill=(60, 120, 255))
    if t >= 5.6:
        pg = lin((t - 5.6) / 0.25)
        d.rectangle((0, 122, DW, 250), fill=NAVY)
        d.text((80, 186), "Parcoursup", font=font(BOLD, 60), fill=WHITE, anchor="lm")
        d.text((DW - 80, 186), "Session 2027", font=font(MED, 40), fill=(190, 200, 230), anchor="rm")
        clicked = t >= 6.75
        if not clicked:
            d.text((DW // 2, 420), "Inscriptions et vœux", font=font(BOLD, 110), fill=(20, 24, 40), anchor="mm")
            d.text((DW // 2, 545), "Ouverture le 18 janvier 2027", font=font(BOLD, 60), fill=(200, 60, 80), anchor="mm")
            d.text((DW // 2, 630), "Dernier jour pour formuler tes vœux : 11 mars 2027", font=font(REG, 44), fill=(90, 95, 115), anchor="mm")
            pr = 6.6 <= t < 6.8
            bw, bh = (560, 140) if not pr else (540, 134)
            d.rounded_rectangle((DW // 2 - bw // 2, 820 - bh // 2, DW // 2 + bw // 2, 820 + bh // 2), 70,
                                fill=(14, 26, 66) if pr else NAVY)
            d.text((DW // 2, 820), "Je m'inscris", font=font(BOLD, 56), fill=WHITE, anchor="mm")
        else:
            d.text((140, 360), "Mes vœux", font=font(BOLD, 90), fill=(20, 24, 40), anchor="lm")
            d.rounded_rectangle((140, 440, DW - 140, 700), 36, outline=(200, 205, 218), width=6)
            d.text((DW // 2, 570), "0 vœu formulé", font=font(MED, 56), fill=(150, 155, 170), anchor="mm")
            ws = "Tu sais déjà quoi demander ?".split(" ")
            fq = font(BOLD, 96)
            tot = sum(fq.getlength(w) for w in ws) + fq.getlength(" ") * (len(ws) - 1)
            x = DW / 2 - tot / 2
            for i, w in enumerate(ws):
                p = lin((t - 7.0 - i * 0.07) / 0.25)
                if p > 0:
                    c = (200, 60, 80) if i >= 3 else (20, 24, 40)
                    d.text((x, 930 + (1 - p) * 40), w, font=fq, fill=c, anchor="lm")
                x += fq.getlength(w) + fq.getlength(" ")
        # curseur
        if t >= 5.8:
            k = lin((t - 5.9) / 0.7); k = k * k * (3 - 2 * k)
            x = 1560 + (DW // 2 + 60 - 1560) * k
            y = 1120 + (835 - 1120) * k
            k2 = lin((t - 6.85) / 0.4); k2 = k2 * k2 * (3 - 2 * k2)
            x += (1780 - x) * k2
            y += (1170 - y) * k2
            cursor(d, x, y, 1.6, 6.6 <= t < 6.8)
        if pg < 1:
            ov = Image.new("RGB", (DW, DH - 122), (246, 247, 250))
            im.paste(Image.blend(im.crop((0, 122, DW, DH)), ov, 1 - pg), (0, 122))
    if wake < 1:
        im = Image.blend(Image.new("RGB", (DW, DH), (14, 16, 24)), im, wake)
    return im


# ---------- décor ----------
random.seed(7)
DUST = [(random.uniform(-900, -100), random.uniform(-600, 1800), random.uniform(0.5, 0.95), random.uniform(3, 7), random.random() * 6) for _ in range(40)]
GLOW = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
ImageDraw.Draw(GLOW).ellipse((60, 60, 340, 340), fill=(170, 200, 255, 120))
GLOW = GLOW.filter(ImageFilter.GaussianBlur(45))


def desk(d, M, xc, s, col_top=(176, 140, 100), col_front=(138, 106, 76)):
    sb = s * 0.9
    hw = 300
    tl, tr = M(P(xc - hw, DESK, s)), M(P(xc + hw, DESK, s))
    bl, br = M(P(xc - hw, DESK, sb)), M(P(xc + hw, DESK, sb))
    for lx in (xc - hw + 30, xc + hw - 30):
        for ss_ in (s, sb):
            a, b = M(P(lx, DESK, ss_)), M(P(lx, FLOOR, ss_))
            d.line((a, b), fill=(58, 60, 72), width=max(1, int(16 * s * Mz[0])))
    d.polygon([tl, tr, br, bl], fill=col_top)
    fl, fr = M(P(xc - hw, DESK + 70, s)), M(P(xc + hw, DESK + 70, s))
    d.polygon([tl, tr, fr, fl], fill=col_front)


Mz = [1.0]


def draw_classe(t):
    z, cx, cy = camera(t)
    Z = z * SS
    Mz[0] = Z
    M = lambda p: ((p[0] - cx) * Z + CW / 2, (p[1] - cy) * Z + CH / 2)
    im = Image.new("RGBA", (CW, CH), (30, 36, 58, 255))
    d = ImageDraw.Draw(im)
    # sol, murs, plafond
    BLc, BRc = P(-HALF, FLOOR, SB), P(HALF, FLOOR, SB)
    TLc, TRc = P(-HALF, CEIL, SB), P(HALF, CEIL, SB)
    far = 0.05
    d.polygon([M(P(-HALF, FLOOR, 3)), M(P(HALF, FLOOR, 3)), M(BRc), M(BLc)], fill=(96, 72, 56))
    for i in range(-10, 11):  # lames de parquet
        d.line((M(P(i * 220, FLOOR, 3)), M(P(i * 220, FLOOR, SB))), fill=(80, 60, 46), width=max(1, int(3 * Z)))
    d.polygon([M(P(-HALF, CEIL, 3)), M(P(-HALF, FLOOR, 3)), M(BLc), M(TLc)], fill=(46, 54, 84))
    d.polygon([M(P(HALF, CEIL, 3)), M(P(HALF, FLOOR, 3)), M(BRc), M(TRc)], fill=(40, 47, 74))
    d.polygon([M(P(-HALF, CEIL, 3)), M(P(HALF, CEIL, 3)), M(TRc), M(TLc)], fill=(28, 33, 54))
    d.polygon([M(TLc), M(TRc), M(BRc), M(BLc)], fill=(56, 66, 98))
    # plinthe
    d.line((M(BLc), M(BRc)), fill=(36, 40, 60), width=max(1, int(10 * Z)))
    # tableau
    bx0, by0 = P(-760, -560, SB); bx1, by1 = P(760, 520, SB)
    d.rectangle((M((bx0 - 10, by0 - 10)), M((bx1 + 10, by1 + 10))), fill=(120, 92, 62))
    d.rectangle((M((bx0, by0)), M((bx1, by1))), fill=(36, 64, 56))
    fs = max(1, int(70 * SB * Z))
    d.text(M(P(0, -330, SB)), "ORIENTATION", font=font(MED, fs), fill=(225, 232, 228), anchor="mm")
    d.text(M(P(0, -70, SB)), "Parcoursup 2027 ?", font=font(REG, max(1, int(110 * SB * Z))), fill=(210, 220, 215), anchor="mm")
    d.line((M(P(-420, 90, SB)), M(P(420, 90, SB))), fill=(200, 210, 205), width=max(1, int(4 * Z)))
    # fenêtres (mur gauche) + néons
    for (s0, s1) in [(2.2, 1.5), (1.25, 0.95), (0.82, 0.66), (0.6, 0.5)]:
        q = [M(P(-HALF, -1100, s0)), M(P(-HALF, -1100, s1)), M(P(-HALF, 300, s1)), M(P(-HALF, 300, s0))]
        d.polygon(q, fill=(150, 185, 230))
        mx = [M(P(-HALF, -400, s0)), M(P(-HALF, -400, s1))]
        d.line(mx, fill=(90, 100, 130), width=max(1, int(8 * Z)))
    for s0 in (1.6, 0.95, 0.66, 0.5):
        q = [M(P(-260, CEIL, s0)), M(P(260, CEIL, s0)), M(P(260, CEIL, s0 * 0.9)), M(P(-260, CEIL, s0 * 0.9))]
        d.polygon(q, fill=(230, 235, 245))
    # faisceaux de lumière
    ov = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for (s0, s1) in [(1.25, 0.95), (0.82, 0.66)]:
        q = [M(P(-HALF, -1100, s0)), M(P(-HALF, -1100, s1)), M(P(200, FLOOR, s1 * 0.9)), M(P(500, FLOOR, s0 * 0.9))]
        od.polygon(q, fill=(255, 230, 180, 22))
    for (x, y, s, r, ph) in DUST:
        yy = (y - t * 40) % 2400 - 600
        p = M(P(x + 40 * math.sin(t + ph), yy, s))
        rr = r * s * Z
        od.ellipse((p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr), fill=(255, 240, 210, 70))
    im.alpha_composite(ov)
    d = ImageDraw.Draw(im)
    # tables (du fond vers l'avant)
    for s in (0.52, 0.62, 0.78, 1.05):
        for xc in (-640, 0, 640):
            desk(d, M, xc, s)
            if s == 0.62 and xc == 0:
                # portable : base + écran (sans logo)
                d.polygon([M(P(-200, DESK, 0.63)), M(P(200, DESK, 0.63)), M(P(190, DESK, SCR_S)), M(P(-190, DESK, SCR_S))], fill=(196, 200, 210))
                d.polygon([M(P(-60, DESK, 0.628)), M(P(60, DESK, 0.628)), M(P(58, DESK, 0.617)), M(P(-58, DESK, 0.617))], fill=(170, 175, 188))
                e = 10 * SCR_S
                d.rounded_rectangle((M((SX0 - e, SY0 - e)), M((SX1 + e, SY1 + e))), max(1, int(8 * Z * SCR_S)), fill=(26, 27, 32))
                draw_screen(im, M, t, Z)
                d = ImageDraw.Draw(im)
            if s == 0.62 and xc != 0:
                pass
        if s == 0.62:
            # élève (de dos), devant le portable
            draw_student(im, M, t, Z)
            d = ImageDraw.Draw(im)
    return im.resize((W, H), Image.LANCZOS)


def draw_screen(im, M, t, Z):
    x0, y0 = M((SX0, SY0)); x1, y1 = M((SX1, SY1))
    vx0, vy0, vx1, vy1 = max(0, x0), max(0, y0), min(CW, x1), min(CH, y1)
    if vx1 > vx0 and vy1 > vy0:
        ui = screen_ui(t)
        sx = DW / (x1 - x0); sy = DH / (y1 - y0)
        crop = ui.crop((int((vx0 - x0) * sx), int((vy0 - y0) * sy), int(math.ceil((vx1 - x0) * sx)), int(math.ceil((vy1 - y0) * sy))))
        crop = crop.resize((max(1, int(vx1 - vx0)), max(1, int(vy1 - vy0))), Image.LANCZOS)
        im.paste(crop, (int(vx0), int(vy0)))
    # lueur de l'écran
    if t > 1.95 and Z < 6:
        g = lin((t - 1.95) / 0.4)
        gw = int((SX1 - SX0) * 3.2 * Z)
        if gw > 2:
            gl = GLOW.resize((gw, gw))
            gl.putalpha(gl.getchannel("A").point(lambda v: int(v * g * 0.8)))
            c = M(((SX0 + SX1) / 2, (SY0 + SY1) / 2))
            im.alpha_composite(gl, (int(c[0] - gw / 2), int(c[1] - gw / 2)))


def draw_student(im, M, t, Z):
    d = ImageDraw.Draw(im)
    s = 0.665
    # parallaxe : l'élève sort du cadre pendant le travelling avant
    xc = -340 - smooth(0, 1500, 2.3, 3.9, t)
    hood = (206, 92, 78)
    # bras droit : repos -> pavé tactile (clic à 1.9 s)
    sh = M(P(xc + 170, DESK - 300, s))
    rest = M(P(xc + 150, DESK - 20, s))
    pad = M(P(0, DESK, 0.622))
    k = lin((t - 1.15) / 0.65); k = k * k * (3 - 2 * k)
    if 1.85 <= t < 2.0:
        k = 1.0
    if t >= 2.15:
        k = 1 - lin((t - 2.15) / 0.45)
    hx = rest[0] + (pad[0] - rest[0]) * k
    hy = rest[1] + (pad[1] - rest[1]) * k - (8 * Z * s if 1.88 <= t < 1.98 else 0)
    el = ((sh[0] + hx) / 2 + 30 * Z * s, (sh[1] + hy) / 2 + 60 * Z * s)
    wd = max(2, int(80 * s * Z))
    d.line((sh, el, (hx, hy)), fill=(186, 80, 68), width=wd, joint="curve")
    r = wd * 0.45
    d.ellipse((hx - r, hy - r, hx + r, hy + r), fill=(214, 164, 132))
    # corps
    body = [M(P(xc - 230, DESK - 250, s)), M(P(xc + 230, DESK - 250, s)), M(P(xc + 260, DESK + 200, s)), M(P(xc - 260, DESK + 200, s))]
    d.polygon(body, fill=hood)
    for sx in (-1, 1):
        c = M(P(xc + sx * 175, DESK - 215, s)); rr = 80 * s * Z
        d.ellipse((c[0] - rr, c[1] - rr, c[0] + rr, c[1] + rr), fill=hood)
    # capuche + cou + tête
    c = M(P(xc, DESK - 270, s)); rw, rh = 150 * s * Z, 60 * s * Z
    d.ellipse((c[0] - rw, c[1] - rh, c[0] + rw, c[1] + rh), fill=(176, 74, 62))
    n0, n1 = M(P(xc - 55, DESK - 380, s)), M(P(xc + 55, DESK - 270, s))
    d.rectangle((n0, n1), fill=(200, 150, 120))
    hc = M(P(xc, DESK - 470, s)); hr = 105 * s * Z
    d.ellipse((hc[0] - hr, hc[1] - hr * 1.08, hc[0] + hr, hc[1] + hr * 1.08), fill=(34, 26, 24))
    d.ellipse((hc[0] - hr * 0.95, hc[1] - hr * 1.15, hc[0] + hr * 0.9, hc[1] + hr * 0.4), fill=(44, 34, 30))
