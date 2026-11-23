import subprocess, math, os, sys, random, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from make_v2 import (W, H, FPS, BOLD, MED, REG, BG, CARD, GOLD, WHITE, GREY, PINK,
                     font, ease, lin, prog, text, pop_text, card, chip, sticker, underline, emoji, base)
from make_filiere import words, shine, glow_dot, GREEN
from classe import draw_classe

SFX = []  # (temps de scène, type, nom de scène) — rempli par sfx()


def caption(img, s, y, p, size=58):
    if p <= 0:
        return
    f = font(BOLD, size)
    w = f.getlength(s) + 80
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    a = lin(p)
    dy = (1 - ease(min(1, p))) * 40
    d.rounded_rectangle((W / 2 - w / 2, y - 62 + dy, W / 2 + w / 2, y + 62 + dy), 30, fill=(10, 14, 28, int(200 * a)))
    d.text((W / 2, y + dy), s, font=f, fill=WHITE + (int(255 * a),), anchor="mm")
    img.alpha_composite(lay)


def fade_window(t, t0, t1, fi=0.3, fo=0.3):
    return min(lin((t - t0) / fi), lin((t1 - t) / fo))


# ---------------- 1. la classe ----------------
def s_classe(img, t):
    img.alpha_composite(draw_classe(t).convert("RGBA"))
    caption(img, "Dans quelques semaines…", 330, fade_window(t, 0.3, 1.9))
    caption(img, "Parcoursup ouvre ses portes.", 330, fade_window(t, 2.3, 4.0))
    if t >= 8.3:
        img.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(255 * lin((t - 8.3) / 0.5)))))


# ---------------- 2. les dates ----------------
DATES = [("17", "DÉC. 2026", "Les formations 2027", "sont en ligne"),
         ("18", "JANV. 2027", "Inscriptions et vœux", "C'est là que tout commence"),
         ("11", "MARS 2027", "Dernier jour", "pour formuler tes vœux"),
         ("1er", "AVRIL 2027", "Dossier complet", "et vœux confirmés")]


