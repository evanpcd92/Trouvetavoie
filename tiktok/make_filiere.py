import subprocess, math, os, sys
from PIL import Image, ImageDraw
from make_v2 import (W, H, FPS, BOLD, MED, REG, BG, CARD, GOLD, WHITE, GREY, PINK,
                     font, ease, lin, prog, text, pop_text, card, chip, sticker, underline,
                     emoji, _emo_img, base)

GREEN = (70, 210, 140)


def words(img, line, y, size, color, t, t0, per=0.09, path=BOLD, colors=None):
    """mot par mot : chaque mot monte et apparaît"""
    f = font(path, size)
    ws = line.split(" ")
    sp = f.getlength(" ")
    total = sum(f.getlength(w) for w in ws) + sp * (len(ws) - 1)
    x = W / 2 - total / 2
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for i, w in enumerate(ws):
        p = prog(t, t0 + i * per, 0.3)
        if p > 0:
            c = (colors or {}).get(i, color)
            d.text((x, y + (1 - ease(p)) * 55), w, font=f, fill=c + (int(255 * lin(p)),), anchor="lm")
        x += f.getlength(w) + sp
    img.alpha_composite(lay)


def strike(img, x0, x1, y, p, color=PINK, h=10):
    if p <= 0:
        return
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((x0, y - h / 2, x0 + (x1 - x0) * lin(p), y + h / 2), h // 2, fill=color + (255,))


def shine(img, box, t, t0, dur=0.6):
    """reflet lumineux qui balaie une zone"""
    p = (t - t0) / dur
    if not 0 <= p <= 1:
        return
    x0, y0, x1, y1 = box
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    cx = x0 - 200 + (x1 - x0 + 400) * p
    for k, a in ((90, 22), (55, 35), (25, 55)):
        d.polygon([(cx - k, y1), (cx - k + 120, y0), (cx + k + 120, y0), (cx + k, y1)], fill=(255, 255, 255, a))
    mask = Image.new("L", img.size, 0)
    mask.paste(img.getchannel("A"), (0, 0))
    lay.putalpha(Image.composite(lay.getchannel("A"), Image.new("L", img.size, 0), mask.point(lambda v: 255 if v > 40 else 0)))
    img.alpha_composite(lay)


def bez(p0, p1, p2, p3, n=90):
    out = []
    for i in range(n + 1):
        u = i / n
        a, b, c, d = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out


def glow_dot(d, x, y, r, col):
    for k, a in ((3.2, 25), (2.2, 50), (1.5, 90), (1.0, 255)):
        d.ellipse((x - r * k, y - r * k, x + r * k, y + r * k), fill=col + (a,))


def stamp(img, s, x, y, p, rot=-10, col=PINK, size=88):
    if p <= 0:
        return
    f = font(BOLD, size)
    tw = int(f.getlength(s))
    w, h = tw + 80, int(size * 1.7)
    lay = Image.new("RGBA", (w + 20, h + 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle((10, 10, w + 10, h + 10), 20, outline=col + (255,), width=10)
    d.text(((w + 20) / 2, (h + 20) / 2), s, font=f, fill=col + (255,), anchor="mm")
    sc = 1 + 1.4 * (1 - ease(p))
    lay = lay.resize((max(1, int(lay.width * sc)), max(1, int(lay.height * sc))), Image.LANCZOS)
    lay = lay.rotate(rot, resample=Image.BICUBIC, expand=True)
    lay.putalpha(lay.getchannel("A").point(lambda v: int(v * lin(p * 1.6))))
    img.alpha_composite(lay, (int(x - lay.width / 2), int(y - lay.height / 2)))


# ---------------- scènes ----------------
def s_hook(img, t):
    words(img, "On t'a déjà dit que", 600, 66, WHITE, t, 0.1)
    words(img, "ta filière décidait", 700, 66, WHITE, t, 0.45, colors={1: GOLD})
    words(img, "de ton avenir ?", 800, 66, WHITE, t, 0.8)
    pop_text(img, "FAUX.", 1060, 230, PINK, prog(t, 1.9, 0.35))
    words(img, "Et on va te le prouver.", 1280, 48, GREY, t, 2.6, per=0.07, path=MED)


def s_cliches(img, t):
    chip(img, "CE QU'ON ENTEND", 300, prog(t, 0.0, 0.3), bg=PINK, fg=WHITE)
    qs = ["« Le général, c'est pour les bons »",
          "« Le pro, c'est une voie de garage »",
          "« Le techno, c'est ni l'un ni l'autre »"]
    f = font(BOLD, 38)
    for i, q in enumerate(qs):
        y = 560 + i * 230
        p = prog(t, 0.3 + i * 0.35, 0.35)
        sp = prog(t, 1.7 + i * 0.4, 0.3)
        dim = 1 - 0.3 * lin(sp)
        if p <= 0:
            continue
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        card(lay, (90, y - 85, W - 90, y + 85), 1.0)
        d = ImageDraw.Draw(lay)
        d.text((W // 2, y), q, font=f, fill=WHITE + (255,), anchor="mm")
        tw = f.getlength(q)
        a = lay.getchannel("A").point(lambda v: int(v * lin(p) * dim))
        lay.putalpha(a)
        dx = int((1 - ease(p)) * 160 * (1 if i % 2 == 0 else -1))
        img.alpha_composite(lay.crop((max(0, -dx), 0, W - max(0, dx), H)), (max(0, dx), 0))
        strike(img, W / 2 - tw / 2 - 20, W / 2 + tw / 2 + 20, y + 2, sp, h=7)
    stamp(img, "CLICHÉS", W // 2, 1330, prog(t, 3.2, 0.3), rot=-8)


def s_verite(img, t):
    chip(img, "LA VÉRITÉ", 260, prog(t, 0.0, 0.3))
    text(img, "Chaque filière a ses chemins", 375, 58, WHITE, p=prog(t, 0.15, 0.35))
    rows = [("BAC PRO", ["BTS", "Licence pro"]),
            ("BAC TECHNO", ["BUT", "École d'ingénieur"]),
            ("CAP", ["Brevet pro", "Ta propre boîte"]),
            ("BAC GÉNÉRAL", ["Licence", "Master"])]
    fl, fs = font(BOLD, 34), font(BOLD, 44)
    for i, (lab, steps) in enumerate(rows):
        y = 560 + i * 245
        t0 = 0.6 + i * 1.1
        p = prog(t, t0, 0.35)
        if p <= 0:
            continue
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        card(lay, (90, y - 95, W - 90, y + 95), 1.0)
        d = ImageDraw.Draw(lay)
        lw = fl.getlength(lab) + 44
        d.rounded_rectangle((125, y - 72, 125 + lw, y - 22), 25, outline=GOLD + (255,), width=4)
        d.text((125 + lw / 2, y - 47), lab, font=fl, fill=GOLD + (255,), anchor="mm")
        x = 130
        for j, s in enumerate(steps):
            ps = prog(t, t0 + 0.35 + j * 0.4, 0.3)
            if j > 0:
                aw = 70
                pa = prog(t, t0 + 0.2 + j * 0.4, 0.25)
                if pa > 0:
                    d.line((x + 10, y + 38, x + 10 + (aw - 25) * lin(pa), y + 38), fill=GOLD + (255,), width=7)
                    if pa >= 1:
                        d.polygon([(x + aw - 22, y + 24), (x + aw - 22, y + 52), (x + aw, y + 38)], fill=GOLD + (255,))
                x += aw + 18
            if ps > 0:
                d.text((x, y + 38 + (1 - ease(ps)) * 30), s, font=fs, fill=WHITE + (int(255 * lin(ps)),), anchor="lm")
            x += fs.getlength(s) + 10
        if prog(t, t0 + 1.2, 0.3) > 0:
            pc = prog(t, t0 + 1.2, 0.3)
            d.ellipse((W - 175, y - 30, W - 115, y + 30), fill=GREEN + (int(255 * pc),))
            d.line((W - 160, y, W - 148, y + 13, W - 128, y - 12), fill=WHITE + (int(255 * pc),), width=7)
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * lin(p))))
        img.alpha_composite(lay, (0, int((1 - ease(p)) * 60)))
    sticker(img, "Toutes mènent quelque part", W // 2, 1560, prog(t, 6.0, 0.3), rot=-3, bg=GOLD, size=40)


def s_converge(img, t):
    words(img, "Même destination.", 290, 72, WHITE, t, 0.0, per=0.12)
    words(img, "Routes différentes.", 385, 72, GOLD, t, 0.45, per=0.12)
    dest = (540, 730)
    starts = [(200, 1430), (540, 1430), (880, 1430)]
    labs = ["Bac pro", "Bac techno", "Bac général"]
    ways = ["BTS + prépa ATS", "BUT", "Prépa ou fac"]
    cols = [PINK, (110, 160, 255), GOLD]
    paths = [bez(starts[0], (200, 1060), (540, 1000), dest),
             bez(starts[1], (540, 1200), (540, 900), dest),
             bez(starts[2], (880, 1060), (540, 1000), dest)]
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for i in range(3):
        pp = prog(t, 1.2 + i * 0.35, 1.6)
        pts = paths[i]
        n = int(lin(pp) * (len(pts) - 1))
        if n >= 1:
            d.line(pts[:n + 1], fill=cols[i] + (110,), width=26, joint="curve")
            d.line(pts[:n + 1], fill=cols[i] + (255,), width=10, joint="curve")
        if 0 < pp < 1:
            glow_dot(d, pts[n][0], pts[n][1], 14, WHITE)
        if pp >= 1:  # particules qui circulent en boucle
            for k in range(3):
                u = ((t - 2.8) * 0.45 + k / 3 + i * 0.1) % 1
                q = pts[int(u * (len(pts) - 1))]
                glow_dot(d, q[0], q[1], 7, WHITE)
    img.alpha_composite(lay)
    for i in range(3):
        sx, sy = starts[i]
        p = prog(t, 0.8 + i * 0.12, 0.3)
        if p > 0:
            lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
            d = ImageDraw.Draw(lay)
            a = int(255 * lin(p))
            d.ellipse((sx - 26, sy - 26, sx + 26, sy + 26), fill=cols[i] + (a,))
            f = font(BOLD, 36)
            w = f.getlength(labs[i]) + 40
            d.rounded_rectangle((sx - w / 2, sy + 50, sx + w / 2, sy + 110), 30, fill=CARD + (a,))
            d.text((sx, sy + 80), labs[i], font=f, fill=WHITE + (a,), anchor="mm")
            img.alpha_composite(lay, (0, int((1 - ease(p)) * 40)))
        q = paths[i][45]
        pw = prog(t, 1.2 + i * 0.35 + 0.8, 0.3)
        if pw > 0:
            lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
            d = ImageDraw.Draw(lay)
            f = font(BOLD, 30)
            w = f.getlength(ways[i]) + 34
            qx = min(max(q[0], w / 2 + 20), W - w / 2 - 20)
            qy = q[1] + (60 if i == 1 else 0)
            a = int(255 * lin(pw))
            d.rounded_rectangle((qx - w / 2, qy - 30, qx + w / 2, qy + 30), 30, fill=(245, 247, 252, a))
            d.text((qx, qy), ways[i], font=f, fill=BG + (a,), anchor="mm")
            img.alpha_composite(lay)
    pd = prog(t, 3.0, 0.4)
    if pd > 0:
        pulse = 1 + 0.05 * math.sin((t - 3.0) * 6) if t > 3.4 else 1
        r = 95 * ease(pd) * pulse
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        for k, a in ((1.6, 30), (1.3, 60)):
            d.ellipse((dest[0] - r * k, dest[1] - r * k, dest[0] + r * k, dest[1] + r * k), fill=GOLD + (int(a * lin(pd)),))
        d.ellipse((dest[0] - r, dest[1] - r, dest[0] + r, dest[1] + r), fill=GOLD + (int(255 * lin(pd)),))
        img.alpha_composite(lay)
        emoji(img, "🛠️", dest[0], dest[1], 95, pd)
        text(img, "INGÉNIEUR", 500, 56, GOLD, p=prog(t, 3.2, 0.3))
    words(img, "Aucune n'est plus « noble » que l'autre.", 1640, 40, WHITE, t, 4.2, per=0.06, path=MED)


def s_message(img, t):
    words(img, "Personne", 560, 110, WHITE, t, 0.0)
    words(img, "n'est au-dessus", 690, 96, WHITE, t, 0.3, per=0.12)
    words(img, "de personne.", 815, 96, WHITE, t, 0.65, per=0.12)
    words(img, "Tout le monde a juste besoin de", 1040, 50, GREY, t, 1.7, per=0.06, path=MED)
    p = prog(t, 2.4, 0.4)
    pop_text(img, "trouver SA voie.", 1170, 96, GOLD, p)
    underline(img, 1240, 700, prog(t, 2.8, 0.35), color=GOLD, h=12)
    shine(img, (100, 1090, W - 100, 1250), t, 3.1, 0.7)


def s_site(img, t):
    words(img, "trouvetavoie part", 250, 60, WHITE, t, 0.0, colors={0: GOLD})
    words(img, "de TA filière", 335, 60, WHITE, t, 0.25, colors={1: GOLD})
    pc = prog(t, 0.5, 0.45)
    if pc <= 0:
        return
    ph = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ph)
    x0, y0, x1, y1 = 150, 450, W - 150, 1560
    d.rounded_rectangle((x0 - 18, y0 - 18, x1 + 18, y1 + 18), 70, fill=(30, 36, 60, 255))
    d.rounded_rectangle((x0, y0, x1, y1), 56, fill=(245, 247, 252, 255))
    d.rounded_rectangle((W // 2 - 70, y0 + 22, W // 2 + 70, y0 + 36), 7, fill=(210, 214, 225, 255))
    d.rounded_rectangle((x0 + 40, y0 + 70, x1 - 40, y0 + 84), 7, fill=(220, 224, 235, 255))
    d.rounded_rectangle((x0 + 40, y0 + 70, x0 + 40 + int((x1 - x0 - 80) * 0.1), y0 + 84), 7, fill=GOLD + (255,))
    d.text((W // 2, y0 + 170), "Tu es dans quelle voie", font=font(BOLD, 46), fill=BG + (255,), anchor="mm")
    d.text((W // 2, y0 + 230), "en ce moment ?", font=font(BOLD, 46), fill=BG + (255,), anchor="mm")
    d.text((W // 2, y0 + 290), "On adapte la suite à ton parcours.", font=font(REG, 28), fill=(120, 125, 145, 255), anchor="mm")
    opts = ["Bac général", "Bac technologique", "Bac professionnel", "CAP", "Je me réoriente"]
    hl = int((t - 1.5) / 0.38) if t > 1.5 else -1
    for i, o in enumerate(opts):
        oy = y0 + 360 + i * 125
        pi = prog(t, 0.8 + i * 0.1, 0.3)
        if pi <= 0:
            continue
        sel = (i == hl) or (hl >= len(opts))
        fill = GOLD if sel else (232, 236, 245)
        d.rounded_rectangle((x0 + 40, oy, x1 - 40, oy + 100), 28, fill=fill + (int(255 * pi),))
        d.text((W // 2, oy + 50), o, font=font(BOLD, 40), fill=BG + (int(255 * pi),), anchor="mm")
    pr = prog(t, 3.6, 0.4)
    if pr > 0:
        d.rounded_rectangle((x0 + 40, y1 - 140, x1 - 40, y1 - 40), 28, fill=BG + (int(255 * pr),))
        d.text((W // 2, y1 - 90), "Tes chemins, depuis TON bac", font=font(BOLD, 36), fill=WHITE + (int(255 * pr),), anchor="mm")
    if pc < 1:
        ph.putalpha(ph.getchannel("A").point(lambda v: int(v * pc)))
    img.alpha_composite(ph, (0, int((1 - ease(pc)) * 120)))
    sticker(img, "Gratuit pour commencer", W // 2, 1680, prog(t, 4.2, 0.3), rot=-3, bg=GOLD, size=40)


def s_outro(img, t):
    emoji(img, "🧭", W // 2, 360, 150, prog(t, 0.0, 0.45), rot=10 * math.sin(t * 2))
    words(img, "Ta filière, c'est ton", 600, 64, WHITE, t, 0.2, per=0.08)
    pop_text(img, "point de départ.", 720, 104, GOLD, prog(t, 0.7, 0.35))
    words(img, "Pas ta destination.", 860, 70, WHITE, t, 1.3, per=0.1)
    pb = prog(t, 2.1, 0.35)
    if pb > 0:
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); a = int(255 * pb)
        f = font(BOLD, 92)
        w1, w2 = f.getlength("trouve"), f.getlength("tavoie")
        x0 = W // 2 - (w1 + w2) // 2; dy = (1 - ease(pb)) * 40
        d.text((x0, 1080 + dy), "trouve", font=f, fill=WHITE + (a,), anchor="lm")
        d.text((x0 + w1, 1080 + dy), "tavoie", font=f, fill=GOLD + (a,), anchor="lm")
        img.alpha_composite(lay)
    shine(img, (150, 1010, W - 150, 1150), t, 2.6, 0.7)
    pulse = 1 + 0.04 * math.sin(t * 7) if t > 2.9 else 1
    p = prog(t, 2.6, 0.35)
    if p > 0:
        w, h = int(620 * pulse), int(140 * pulse)
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); a = int(255 * p)
        d.rounded_rectangle((W // 2 - w // 2, 1260 - h // 2, W // 2 + w // 2, 1260 + h // 2), h // 2, fill=PINK + (a,))
        d.text((W // 2, 1260), "LIEN EN BIO", font=font(BOLD, int(60 * pulse)), fill=WHITE + (a,), anchor="mm")
        img.alpha_composite(lay)
    text(img, "1er chemin gratuit · 30 métiers", 1400, 40, GREY, path=MED, p=prog(t, 3.1, 0.35))


SCENES = [("hook", s_hook, 4.0), ("cliches", s_cliches, 5.0), ("verite", s_verite, 7.6),
          ("converge", s_converge, 7.2), ("message", s_message, 4.8), ("site", s_site, 6.2),
          ("outro", s_outro, 5.4)]
IMPACTS = {"hook": [1.9], "cliches": [1.7, 2.1, 2.5, 3.2], "converge": [3.0], "message": [0.0, 2.4], "outro": [0.7]}
SHAKE = {"hook": [1.9], "cliches": [3.2]}
TOTAL = sum(d for _, _, d in SCENES)
OFF = {}
_o = 0
for n, _, d in SCENES:
    OFF[n] = _o; _o += d


def render_frame(name, t):
    fn = dict((n, f) for n, f, _ in SCENES)[name]
    dur = dict((n, d) for n, _, d in SCENES)[name]
    img = base(OFF[name] + t, TOTAL)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fn(layer, t)
    zoom, sx, sy = 1.0 + 0.025 * t / dur, 0.0, 0.0
    for it in IMPACTS.get(name, []):
        dt = t - it
        if 0 <= dt < 0.3:
            k = 1 - dt / 0.3
            zoom += 0.035 * k * k
    for it in SHAKE.get(name, []):
        dt = t - it
        if 0 <= dt < 0.35:
            k = 1 - dt / 0.35
            sx += 18 * k * math.sin(dt * 90)
            sy += 12 * k * math.cos(dt * 70)
    # transition : zoom avant à l'entrée, glissement + flou de vitesse simulé à la sortie
    fin = lin(t / 0.35)
    last = name == SCENES[-1][0]
    fout = 1.0 if last else lin((dur - t) / 0.3)
    zoom *= 1 + 0.08 * (1 - ease(fin))
    sy += -(1 - fout) ** 2 * 140
    fade = min(fin, fout)
    if zoom != 1.0:
        nw, nh = int(W * zoom), int(H * zoom)
        layer = layer.resize((nw, nh), Image.BILINEAR)
        layer = layer.crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
    if fade < 1:
        layer.putalpha(layer.getchannel("A").point(lambda v: int(v * fade)))
    ox, oy = int(sx), int(sy)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(layer, (ox, oy))
    img.alpha_composite(canvas)
    # flash blanc sur le « FAUX. »
    if name == "hook" and 1.9 <= t < 2.1:
        img.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(150 * (1 - (t - 1.9) / 0.2)))))
    return img.convert("RGB")


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "still":
        render_frame(sys.argv[2], float(sys.argv[3])).save(sys.argv[4])
    else:
        os.makedirs("parts_f", exist_ok=True)
        only = sys.argv[2:] or [n for n, _, _ in SCENES]
        for n, fn, d in SCENES:
            if n not in only:
                continue
            tmp = f"parts_f/{n}.tmp.mp4"
            p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                  "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast",
                                  "-crf", "18", "-pix_fmt", "yuv420p", tmp], stdin=subprocess.PIPE)
            for i in range(int(round(d * FPS))):
                p.stdin.write(render_frame(n, i / FPS).tobytes())
            p.stdin.close()
            if p.wait() == 0:
                os.replace(tmp, f"parts_f/{n}.mp4")
            else:
                sys.exit("fail " + n)
        with open("parts_f/list.txt", "w") as f:
            for n, _, _ in SCENES:
                f.write(f"file '{n}.mp4'\n")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "parts_f/list.txt",
                        "-c", "copy", "-movflags", "+faststart", "pub_filieres_tiktok.mp4"], check=True)
        print("done", TOTAL)
