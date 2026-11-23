import subprocess, math, os, sys
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
F = "/usr/share/fonts/truetype/google-fonts/"
BOLD, MED, REG = F + "Poppins-Bold.ttf", F + "Poppins-Medium.ttf", F + "Poppins-Regular.ttf"
BG = (12, 18, 38)
CARD = (24, 32, 58)
GOLD = (255, 205, 60)
WHITE = (255, 255, 255)
GREY = (170, 180, 205)
PINK = (255, 90, 120)

from PIL import ImageFilter
import random
def _glow(w, h, col):
    g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse((150, 150, w - 150, h - 150), fill=col)
    return g.filter(ImageFilter.GaussianBlur(110))
GLOW1 = _glow(1680, 1500, (70, 80, 190, 90))
GLOW2 = _glow(1480, 1200, (255, 180, 50, 40))
_fc = {}
def font(p, s):
    k = (p, s)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(p, s)
    return _fc[k]

def ease(t):  # gentle easeOutBack
    t = max(0.0, min(1.0, t))
    c1 = 0.6; c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2

def lin(t):
    return max(0.0, min(1.0, t))

def prog(t, start, dur=0.35):
    return lin((t - start) / dur)

def text(img, s, y, size, color=WHITE, path=BOLD, p=1.0, x=None, anchor="mm", slide=60):
    """draw text with appear progress p (0..1): fade + slide up"""
    if p <= 0:
        return
    a = lin(p)
    dy = (1 - ease(p)) * slide
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((W // 2 if x is None else x, y + dy), s, font=font(path, size), fill=color + (int(255 * a),), anchor=anchor)
    img.alpha_composite(layer)

def pop_text(img, s, y, size, color=WHITE, p=1.0, path=BOLD):
    """scale-pop text"""
    if p <= 0:
        return
    sc = max(0.01, ease(p))
    f = font(path, size)
    l, t_, r, b = f.getbbox(s)
    tw, th = r - l + 40, b - t_ + 40
    lay = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    ImageDraw.Draw(lay).text((tw // 2, th // 2), s, font=f, fill=color + (255,), anchor="mm")
    nw, nh = max(1, int(tw * sc)), max(1, int(th * sc))
    lay = lay.resize((nw, nh), Image.LANCZOS)
    if p < 1:
        alpha = lay.getchannel("A").point(lambda v: int(v * lin(p * 2)))
        lay.putalpha(alpha)
    img.alpha_composite(lay, (W // 2 - nw // 2, int(y - nh // 2)))

def card(img, box, p=1.0, fill=CARD, outline=None, radius=36):
    if p <= 0:
        return
    a = lin(p)
    dy = (1 - ease(p)) * 80
    x0, y0, x1, y1 = box
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((x0, y0 + dy, x1, y1 + dy), radius, fill=fill + (int(240 * a),),
                        outline=(outline + (int(255 * a),)) if outline else None, width=5)
    img.alpha_composite(layer)
    return dy

def chip(img, s, y, p, bg=GOLD, fg=BG, size=46):
    if p <= 0:
        return
    f = font(BOLD, size)
    l, t_, r, b = f.getbbox(s)
    w = r - l + 70; h = 96
    a = lin(p); dy = (1 - ease(p)) * 40
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((W // 2 - w // 2, y - h // 2 + dy, W // 2 + w // 2, y + h // 2 + dy), 48, fill=bg + (int(255 * a),))
    d.text((W // 2, y + dy), s, font=f, fill=fg + (int(255 * a),), anchor="mm")
    img.alpha_composite(layer)

def _mkbg():
    w, h = W + 500, H + 700
    g = Image.new("RGBA", (w, h), (18, 10, 44, 255))
    d = ImageDraw.Draw(g)
    for (x, y, r, c) in [(150, 300, 700, (110, 50, 255, 255)), (1400, 700, 650, (255, 70, 140, 255)),
                         (300, 1700, 750, (40, 110, 255, 255)), (1300, 2300, 700, (150, 40, 220, 255)),
                         (800, 1200, 400, (255, 150, 90, 200))]:
        d.ellipse((x - r, y - r, x + r, y + r), fill=c)
    g = g.filter(ImageFilter.GaussianBlur(260))
    dark = Image.new("RGBA", (w, h), (10, 8, 30, 150))
    g.alpha_composite(dark)
    return g
BGIMG = _mkbg()
BOKEH = []
for i in range(9):
    rr = random.Random(i)
    BOKEH.append((rr.random() * W, rr.random() * H, rr.uniform(40, 110), rr.uniform(10, 25), rr.random() * 6))

def _mkbg2():
    g = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(g)
    for y in range(H):  # dégradé vertical sobre
        k = y / H
        d.line((0, y, W, y), fill=(int(9 + 7 * k), int(13 + 9 * k), int(26 + 18 * k), 255))
    dots = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dots)
    for yy in range(30, H, 60):
        for xx in range(30, W, 60):
            dd.ellipse((xx - 2, yy - 2, xx + 2, yy + 2), fill=(255, 255, 255, 16))
    g.alpha_composite(dots)
    vig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(vig).ellipse((-300, -200, W + 300, H + 200), fill=(0, 0, 0, 0))
    return g
BG2 = _mkbg2()
GLOWG = _glow(1300, 1300, (255, 190, 60, 18))
GLOWB = _glow(1500, 1500, (60, 90, 200, 40))

def base(gt, total):
    img = BG2.copy()
    img.alpha_composite(GLOWB, (int(-500 + 120 * math.sin(gt * 0.15)), int(-450 + 80 * math.cos(gt * 0.12))))
    img.alpha_composite(GLOWG, (int(250 + 100 * math.cos(gt * 0.13)), int(1000 + 120 * math.sin(gt * 0.1))))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 14), fill=(255, 255, 255, 30))
    d.rectangle((0, 0, int(W * gt / total), 14), fill=GOLD)
    return img

def base_fun(gt, total):
    ox = int(250 + 220 * math.sin(gt * 0.12))
    oy = int(350 + 300 * math.sin(gt * 0.09 + 1))
    img = BGIMG.crop((ox, oy, ox + W, oy + H))
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for (bx, by, r, sp, ph) in BOKEH:
        y = (by - gt * sp) % (H + 200) - 100
        x = bx + 30 * math.sin(gt * 0.3 + ph)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 14))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(6)))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 14), fill=(255, 255, 255, 40))
    d.rectangle((0, 0, int(W * gt / total), 14), fill=GOLD)
    return img

def base_old(gt, total):
    img = Image.new("RGBA", (W, H), BG + (255,))
    d = ImageDraw.Draw(img)
    # soft glow blobs
    cx = int(90 * math.sin(gt * 0.25))
    img.alpha_composite(GLOW1, (cx - 300, -100))
    img.alpha_composite(GLOW2, (-cx - 200, 850))
    # progress bar (retention)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 14), fill=(40, 50, 85))
    d.rectangle((0, 0, int(W * gt / total), 14), fill=GOLD)
    return img

def scale_icon(img, cx, cy, s, p, ang=0.0):
    """simple justice scale drawn with shapes"""
    if p <= 0:
        return
    a = int(255 * lin(p))
    c = GOLD + (a,)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    sc = ease(p)
    S = s * sc
    d.line((cx, cy - S, cx, cy + S * 0.9), fill=c, width=max(1, int(S * 0.08)))
    ca, sa = math.cos(ang), math.sin(ang)
    by = cy - S * 0.7
    d.line((cx - S * ca, by - S * sa, cx + S * ca, by + S * sa), fill=c, width=max(1, int(S * 0.08)))
    d.rounded_rectangle((cx - S * 0.45, cy + S * 0.8, cx + S * 0.45, cy + S * 0.95), 6, fill=c)
    for sx in (-1, 1):
        px = cx + sx * S * ca
        top = by + sx * S * sa
        o = top - (cy - S * 0.7)
        d.line((px, top, px - S * 0.35, cy + S * 0.05 + o), fill=c, width=max(1, int(S * 0.04)))
        d.line((px, top, px + S * 0.35, cy + S * 0.05 + o), fill=c, width=max(1, int(S * 0.04)))
        d.chord((px - S * 0.4, cy - S * 0.25 + o, px + S * 0.4, cy + S * 0.35 + o), 0, 180, fill=c)
    d.ellipse((cx - S * 0.1, cy - S * 1.1, cx + S * 0.1, cy - S * 0.9), fill=c)
    img.alpha_composite(layer)

def step_row(img, y, num, title, sub, p, accent=GOLD, side=1, emo=None, t=0.0):
    if p <= 0:
        return
    full = img
    img = Image.new("RGBA", full.size, (0, 0, 0, 0))
    dy = card(img, (90, y - 75, W - 90, y + 75), 1.0, radius=30)
    a = int(255 * lin(p))
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse((125, y - 42 + dy, 209, y + 42 + dy), fill=accent + (a,))
    d.text((167, y + dy), str(num), font=font(BOLD, 44), fill=BG + (a,), anchor="mm")
    d.text((240, y - 22 + dy), title, font=font(BOLD, 46), fill=WHITE + (a,), anchor="lm")
    d.text((240, y + 30 + dy), sub, font=font(REG, 34), fill=GREY + (a,), anchor="lm")
    img.alpha_composite(layer)
    if emo:
        emoji(img, emo, W - 165, y + dy, 78, 1.0, rot=8 * math.sin(t * 3 + num), t=t)
    dx = int((1 - ease(p)) * 140 * side)
    if p < 1:
        img.putalpha(img.getchannel("A").point(lambda v: int(v * lin(p * 1.5))))
    full.alpha_composite(img.crop((max(0, -dx), 0, W - max(0, dx), H)), (max(0, dx), 0))

def header(img, t, label, title, color=GOLD):
    chip(img, label, 300, prog(t, 0.0, 0.3), bg=color)
    text(img, title, 430, 74 if len(title) < 24 else 64, WHITE, p=prog(t, 0.15, 0.35))

EMO = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
_ec = {}
def _emo_img(ch):
    if ch not in _ec:
        f = ImageFont.truetype(EMO, 109)
        im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((80, 80), ch, font=f, embedded_color=True, anchor="mm")
        _ec[ch] = im.crop(im.getbbox())
    return _ec[ch]

def emoji(img, ch, x, y, size, p=1.0, rot=0.0, bob=0.0, t=0.0):
    if p <= 0:
        return
    e = _emo_img(ch)
    sc = max(0.01, ease(p))
    sz = max(2, int(size * sc))
    e2 = e.resize((sz, int(sz * e.height / e.width)), Image.LANCZOS)
    if rot:
        e2 = e2.rotate(rot, resample=Image.BICUBIC, expand=True)
    if p < 1:
        e2.putalpha(e2.getchannel("A").point(lambda v: int(v * lin(p * 2))))
    yy = y + bob * math.sin(t * 4 + x * 0.01)
    img.alpha_composite(e2, (int(x - e2.width / 2), int(yy - e2.height / 2)))

def sticker(img, s, x, y, p, rot=-6, bg=WHITE, fg=BG, size=40, emo=None):
    if p <= 0:
        return
    f = font(BOLD, size)
    tw = int(f.getlength(s)); ew = int(size * 1.2) if emo else 0
    w, h = tw + ew + 60, int(size * 2.0)
    lay = Image.new("RGBA", (w + 20, h + 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle((10, 10, w + 10, h + 10), 22, fill=bg + (255,))
    d.text((40 + ew, h / 2 + 10), s, font=f, fill=fg + (255,), anchor="lm")
    if emo:
        e = _emo_img(emo).resize((int(size * 1.05), int(size * 1.05)), Image.LANCZOS)
        lay.alpha_composite(e, (32, int(h / 2 + 10 - size * 0.52)))
    sc = max(0.01, ease(p))
    lay = lay.resize((max(1, int(lay.width * sc)), max(1, int(lay.height * sc))), Image.LANCZOS)
    lay = lay.rotate(rot, resample=Image.BICUBIC, expand=True)
    if p < 1:
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * lin(p * 2))))
    img.alpha_composite(lay, (int(x - lay.width / 2), int(y - lay.height / 2)))