def s_dates(img, t):
    words(img, "Parcoursup ouvre bientôt.", 250, 68, WHITE, t, 0.2, per=0.1, colors={0: GOLD})
    text(img, "Note ces dates :", 345, 46, GREY, path=MED, p=prog(t, 0.6, 0.35))
    ys = [540, 860, 1180, 1500]
    pl = prog(t, 0.7, 2.9)
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    if pl > 0:
        y1 = ys[0] + (ys[-1] - ys[0]) * lin(pl)
        d.line((150, ys[0], 150, y1), fill=GOLD + (220,), width=8)
        if pl < 1:
            glow_dot(d, 150, y1, 12, WHITE)
    img.alpha_composite(lay)
    for i, (day, mon, a, b) in enumerate(DATES):
        y = ys[i]
        p = prog(t, 0.75 + i * 0.95, 0.4)
        if p <= 0:
            continue
        hot = i == 1
        c = PINK if hot else GOLD
        lay = Image.new("RGBA", (W, 300), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        d.ellipse((150 - 22, 150 - 22, 150 + 22, 150 + 22), fill=c + (255,))
        d.rounded_rectangle((215, 30, W - 70, 270), 34, fill=CARD + (245,), outline=(c + (255,)) if hot else None, width=5)
        d.text((340, 128), day, font=font(BOLD, 92 if len(day) < 3 else 74), fill=c + (255,), anchor="mm")
        d.text((340, 205), mon, font=font(BOLD, 28), fill=GREY + (255,), anchor="mm")
        d.line((450, 70, 450, 230), fill=(60, 70, 105, 255), width=3)
        d.text((485, 125), a, font=font(BOLD, 42), fill=WHITE + (255,), anchor="lm")
        d.text((485, 182), b, font=font(MED, 31), fill=(c if hot else GREY) + (255,), anchor="lm")
        # retournement de carte (écrasement vertical)
        sc = max(0.02, ease(p))
        h = max(1, int(300 * sc))
        lay = lay.resize((W, h), Image.BILINEAR)
        if p < 1:
            lay.putalpha(lay.getchannel("A").point(lambda v: int(v * lin(p * 1.8))))
        img.alpha_composite(lay, (0, int(y - h / 2)))
        if hot and t > 4.6:
            k = ((t - 4.6) % 1.1) / 1.1
            ring = Image.new("RGBA", img.size, (0, 0, 0, 0))
            rd = ImageDraw.Draw(ring)
            e = 30 * k
            rd.rounded_rectangle((215 - e, y - 120 - e, W - 70 + e, y + 120 + e), 34 + e, outline=PINK + (int(200 * (1 - k)),), width=6)
            img.alpha_composite(ring)
    sticker(img, "Enregistre-les", W // 2, 1730, prog(t, 5.0, 0.3), rot=-3, bg=GOLD, size=40, emo="📌")


# ---------------- 3. le choix ----------------
CHIPS = ["BTS", "BUT", "Licence", "Prépa", "IFSI", "École d'ingé", "École de commerce", "Licence pro",
         "Apprentissage", "DN MADE", "DEUST", "Bachelor", "PASS", "L.AS", "IEP", "DCG", "CPGE", "Double licence"]
random.seed(11)
CH = [(random.uniform(120, W - 120), random.uniform(200, H - 200), random.uniform(-9, 9), random.uniform(-40, 40),
       random.uniform(-30, 30), random.random() * 6) for _ in CHIPS]


def s_choix(img, t):
    p0 = 1 - lin((t - 2.0) / 0.5)
    if p0 > 0:
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        text(lay, "Sur Parcoursup, il y a", 560, 56, WHITE, path=MED, p=prog(t, 0.0, 0.35))
        pc = prog(t, 0.3, 1.3)
        if pc > 0:
            n = int(23000 * (1 - (1 - lin(pc)) ** 3))
            s = f"{n:,}".replace(",", " ")
            pop_text(lay, s, 730, 210, GOLD, min(1.0, pc * 3))
        text(lay, "formations.", 890, 64, WHITE, p=prog(t, 1.2, 0.35))
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * p0)))
        img.alpha_composite(lay)
    # nuage de formations qui envahit l'écran
    if t > 1.9:
        cl = Image.new("RGBA", img.size, (0, 0, 0, 0))
        for i, (s, (x, y, rot, vx, vy, ph)) in enumerate(zip(CHIPS, CH)):
            p = prog(t, 2.0 + i * 0.07, 0.3)
            if p <= 0:
                continue
            xx = x + vx * (t - 2) + 18 * math.sin(t * 1.3 + ph)
            yy = y + vy * (t - 2) + 18 * math.cos(t * 1.1 + ph)
            f = font(BOLD, 44)
            w = int(f.getlength(s)) + 60
            ch = Image.new("RGBA", (w + 10, 100), (0, 0, 0, 0))
            cd = ImageDraw.Draw(ch)
            cd.rounded_rectangle((5, 5, w + 5, 95), 45, fill=(245, 247, 252, 255) if i % 3 else GOLD + (255,))
            cd.text((w / 2 + 5, 50), s, font=f, fill=BG + (255,), anchor="mm")
            sc = max(0.05, ease(p))
            ch = ch.resize((max(1, int(ch.width * sc)), max(1, int(ch.height * sc))), Image.BILINEAR).rotate(rot + 4 * math.sin(t + ph), expand=True, resample=Image.BICUBIC)
            cl.alpha_composite(ch, (int(xx - ch.width / 2), int(yy - ch.height / 2)))
        bl = lin((t - 3.5) / 0.5)
        if bl > 0:
            cl = cl.filter(ImageFilter.GaussianBlur(7 * bl))
            cl.putalpha(cl.getchannel("A").point(lambda v: int(v * (1 - 0.6 * bl))))
        img.alpha_composite(cl)
        if bl > 0:
            band = Image.new("RGBA", img.size, (0, 0, 0, 0))
            ImageDraw.Draw(band).rectangle((0, 820, W, 1220), fill=(8, 11, 24, int(215 * bl)))
            img.alpha_composite(band)
        words(img, "Et toi, tu choisis", 930, 76, WHITE, t, 3.7, per=0.09)
        words(img, "comment ?", 1040, 76, WHITE, t, 4.1, per=0.09)
        words(img, "Au hasard ?", 1150, 48, PINK, t, 4.7, per=0.1, path=MED)


# ---------------- 4. la solution ----------------
PX0, PY0, PX1, PY1 = 170, 520, W - 170, 1650
PSW, PSH = PX1 - PX0, PY1 - PY0


def phone_step1(t):
    im = Image.new("RGBA", (PSW, PSH), (245, 247, 252, 255))
    d = ImageDraw.Draw(im)
    d.text((PSW // 2, 110), "Quel métier", font=font(BOLD, 50), fill=BG, anchor="mm")
    d.text((PSW // 2, 172), "te fait envie ?", font=font(BOLD, 50), fill=BG, anchor="mm")
    d.rounded_rectangle((40, 250, PSW - 40, 360), 55, fill=WHITE, outline=(215, 220, 232), width=4)
    q = "infirmier"
    n = int(max(0, t - 1.0) * 9)
    f = font(BOLD, 46)
    if n <= 0:
        d.text((90, 305), "boulanger, kiné, pilote…", font=font(MED, 38), fill=(150, 155, 170), anchor="lm")
    else:
        d.text((90, 305), q[:n], font=f, fill=BG, anchor="lm")
        if n < len(q) and int(t * 4) % 2 == 0:
            w = f.getlength(q[:n]); d.rectangle((94 + w, 275, 99 + w, 335), fill=BG)
    d.ellipse((PSW - 140, 262, PSW - 54, 348), fill=GOLD)
    d.ellipse((PSW - 117, 284, PSW - 84, 317), outline=BG, width=6)
    d.line((PSW - 89, 312, PSW - 72, 329), fill=BG, width=7)
    pr = prog(t, 2.2, 0.35)
    if pr > 0:
        a = int(255 * pr); dy = int((1 - ease(pr)) * 40)
        d.rounded_rectangle((40, 430 + dy, PSW - 40, 760 + dy), 36, fill=BG + (a,))
        d.text((90, 510 + dy), "Infirmier", font=font(BOLD, 56), fill=WHITE + (a,), anchor="lm")
        d.text((90, 580 + dy), "≈ 3 ans après le bac", font=font(MED, 36), fill=GREY + (a,), anchor="lm")
        pressed = 2.85 <= t < 3.05
        bx0 = 90 if not pressed else 96
        d.rounded_rectangle((bx0, 640 + dy, PSW - bx0, 720 + dy), 40, fill=GOLD + (a,))
        d.text((PSW // 2, 680 + dy), "Voir les chemins", font=font(BOLD, 36), fill=BG + (a,), anchor="mm")
        if 2.85 <= t < 3.3:
            k = (t - 2.85) / 0.45
            r = 30 + 90 * k
            d.ellipse((PSW // 2 - r, 680 - r, PSW // 2 + r, 680 + r), outline=(255, 255, 255, int(220 * (1 - k))), width=6)
    return im


def phone_step2(t):
    im = Image.new("RGBA", (PSW, PSH), (245, 247, 252, 255))
    d = ImageDraw.Draw(im)
    d.text((50, 90), "Infirmier", font=font(BOLD, 60), fill=BG, anchor="lm")
    d.text((50, 150), "3 chemins pour y arriver", font=font(MED, 34), fill=(110, 115, 135), anchor="lm")
    rows = [("Direct en IFSI", "Après le bac", "Sur Parcoursup", True),
            ("Par l'aide-soignance", "Une entrée progressive", "Hors Parcoursup", False),
            ("En apprentissage", "Payé pendant tes études", "Sur Parcoursup", True)]
    for i, (a, b, lab, ps) in enumerate(rows):
        p = prog(t, 3.75 + i * 0.3, 0.35)
        if p <= 0:
            continue
        y = 230 + i * 215
        al = int(255 * p); dx = int((1 - ease(p)) * 80)
        d.rounded_rectangle((40 + dx, y, PSW - 40 + dx, y + 185), 32, fill=WHITE + (al,), outline=(222, 226, 236, al), width=4)
        d.ellipse((70 + dx, y + 35, 130 + dx, y + 95), fill=GOLD + (al,))
        d.text((100 + dx, y + 65), str(i + 1), font=font(BOLD, 36), fill=BG + (al,), anchor="mm")
        d.text((155 + dx, y + 60), a, font=font(BOLD, 40), fill=BG + (al,), anchor="lm")
        d.text((155 + dx, y + 108), b, font=font(MED, 30), fill=(110, 115, 135, al), anchor="lm")
        col = (30, 150, 95) if ps else (130, 135, 150)
        fw = font(BOLD, 24).getlength(lab) + 34
        d.rounded_rectangle((155 + dx, y + 133, 155 + dx + fw, y + 171), 19, fill=col + (al,))
        d.text((155 + dx + fw / 2, y + 152), lab, font=font(BOLD, 24), fill=WHITE + (al,), anchor="mm")
    ps = prog(t, 5.0, 0.35)
    if ps > 0:
        al = int(255 * ps)
        d.rounded_rectangle((40, 900, PSW - 40, 1030), 34, fill=BG + (al,))
        d.text((PSW // 2, 942), "Salaire de départ", font=font(MED, 30), fill=GREY + (al,), anchor="mm")
        d.text((PSW // 2, 990), "≈ 1 950 – 2 500 € brut/mois", font=font(BOLD, 38), fill=GOLD + (al,), anchor="mm")
    return im


def phone_step3(t):
    im = Image.new("RGBA", (PSW, PSH), (245, 247, 252, 255))
    d = ImageDraw.Draw(im)
    d.text((50, 90), "Ta lettre", font=font(BOLD, 60), fill=BG, anchor="lm")
    d.text((50, 150), "en 3 clics", font=font(MED, 34), fill=(110, 115, 135), anchor="lm")
    rows = ["Ton bac", "Ton expérience", "Tes qualités"]
    for i, r in enumerate(rows):
        y = 220 + i * 105
        d.rounded_rectangle((40, y, PSW - 40, y + 85), 28, fill=WHITE, outline=(222, 226, 236), width=4)
        d.text((80, y + 42), r, font=font(BOLD, 36), fill=BG, anchor="lm")
        pc = prog(t, 6.9 + i * 0.3, 0.25)
        if pc > 0:
            cx, cy = PSW - 95, y + 42
            d.ellipse((cx - 26, cy - 26, cx + 26, cy + 26), fill=GREEN + (int(255 * pc),))
            d.line((cx - 13, cy, cx - 3, cy + 11, cx + 15, cy - 10), fill=WHITE + (int(255 * pc),), width=6)
    pl = prog(t, 7.9, 0.3)
    if pl > 0:
        al = int(255 * pl)
        d.rounded_rectangle((40, 560, PSW - 40, 1010), 30, fill=WHITE + (al,), outline=(222, 226, 236, al), width=4)
        d.text((80, 615), "Madame, Monsieur,", font=font(BOLD, 32), fill=BG + (al,), anchor="lm")
        widths = [0.92, 0.85, 0.95, 0.7, 0.9, 0.82, 0.6]
        for j, wf in enumerate(widths):
            k = lin((t - 8.0 - j * 0.12) / 0.25)
            if k > 0:
                y = 675 + j * 46
                d.rounded_rectangle((80, y, 80 + int((PSW - 160) * wf * k), y + 18), 9, fill=(205, 210, 222, al))
    pb = prog(t, 8.8, 0.3)
    if pb > 0:
        al = int(255 * pb)
        d.rounded_rectangle((40, 1040, PSW - 40, 1110), 35, fill=GOLD + (al,))
        d.text((PSW // 2, 1075), "Copier ma lettre", font=font(BOLD, 34), fill=BG + (al,), anchor="mm")
    return im


def s_solution(img, t):
    words(img, "Trouve ta voie", 220, 82, GOLD, t, 0.0, per=0.1)
    words(img, "avant le 18 janvier.", 315, 58, WHITE, t, 0.35, per=0.08)
    steps = ["Métier", "Chemins", "Lettre"]
    cur = 0 if t < 3.45 else (1 if t < 6.45 else 2)
    ps = prog(t, 0.5, 0.35)
    if ps > 0:
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        f = font(BOLD, 30)
        x = W / 2 - 3 * 220 / 2
        for i, s in enumerate(steps):
            on = i == cur
            done = i < cur
            col = GOLD if on else ((70, 210, 140) if done else (60, 70, 105))
            d.rounded_rectangle((x + 10, 410, x + 210, 466), 28, fill=col + (255,))
            d.text((x + 110, 438), f"{i + 1}. {s}", font=f, fill=(BG if on or done else WHITE) + (255,), anchor="mm")
            x += 220
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * ps)))
        img.alpha_composite(lay)
    pc = prog(t, 0.4, 0.45)
    if pc <= 0:
        return
    ph = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ph)
    d.rounded_rectangle((PX0 - 20, PY0 - 20, PX1 + 20, PY1 + 20), 76, fill=(30, 36, 60, 255))
    scr = Image.new("RGBA", (PSW, PSH), (245, 247, 252, 255))
    # glissement horizontal entre les étapes
    def slide(a, b, t0, fa, fb):
        k = lin((t - t0) / 0.45); k = k * k * (3 - 2 * k)
        if k <= 0:
            scr.alpha_composite(fa(t)); return True
        if k < 1:
            A, B = fa(t), fb(t)
            off = int(PSW * k)
            scr.alpha_composite(A.crop((off, 0, PSW, PSH)), (0, 0))
            scr.alpha_composite(B.crop((0, 0, off, PSH)), (PSW - off, 0))
            return True
        return False
    if not slide(0, 1, 3.3, phone_step1, phone_step2):
        if not slide(1, 2, 6.3, phone_step2, phone_step3):
            scr.alpha_composite(phone_step3(t))
    mask = Image.new("L", (PSW, PSH), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, PSW, PSH), 58, fill=255)
    ph.paste(scr, (PX0, PY0), mask)
    if pc < 1:
        ph.putalpha(ph.getchannel("A").point(lambda v: int(v * pc)))
    img.alpha_composite(ph, (0, int((1 - ease(pc)) * 140)))


# ---------------- 5. la checklist ----------------
def s_check(img, t):
    words(img, "Avant le 18 janvier :", 320, 70, WHITE, t, 0.0, per=0.09, colors={2: GOLD, 3: GOLD})
    items = ["Choisis ton métier", "Repère tes chemins", "Trouve tes écoles", "Prépare ta lettre"]
    for i, s in enumerate(items):
        y = 560 + i * 210
        p = prog(t, 0.4 + i * 0.25, 0.35)
        if p <= 0:
            continue
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        card(lay, (110, y - 80, W - 110, y + 80), 1.0)
        d = ImageDraw.Draw(lay)
        pc = prog(t, 1.3 + i * 0.45, 0.25)
        bx, by = 200, y
        if pc > 0:
            d.rounded_rectangle((bx - 40, by - 40, bx + 40, by + 40), 18, fill=GREEN + (255,))
            k = lin(pc)
            pts = [(bx - 20, by), (bx - 5, by + 16), (bx + 22, by - 16)]
            if k < 0.5:
                e = (pts[0][0] + (pts[1][0] - pts[0][0]) * k * 2, pts[0][1] + (pts[1][1] - pts[0][1]) * k * 2)
                d.line((pts[0], e), fill=WHITE + (255,), width=9)
            else:
                e = (pts[1][0] + (pts[2][0] - pts[1][0]) * (k - 0.5) * 2, pts[1][1] + (pts[2][1] - pts[1][1]) * (k - 0.5) * 2)
                d.line((pts[0], pts[1], e), fill=WHITE + (255,), width=9, joint="curve")
        else:
            d.rounded_rectangle((bx - 40, by - 40, bx + 40, by + 40), 18, outline=(110, 120, 160, 255), width=5)
        d.text((280, y), s, font=font(BOLD, 50), fill=WHITE + (255,), anchor="lm")
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * lin(p))))
        img.alpha_composite(lay, (int((1 - ease(p)) * 120 * (1 if i % 2 == 0 else -1)), 0))
    words(img, "Le jour J, tu n'as plus qu'à cliquer.", 1450, 44, GOLD, t, 3.5, per=0.06, path=MED)


# ---------------- 6. fin ----------------
def s_outro(img, t):
    emoji(img, "🧭", W // 2, 330, 150, prog(t, 0.0, 0.45), rot=10 * math.sin(t * 2))
    words(img, "Parcoursup n'attend pas.", 540, 70, WHITE, t, 0.2, per=0.1)
    pop_text(img, "Trouve ta voie.", 700, 124, GOLD, prog(t, 0.9, 0.35))
    shine(img, (90, 610, W - 90, 790), t, 1.3, 0.7)
    words(img, "Maintenant.", 840, 60, WHITE, t, 1.5, per=0.1)
    pb = prog(t, 2.2, 0.35)
    if pb > 0:
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); a = int(255 * pb)
        f = font(BOLD, 92)
        w1, w2 = f.getlength("trouve"), f.getlength("tavoie")
        x0 = W // 2 - (w1 + w2) // 2; dy = (1 - ease(pb)) * 40
        d.text((x0, 1080 + dy), "trouve", font=f, fill=WHITE + (a,), anchor="lm")
        d.text((x0 + w1, 1080 + dy), "tavoie", font=f, fill=GOLD + (a,), anchor="lm")
        img.alpha_composite(lay)
    pulse = 1 + 0.04 * math.sin(t * 7) if t > 3.0 else 1
    p = prog(t, 2.7, 0.35)
    if p > 0:
        w, h = int(620 * pulse), int(140 * pulse)
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); a = int(255 * p)
        d.rounded_rectangle((W // 2 - w // 2, 1260 - h // 2, W // 2 + w // 2, 1260 + h // 2), h // 2, fill=PINK + (a,))
        d.text((W // 2, 1260), "LIEN EN BIO", font=font(BOLD, int(60 * pulse)), fill=WHITE + (a,), anchor="mm")
        img.alpha_composite(lay)
    text(img, "1er chemin gratuit · 30 métiers", 1400, 40, GREY, path=MED, p=prog(t, 3.2, 0.35))


SCENES = [("classe", s_classe, 8.8), ("dates", s_dates, 7.4), ("choix", s_choix, 6.4),
          ("solution", s_solution, 9.6), ("check", s_check, 5.4), ("outro", s_outro, 6.0)]
IMPACTS = {"dates": [0.2], "choix": [0.3, 1.6], "outro": [0.9]}
TOTAL = sum(d for _, _, d in SCENES)
OFF = {}
_o = 0
for n, _, d in SCENES:
    OFF[n] = _o; _o += d

# effets sonores (temps dans la scène)
EVENTS = [("classe", 0.0, "amb"), ("classe", 1.9, "click"), ("classe", 2.15, "dolly"), ("classe", 6.62, "click"),
          ("classe", 7.8, "zoom")] + [("classe", 4.15 + i / 15, "key") for i in range(18)] + \
         [("dates", 0.05, "boom")] + [("dates", 0.75 + i * 0.95, "flip") for i in range(4)] + [("dates", 5.0, "pop"),
          ("choix", 0.0, "swish")] + [("choix", 0.3 + i * 0.065, "tick") for i in range(20)] + \
         [("choix", 1.62, "boom")] + [("choix", 2.0 + i * 0.07, "bub") for i in range(0, 18, 2)] + [("choix", 3.6, "swish"),
          ("solution", 0.0, "swish")] + [("solution", 1.0 + i / 9, "key") for i in range(9)] + \
         [("solution", 2.85, "tap"), ("solution", 3.3, "swish"), ("solution", 5.0, "pop"), ("solution", 6.3, "swish")] + \
         [("solution", 6.9 + i * 0.3, "pop") for i in range(3)] + [("solution", 8.8, "pop"), ("check", 0.0, "swish")] + \
         [("check", 1.3 + i * 0.45, "pop") for i in range(4)] + [("outro", -0.8, "riser"), ("outro", 0.9, "boom")]


def render_frame(name, t):
    fn = dict((n, f) for n, f, _ in SCENES)[name]
    dur = dict((n, d) for n, _, d in SCENES)[name]
    img = base(OFF[name] + t, TOTAL)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fn(layer, t)
    if name == "classe":
        img.alpha_composite(layer)
        d = ImageDraw.Draw(img)
        d.rectangle((0, 0, W, 14), fill=(255, 255, 255, 30))
        d.rectangle((0, 0, int(W * t / TOTAL), 14), fill=GOLD)
        return img.convert("RGB")
    zoom, sx, sy = 1.0 + 0.025 * t / dur, 0.0, 0.0
    for it in IMPACTS.get(name, []):
        dt = t - it
        if 0 <= dt < 0.3:
            k = 1 - dt / 0.3
            zoom += 0.035 * k * k
            sx += 10 * k * math.sin(dt * 90)
    fin = lin(t / 0.35)
    last = name == SCENES[-1][0]
    fout = 1.0 if last else lin((dur - t) / 0.3)
    zoom *= 1 + 0.08 * (1 - ease(fin))
    sy += -(1 - fout) ** 2 * 140
    fade = min(fin, fout) if name != "dates" else fout
    if zoom != 1.0:
        nw, nh = int(W * zoom), int(H * zoom)
        layer = layer.resize((nw, nh), Image.BILINEAR)
        layer = layer.crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
    if fade < 1:
        layer.putalpha(layer.getchannel("A").point(lambda v: int(v * fade)))
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(layer, (int(sx), int(sy)))
    img.alpha_composite(canvas)
    if name == "dates" and t < 0.45:
        img.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(255 * (1 - t / 0.45) ** 1.5))))
    return img.convert("RGB")


# ---------------- audio ----------------
SR = 44100


def _env(n, a=0.005, dec=8.0):
    tt = np.arange(n) / SR
    e = np.exp(-dec * tt)
    na = max(1, int(a * SR)); e[:na] *= np.linspace(0, 1, na)
    return e


def _lp(x, alpha):
    y = np.empty_like(x); acc = 0.0
    al = np.broadcast_to(alpha, x.shape)
    for i in range(len(x)):
        acc += al[i] * (x[i] - acc); y[i] = acc
    return y


def synth(kind, rng):
    if kind == "click":
        n = int(0.05 * SR); tt = np.arange(n) / SR
        return 0.5 * rng.standard_normal(n) * _env(n, 0.0005, 160) + 0.35 * np.sin(2 * np.pi * 2600 * tt) * _env(n, 0.0005, 90)
    if kind == "key":
        n = int(0.03 * SR)
        return 0.22 * rng.standard_normal(n) * _env(n, 0.0005, 220) * rng.uniform(0.6, 1)
    if kind == "tap":
        n = int(0.08 * SR); tt = np.arange(n) / SR
        return 0.45 * np.sin(2 * np.pi * (300 + 900 * np.exp(-40 * tt)) * tt) * _env(n, 0.001, 40)
    if kind == "tick":
        n = int(0.03 * SR); tt = np.arange(n) / SR
        return 0.18 * np.sin(2 * np.pi * 2200 * tt) * _env(n, 0.0005, 150)
    if kind in ("pop", "bub", "flip"):
        n = int(0.12 * SR); tt = np.arange(n) / SR
        f0 = {"pop": 520, "bub": rng.uniform(380, 700), "flip": 900}[kind]
        amp = {"pop": 0.45, "bub": 0.16, "flip": 0.22}[kind]
        s = amp * np.sin(2 * np.pi * f0 * (1 + 0.8 * (1 - np.exp(-30 * tt))) * tt) * _env(n, 0.002, 30)
        if kind == "flip":
            s += 0.2 * rng.standard_normal(n) * _env(n, 0.001, 70)
        return s
    if kind == "boom":
        n = int(0.9 * SR); tt = np.arange(n) / SR
        f = 45 + 70 * np.exp(-12 * tt)
        return 0.9 * np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.002, 5) + 0.25 * rng.standard_normal(n) * _env(n, 0.001, 60)
    if kind in ("swish", "dolly", "zoom"):
        d = {"swish": 0.45, "dolly": 1.9, "zoom": 0.95}[kind]
        n = int(d * SR); u = np.linspace(0, 1, n)
        nz = rng.standard_normal(n)
        if kind == "zoom":
            alpha = 0.02 + 0.35 * u ** 2; env = u ** 2.2 * (1 - u) ** 0.2
        else:
            alpha = 0.03 + 0.25 * np.sin(np.pi * u) ** 2; env = np.sin(np.pi * u) ** 2
        amp = {"swish": 0.5, "dolly": 0.32, "zoom": 0.6}[kind]
        return amp * _lp(nz, alpha) * env * 3
    if kind == "riser":
        n = int(0.8 * SR); u = np.linspace(0, 1, n); tt = np.arange(n) / SR
        s = 0.3 * _lp(rng.standard_normal(n), 0.02 + 0.3 * u) * u ** 2 * 3
        s += 0.12 * np.sin(2 * np.pi * np.cumsum(200 + 700 * u ** 2) / SR) * u ** 2
        return s
    if kind == "amb":
        n = int(8.6 * SR); u = np.linspace(0, 1, n)
        return 0.05 * _lp(rng.standard_normal(n), 0.015) * 4 * np.minimum(1, np.minimum(u * 8, (1 - u) * 6))
    return np.zeros(1)


def build_audio(path):
    rng = np.random.default_rng(5)
    total = int((TOTAL + 0.5) * SR)
    L = np.zeros(total); R = np.zeros(total)
    for scene, t, kind in EVENTS:
        st = int((OFF[scene] + t) * SR)
        s = synth(kind, rng)
        pan = {"key": rng.uniform(-0.2, 0.2), "bub": rng.uniform(-0.6, 0.6)}.get(kind, 0.0)
        e = min(total, st + len(s))
        if st < 0 or st >= total:
            continue
        L[st:e] += s[:e - st] * (1 - max(0, pan)); R[st:e] += s[:e - st] * (1 + min(0, pan))
    pk = max(np.abs(L).max(), np.abs(R).max(), 1e-6)
    L, R = L / pk * 0.7, R / pk * 0.7
    data = (np.stack([L, R], 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "still":
        render_frame(sys.argv[2], float(sys.argv[3])).save(sys.argv[4])
    elif mode == "audio":
        build_audio("parts_p/sfx.wav")
    else:
        os.makedirs("parts_p", exist_ok=True)
        only = sys.argv[2:] or [n for n, _, _ in SCENES]
        for n, fn, d in SCENES:
            if n not in only:
                continue
            tmp = f"parts_p/{n}.tmp.mp4"
            p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                  "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast",
                                  "-crf", "18", "-pix_fmt", "yuv420p", tmp], stdin=subprocess.PIPE)
            for i in range(int(round(d * FPS))):
                p.stdin.write(render_frame(n, i / FPS).tobytes())
            p.stdin.close()
            if p.wait() == 0:
                os.replace(tmp, f"parts_p/{n}.mp4")
            else:
                sys.exit("fail " + n)
        with open("parts_p/list.txt", "w") as f:
            for n, _, _ in SCENES:
                f.write(f"file '{n}.mp4'\n")
        build_audio("parts_p/sfx.wav")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "parts_p/list.txt",
                        "-c", "copy", "parts_p/video.mp4"], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "parts_p/video.mp4", "-i", "parts_p/sfx.wav",
                        "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
                        "-movflags", "+faststart", "pub_parcoursup_tiktok.mp4.tmp.mp4"], check=True)
        os.replace("pub_parcoursup_tiktok.mp4.tmp.mp4", "pub_parcoursup_tiktok.mp4")
        print("done", TOTAL)