def underline(img, y, w, p, color=PINK, h=16):
    if p <= 0:
        return
    d = ImageDraw.Draw(img)
    x0 = W // 2 - w // 2
    d.rounded_rectangle((x0, y, x0 + int(w * lin(p)), y + h), h // 2, fill=color + (255,))

# ---------------- scenes ----------------
def s_hook(img, t):
    scale_icon(img, W // 2, 470, 150, prog(t, 0.0, 0.45), ang=0.16 * math.sin(t * 4.5))
    pop_text(img, "Tu veux devenir", 790, 78, WHITE, prog(t, 0.15, 0.35))
    pop_text(img, "AVOCAT ?", 920, 150, GOLD, prog(t, 0.35, 0.4))
    underline(img, 1010, 640, prog(t, 0.75, 0.3))
    text(img, "3 routes pour porter la robe.", 1120, 58, WHITE, p=prog(t, 1.0, 0.35))
    text(img, "La 3e, ton prof te l'a jamais dite.", 1210, 52, PINK, path=MED, p=prog(t, 1.6, 0.35))
    emoji(img, "📚", 190, 330, 120, prog(t, 0.2, 0.35), rot=-12, bob=14, t=t)
    emoji(img, "💼", 890, 360, 120, prog(t, 0.35, 0.35), rot=10, bob=14, t=t)
    emoji(img, "🎓", 170, 650, 110, prog(t, 0.5, 0.35), rot=8, bob=12, t=t)
    emoji(img, "🔥", 910, 660, 110, prog(t, 0.65, 0.35), rot=-8, bob=12, t=t)
    emoji(img, "👇", W // 2, 1340, 110, prog(t, 2.1, 0.3), bob=18, t=t * 2)
    sticker(img, "Parcoursup 2027", 800, 200, prog(t, 0.9, 0.3), rot=7, bg=GOLD, size=36, emo="📅")

def s_c1(img, t):
    header(img, t, "CHEMIN 1", "La voie classique")
    rows = [("Licence de droit", "3 ans à la fac (via Parcoursup)"),
            ("Master 1 de droit", "+1 an"),
            ("Examen d'entrée CRFPA", "l'examen à réussir"),
            ("École d'avocats", "18 mois, dont 6 de stage"),
            ("CAPA", "le diplôme pour exercer")]
    emos = ["📚", "🎓", "📝", "🏛️", "⚖️"]
    # timeline connector
    pl = prog(t, 0.45, 2.0)
    if pl > 0:
        ImageDraw.Draw(img).line((167, 620, 167, 620 + int(4 * 185 * lin(pl))), fill=GOLD + (200,), width=8)
    for i, (a, b) in enumerate(rows):
        step_row(img, 620 + i * 185, i + 1, a, b, prog(t, 0.45 + i * 0.45, 0.35), side=1 if i % 2 == 0 else -1, emo=emos[i], t=t)
    sticker(img, "≈ 7 ans après le bac", 560, 1555, prog(t, 3.3, 0.3), rot=-4, bg=GOLD, size=42, emo="⏱️")
    sticker(img, "Master 2 obligatoire avant le CAPA", W // 2, 1690, prog(t, 3.6, 0.3), rot=3, bg=WHITE, size=32, emo="⚠️")

def s_c2(img, t):
    header(img, t, "CHEMIN 2", "Le profil double")
    card(img, (90, 560, W - 90, 900), prog(t, 0.5, 0.35), outline=GOLD)
    text(img, "Double licence", 650, 64, GOLD, p=prog(t, 0.6, 0.35))
    text(img, "droit + éco, langues, histoire…", 745, 42, WHITE, path=MED, p=prog(t, 0.75, 0.35))
    text(img, "ou un IEP (Sciences Po)", 820, 42, WHITE, path=MED, p=prog(t, 0.9, 0.35))
    pa = prog(t, 1.4, 0.3)
    if pa > 0:
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); a = int(255 * pa)
        d.line((W // 2, 935, W // 2, 1005), fill=GOLD + (a,), width=12)
        d.polygon([(W // 2 - 36, 995), (W // 2 + 36, 995), (W // 2, 1035)], fill=GOLD + (a,))
        img.alpha_composite(lay)
    card(img, (90, 1060, W - 90, 1300), prog(t, 1.7, 0.35))
    text(img, "Master de droit", 1140, 60, WHITE, p=prog(t, 1.8, 0.35))
    text(img, "puis même examen + école d'avocats", 1220, 40, GREY, path=REG, p=prog(t, 1.9, 0.35))
    emoji(img, "📈", 230, 990, 100, prog(t, 0.85, 0.3), rot=-14, bob=10, t=t)
    emoji(img, "🌍", 935, 590, 95, prog(t, 1.0, 0.3), rot=12, bob=10, t=t)
    emoji(img, "🏛️", 930, 880, 95, prog(t, 1.15, 0.3), rot=-8, bob=10, t=t)
    emoji(img, "⚖️", 850, 990, 95, prog(t, 2.0, 0.3), rot=10, bob=10, t=t)
    sticker(img, "Un profil qui attire les cabinets", W // 2, 1460, prog(t, 2.6, 0.3), rot=-4, bg=GOLD, size=40, emo="✨")

def s_c3(img, t):
    header(img, t, "CHEMIN 3", "La passerelle", color=PINK)
    text(img, "celle que personne ne te dit", 510, 42, PINK, path=MED, p=prog(t, 0.3, 0.35))
    card(img, (90, 580, W - 90, 820), prog(t, 0.5, 0.35))
    text(img, "Deviens juriste", 655, 62, WHITE, p=prog(t, 0.6, 0.35))
    text(img, "d'entreprise après ton master", 745, 44, GREY, path=MED, p=prog(t, 0.7, 0.35))
    emoji(img, "💼", 160, 600, 100, prog(t, 0.7, 0.3), rot=-12, bob=10, t=t)
    emoji(img, "🤫", 930, 300, 110, prog(t, 0.3, 0.3), rot=10, bob=12, t=t)
    emoji(img, "⏳", 140, 960, 100, prog(t, 1.4, 0.3), rot=-10, bob=12, t=t)
    emoji(img, "🚀", 940, 960, 100, prog(t, 1.6, 0.3), rot=12, bob=12, t=t)
    sticker(img, "Payé comme juriste pendant ce temps", W // 2, 1560, prog(t, 2.6, 0.3), rot=4, bg=GOLD, size=36, emo="💶")
    pc = prog(t, 1.3, 0.55)
    if pc > 0:
        n = min(8, int(pc * 8.99))
        pop_text(img, f"{n} ans", 960, 170, GOLD, min(1.0, pc * 2.5))
    text(img, "d'expérience plus tard…", 1090, 48, WHITE, path=MED, p=prog(t, 1.6, 0.35))
    card(img, (90, 1190, W - 90, 1430), prog(t, 2.2, 0.35), outline=PINK)
    text(img, "Deviens avocat sur dossier", 1270, 54, WHITE, p=prog(t, 2.3, 0.35))
    text(img, "sans passer par l'école d'avocats", 1350, 40, PINK, path=MED, p=prog(t, 2.45, 0.35))

def s_demo(img, t):
    text(img, "Et pour TON métier ?", 330, 72, WHITE, p=prog(t, 0.0, 0.35))
    # phone-like search card
    card(img, (110, 470, W - 110, 600), prog(t, 0.2, 0.35), fill=(245, 247, 252), radius=65)
    q = "boulanger, kiné, pilote…"
    typed = "pilote de ligne"
    n = int(max(0, (t - 0.6)) * 11)
    s = typed[:n]
    if prog(t, 0.2, 0.35) > 0:
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        a = int(255 * prog(t, 0.2, 0.35))
        if not s:
            d.text((170, 535), q, font=font(MED, 44), fill=(150, 155, 170, a), anchor="lm")
        else:
            d.text((170, 535), s, font=font(BOLD, 46), fill=BG + (a,), anchor="lm")
            if int(t * 3) % 2 == 0 and n < len(typed):
                w = font(BOLD, 46).getlength(s)
                d.rectangle((174 + w, 505, 180 + w, 565), fill=BG + (a,))
        # search button
        d.ellipse((W - 230, 485, W - 125, 585), fill=GOLD + (a,))
        d.ellipse((W - 197, 512, W - 160, 549), outline=BG + (a,), width=7)
        d.line((W - 165, 545, W - 148, 562), fill=BG + (a,), width=8)
        img.alpha_composite(layer)
    # results
    res = [("L'ENAC", "École publique · coût très réduit"),
           ("L'école privée", "≈ 2 ans · 80 000 à 130 000 €"),
           ("Pilote militaire", "Gratuit, et tu es payé")]
    t0 = 2.0
    emoji(img, "✈️", 540, 200, 100, prog(t, 1.4, 0.3), rot=-10, bob=10, t=t)
    emoji(img, "👆", W - 150, 650, 110, prog(t, 1.5, 0.2) * (1 if t < 2.0 else 0), rot=-15)
    text(img, "3 chemins trouvés", 700, 46, GOLD, p=prog(t, t0, 0.3))
    emos = ["🏫", "💶", "🎖️"]
    for i, (a, b) in enumerate(res):
        step_row(img, 830 + i * 185, i + 1, a, b, prog(t, t0 + 0.25 + i * 0.25, 0.3), side=1 if i % 2 == 0 else -1, emo=emos[i], t=t)
    sticker(img, "Salaire : 3 000 – 4 500 € brut/mois", W // 2, 1440, prog(t, 3.1, 0.3), rot=-3, bg=GOLD, size=36, emo="💰")
    sticker(img, "Durée, coût, Parcoursup ou pas", W // 2, 1580, prog(t, 3.4, 0.3), rot=2, bg=WHITE, size=34, emo="✅")

def s_cta(img, t):
    pop_text(img, "Tape ton métier.", 560, 88, WHITE, prog(t, 0.0, 0.35))
    pop_text(img, "Découvre", 720, 120, GOLD, prog(t, 0.3, 0.35))
    pop_text(img, "tes 3 chemins.", 860, 120, GOLD, prog(t, 0.45, 0.35))
    underline(img, 935, 720, prog(t, 0.7, 0.3))
    text(img, "Le 1er chemin est gratuit", 1000, 50, WHITE, path=MED, p=prog(t, 0.9, 0.35))
    pb = prog(t, 1.0, 0.35)
    if pb > 0:
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); a = int(255 * pb)
        f1, f2 = font(BOLD, 76), font(BOLD, 76)
        w1, w2 = f1.getlength("trouve"), f2.getlength("tavoie")
        x0 = W // 2 - (w1 + w2) // 2; dy = (1 - ease(pb)) * 40
        d.text((x0, 1110 + dy), "trouve", font=f1, fill=WHITE + (a,), anchor="lm")
        d.text((x0 + w1, 1110 + dy), "tavoie", font=f2, fill=GOLD + (a,), anchor="lm")
        img.alpha_composite(lay)
    pulse = 1 + 0.04 * math.sin(t * 7) if t > 1.3 else 1
    p = prog(t, 1.2, 0.35)
    if p > 0:
        w, h = int(620 * pulse), int(140 * pulse)
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        a = int(255 * p)
        d.rounded_rectangle((W // 2 - w // 2, 1260 - h // 2, W // 2 + w // 2, 1260 + h // 2), h // 2, fill=PINK + (a,))
        d.text((W // 2, 1260), "LIEN EN BIO", font=font(BOLD, int(60 * pulse)), fill=WHITE + (a,), anchor="mm")
        img.alpha_composite(layer)
    emoji(img, "👉", 130, 1260, 95, prog(t, 1.3, 0.3), bob=10, t=t * 2)
    emoji(img, "👈", 950, 1260, 95, prog(t, 1.4, 0.3), bob=10, t=t * 2 + 1)
    emoji(img, "🔥", 170, 390, 100, prog(t, 0.4, 0.3), rot=-10, bob=10, t=t)
    emoji(img, "🎯", 910, 390, 100, prog(t, 0.55, 0.3), rot=10, bob=10, t=t)
    sticker(img, "Enregistre pour plus tard", W // 2, 1560, prog(t, 2.0, 0.3), rot=-3, bg=GOLD, size=38, emo="📌")
    text(img, "Parcoursup 2027 : prépare-toi dès maintenant", 1420, 36, GREY, path=REG, p=prog(t, 1.8, 0.35))

def s_quiz(img, t):
    text(img, "Pas d'idée de métier ?", 250, 68, WHITE, p=prog(t, 0.0, 0.4))
    text(img, "Fais le quiz, adapté à ton bac", 340, 46, GOLD, path=MED, p=prog(t, 0.2, 0.4))
    pc = prog(t, 0.4, 0.45)
    if pc <= 0:
        return
    ph = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ph)
    x0, y0, x1, y1 = 140, 430, W - 140, 1640
    d.rounded_rectangle((x0, y0, x1, y1), 60, fill=(245, 247, 252, 255))
    d.rounded_rectangle((x0 + 40, y0 + 50, x1 - 40, y0 + 66), 8, fill=(220, 224, 235, 255))
    qp = 0.3 if t < 2.6 else 0.4
    d.rounded_rectangle((x0 + 40, y0 + 50, x0 + 40 + int((x1 - x0 - 80) * qp), y0 + 66), 8, fill=GOLD + (255,))
    d.text((x0 + 40, y0 + 115), "Question 7", font=font(MED, 34), fill=(120, 125, 145, 255), anchor="lm")
    d.text((W // 2, y0 + 190), "Ce qui te ferait lever", font=font(BOLD, 50), fill=BG + (255,), anchor="mm")
    d.text((W // 2, y0 + 255), "le matin pour bosser ?", font=font(BOLD, 50), fill=BG + (255,), anchor="mm")
    opts = [("🤝", "Me sentir utile"), ("💰", "Bien gagner ma vie"), ("🔧", "Créer, construire"), ("⚖️", "Faire respecter la justice")]
    chosen = 3 if t > 1.9 else -1
    for i, (e, lab) in enumerate(opts):
        oy = y0 + 330 + i * 150
        pi = prog(t, 0.8 + i * 0.15, 0.35)
        if pi <= 0:
            continue
        sel = (i == chosen)
        fill = GOLD if sel else (232, 236, 245)
        d.rounded_rectangle((x0 + 40, oy, x1 - 40, oy + 120), 30, fill=fill + (int(255 * pi),))
        d.text((x0 + 150, oy + 60), lab, font=font(BOLD, 40), fill=BG + (int(255 * pi),), anchor="lm")
        ph_e = _emo_img(e).resize((70, 70), Image.LANCZOS)
        if pi < 1:
            ph_e.putalpha(ph_e.getchannel("A").point(lambda v: int(v * pi)))
        ph.alpha_composite(ph_e, (x0 + 65, oy + 25))
    # result card
    pr = prog(t, 2.6, 0.45)
    if pr > 0:
        ry = y0 + 950
        d.rounded_rectangle((x0 + 40, ry, x1 - 40, ry + 200), 30, fill=BG + (int(255 * pr),))
        d.text((x0 + 80, ry + 55), "Métiers qui te correspondent", font=font(MED, 34), fill=GOLD + (int(255 * pr),), anchor="lm")
        d.text((x0 + 80, ry + 130), "Avocat · Policier · Journaliste", font=font(BOLD, 40), fill=WHITE + (int(255 * pr),), anchor="lm")
    if pc < 1:
        ph.putalpha(ph.getchannel("A").point(lambda v: int(v * pc)))
    img.alpha_composite(ph, (0, int((1 - ease(pc)) * 80)))
    if 1.5 < t < 2.1:
        emoji(img, "👆", x1 - 120, y0 + 330 + 3 * 150 + 110, 110, 1.0, rot=-15)

def s_feat(img, t):
    text(img, "Et c'est pas tout", 280, 72, WHITE, p=prog(t, 0.0, 0.4))
    underline(img, 340, 420, prog(t, 0.3, 0.3), color=GOLD, h=12)
    rows = [("🏫", "Écoles publiques & privées", "pas que celles de Parcoursup"),
            ("📊", "Chances d'admission", "données officielles Parcoursup"),
            ("💰", "Salaires de chaque chemin", "une fourchette réaliste"),
            ("✉️", "Messages aux écoles", "générés en un clic"),
            ("✍️", "Lettres de motivation", "on t'aide à les rédiger")]
    for i, (e, a, b) in enumerate(rows):
        y = 500 + i * 195
        p = prog(t, 0.5 + i * 0.32, 0.4)
        if p <= 0:
            continue
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        d.rounded_rectangle((90, y - 84, W - 90, y + 84), 34, fill=CARD + (240,))
        d.rounded_rectangle((120, y - 62, 244, y + 62), 28, fill=GOLD + (255,))
        ee = _emo_img(e).resize((80, 80), Image.LANCZOS)
        lay.alpha_composite(ee, (142, y - 40))
        d.text((280, y - 26), a, font=font(BOLD, 46), fill=WHITE + (255,), anchor="lm")
        d.text((280, y + 32), b, font=font(REG, 34), fill=GREY + (255,), anchor="lm")
        if p < 1:
            lay.putalpha(lay.getchannel("A").point(lambda v: int(v * p)))
        side = 1 if i % 2 == 0 else -1
        dx = int((1 - ease(p)) * 140 * side)
        img.alpha_composite(lay.crop((max(0, -dx), 0, W - max(0, dx), H)), (max(0, dx), 0))
    sticker(img, "Tout au même endroit", W // 2, 1490, prog(t, 2.2, 0.35), rot=-3, bg=PINK, fg=WHITE, size=42, emo="🔥")

def s_outro(img, t):
    emoji(img, "🧭", W // 2, 470, 190, prog(t, 0.0, 0.5), bob=12, t=t)
    pop_text(img, "Trouve ta voie", 720, 110, GOLD, prog(t, 0.3, 0.5))
    text(img, "si tu veux pas finir", 880, 64, WHITE, path=MED, p=prog(t, 1.0, 0.5))
    text(img, "dans la team Nasdas", 980, 72, PINK, p=prog(t, 1.5, 0.5))
    emoji(img, "📱", W // 2, 1175, 95, prog(t, 2.1, 0.4), rot=8 * math.sin(t * 3))
    text(img, "trouvetavoie · lien en bio", 1360, 46, GREY, path=MED, p=prog(t, 2.6, 0.5))

K = 0.8
SCENES = [("hook", s_hook, 4.4), ("c1", s_c1, 6.2), ("c2", s_c2, 5.0),
          ("c3", s_c3, 5.0), ("demo", s_demo, 5.6), ("quiz", s_quiz, 5.6),
          ("feat", s_feat, 4.6),
          ("cta", s_cta, 4.2), ("outro", s_outro, 5.4)]
# impact moments (scene-time, unscaled) -> zoom punch + shake
IMPACTS = {"hook": [0.0, 0.75, 1.6], "c1": [0.0, 3.3, 3.6], "c2": [0.0, 0.85, 2.6],
           "c3": [0.0, 1.85, 2.6], "demo": [0.0, 1.7, 2.3], "cta": [0.0, 0.3, 1.2], "outro": [0.0, 0.3], "quiz": [], "feat": [2.2]}
TOTAL = sum(d for _, _, d in SCENES)

STRIPES = Image.new("RGBA", (W + 400, H + 400), (0, 0, 0, 0))
_sd = ImageDraw.Draw(STRIPES)
for i in range(-H, W + 2 * H, 140):
    _sd.line((i, 0, i - (H + 400), H + 400), fill=(255, 255, 255, 9), width=46)
random.seed(3)
PARTS = [(random.random() * W, random.random() * H, random.uniform(3, 6), random.uniform(25, 60)) for _ in range(14)]

def render_frame(name, t):
    off = 0
    for n, fn, d in SCENES:
        if n == name:
            break
        off += d
    fn_ = dict((n, f) for n, f, _ in SCENES)[name]
    gt = off + t
    img = base(gt, TOTAL)
    # moving stripes + rising particles
    sh = int((gt * 180) % 140)

    pd = ImageDraw.Draw(img)

    # content on its own layer
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fn_(layer, t * K)
    # punch zoom, slide-in, shake
    dur = dict((n, d) for n, _, d in SCENES)[name]
    zoom, sx, sy = 1.0 + 0.02 * t / dur, 0.0, 0.0
    for it in IMPACTS.get(name, []):
        dt = t - it / K
        if 0 <= dt < 0.3:
            k = 1 - dt / 0.3
            zoom += (0.0 if it == 0 else 0.02) * k * k
    fin = lin(t / 0.4)
    fout = lin((dur - t) / 0.4) if name != SCENES[-1][0] else 1.0
    sy += (1 - ease(fin)) * 60 - (1 - fout) ** 2 * 60
    fade = min(fin, fout)
    if zoom != 1.0:
        nw, nh = int(W * zoom), int(H * zoom)
        layer = layer.resize((nw, nh), Image.BILINEAR)
        layer = layer.crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
    if fade < 1:
        layer.putalpha(layer.getchannel("A").point(lambda v: int(v * fade)))
    oy = int(sy)
    if oy >= 0:
        img.alpha_composite(layer, (int(sx), oy))
    else:
        img.alpha_composite(layer.crop((0, -oy, W, H)), (int(sx), 0))
    # white flash on cut

    return img.convert("RGB")

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "still":
        name, t, out = sys.argv[2], float(sys.argv[3]), sys.argv[4]
        render_frame(name, t).save(out)
    else:
        os.makedirs("parts2", exist_ok=True)
        only = sys.argv[2:] or [n for n, _, _ in SCENES]
        for n, fn, d in SCENES:
            if n not in only: continue
            tmp = f"parts2/{n}.tmp.mp4"
            p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                  "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast",
                                  "-crf", "18", "-pix_fmt", "yuv420p", tmp], stdin=subprocess.PIPE)
            for i in range(int(round(d * FPS))):
                p.stdin.write(render_frame(n, i / FPS).tobytes())
            p.stdin.close()
            if p.wait() == 0:
                os.replace(tmp, f"parts2/{n}.mp4")
            else:
                sys.exit("fail " + n)
        with open("parts2/list.txt", "w") as f:
            for n, _, _ in SCENES:
                f.write(f"file '{n}.mp4'\n")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "parts2/list.txt",
                        "-c", "copy", "-movflags", "+faststart", "video_avocat_tiktok_v2.mp4"], check=True)
        print("done", TOTAL)
