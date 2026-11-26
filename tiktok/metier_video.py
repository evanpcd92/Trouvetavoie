# Générateur de vidéos TikTok « présentation d'un métier » pour trouvetavoie (but, quotidien, qualités, salaire ; jamais les parcours).
# Usage :
#   python3 metier_video.py auto            -> métier du jour (rotation sur 30 jours)
#   python3 metier_video.py <cle_metier>    -> un métier précis (ex. infirmier)
#   python3 metier_video.py still <cle> <scene> <t> out.png
# Sortie : out/<date>_<cle>.mp4 + out/<date>_<cle>_description.txt
import json, math, os, re, subprocess, sys, datetime, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.chdir(HERE)
from make_v2 import (W, H, FPS, BOLD, MED, REG, BG, CARD, GOLD, WHITE, GREY, PINK,
                     font, ease, lin, prog, text, pop_text, chip, sticker, underline, emoji, _emo_img, base)
from make_filiere import words, shine, glow_dot, GREEN
from make_psup import synth

DATA = json.load(open(os.path.join(HERE, "metiers.json"), encoding="utf-8"))
ORDER = ["infirmier", "developpeur", "psychologue", "pilote", "kine", "commercial", "medecin", "policier",
         "architecte", "veterinaire", "sport", "journaliste", "electricien", "prof", "communitymanager",
         "pharmacien", "sagefemme", "graphiste", "cuisinier", "ingenieur", "pompier", "comptable", "dentiste",
         "orthophoniste", "mecanicien", "educateur", "militaire", "marketing", "aidesoignant", "avocat",
         "osteo", "datascientist", "coiffeur", "pnc", "notaire", "patissier", "cyber", "asv", "immobilier",
         "jeuxvideo", "manip", "estheticien", "banque", "monteur", "puericulture", "plombier", "dieteticien",
         "rh", "opticien", "assistantsocial",
         "ergo", "psychomot", "preparateur", "ambulancier", "techlabo", "douanier", "controleur", "maitrenageur", "soigneur", "agriculteur", "conducteur", "evenementiel", "uxdesigner", "photographe", "ingeson", "menuisier", "boulanger", "paysagiste", "eje", "magistrat", "juriste", "podologue", "orthoptiste", "aes", "profsecond", "animateur", "archiint", "chargecom", "anim3d", "reseaux", "maintenance", "aeronautique", "logistique", "styliste"]
EMO = {"avocat": "⚖️", "infirmier": "🩺", "electricien": "⚡", "medecin": "👨‍⚕️", "ingenieur": "🛠️",
       "psychologue": "🧠", "sport": "🏋️", "kine": "💪", "commercial": "🤝", "comptable": "📊",
       "developpeur": "💻", "prof": "🍎", "veterinaire": "🐶", "policier": "🚓", "communitymanager": "📱",
       "pharmacien": "💊", "sagefemme": "👶", "dentiste": "🦷", "orthophoniste": "🗣️", "aidesoignant": "🤲",
       "educateur": "🧩", "architecte": "📐", "pilote": "✈️", "journaliste": "🎙️", "graphiste": "🎨",
       "cuisinier": "👨‍🍳", "mecanicien": "🔧", "pompier": "🚒", "militaire": "🎖️", "marketing": "📈",
       "osteo": "🦴", "dieteticien": "🥗", "opticien": "👓", "manip": "🩻", "puericulture": "🍼",
       "assistantsocial": "🤝", "datascientist": "📊", "cyber": "🔐", "jeuxvideo": "🎮", "notaire": "📜",
       "banque": "🏦", "immobilier": "🏠", "rh": "🧑‍💼", "patissier": "🧁", "coiffeur": "💇", "estheticien": "💅",
       "plombier": "🔧", "monteur": "🎬", "pnc": "🛫", "asv": "🐾",
       "ergo": "🦽", "psychomot": "🤸", "preparateur": "🧴", "ambulancier": "🚑", "techlabo": "🔬", "douanier": "🛃", "controleur": "🛬", "maitrenageur": "🏊", "soigneur": "🦒", "agriculteur": "🚜", "conducteur": "🏗️", "evenementiel": "🎉", "uxdesigner": "📲", "photographe": "📸", "ingeson": "🎧", "menuisier": "🪚", "boulanger": "🥖", "paysagiste": "🌳", "eje": "🧸", "magistrat": "🧑‍⚖️", "juriste": "📑", "podologue": "🦶", "orthoptiste": "👁️", "aes": "🧓", "profsecond": "📚", "animateur": "⛺", "archiint": "🛋️", "chargecom": "📣", "anim3d": "🎞️", "reseaux": "🌐", "maintenance": "⚙️", "aeronautique": "🛩️", "logistique": "📦", "styliste": "👗"}
PSL = {"P": ("Sur Parcoursup", (30, 150, 95)), "H": ("Hors Parcoursup", (130, 135, 150)),
       "A": ("Après la 3e / apprentissage", (90, 120, 210)), "X": ("Selon l'école", (200, 140, 40))}
VIO = (130, 118, 255)


def clean(s):
    return (s or "").replace(" ", " ").replace("\xa0", " ").replace("’", "'")


def wrap(s, f, maxw):
    out, line = [], ""
    for w_ in s.split(" "):
        t = (line + " " + w_).strip()
        if f.getlength(t) <= maxw:
            line = t
        else:
            if line:
                out.append(line)
            line = w_
    if line:
        out.append(line)
    return out


def fit(s, path, size, maxw, minsize=26):
    while size > minsize and font(path, size).getlength(s) > maxw:
        size -= 2
    return size


def first_sentence(s, maxc=150):
    s = clean(s)
    parts = re.split(r"(?<=[.!?])\s", s)
    out = parts[0]
    if len(out) > maxc:
        out = out[:maxc].rsplit(" ", 1)[0] + "…"
    return out


def para(img, s, y, size, color, maxw, t, t0, path=MED, lh=1.32, per=0.05, x0=None):
    """paragraphe qui apparaît ligne par ligne"""
    f = font(path, size)
    lines = wrap(s, f, maxw)
    for i, ln in enumerate(lines):
        p = prog(t, t0 + i * per * 3, 0.35)
        if p <= 0:
            continue
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        x = W / 2 if x0 is None else x0
        d.text((x, y + i * size * lh + (1 - ease(p)) * 30), ln, font=f, fill=color + (int(255 * lin(p)),),
               anchor="mm" if x0 is None else "lm")
        img.alpha_composite(lay)
    return len(lines)


def panel(img, box, p, fill=CARD, radius=40, outline=None, glow=None):
    if p <= 0:
        return
    x0, y0, x1, y1 = box
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    if glow:
        g = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(g).rounded_rectangle((x0, y0, x1, y1), radius, fill=glow + (90,))
        lay.alpha_composite(g.filter(ImageFilter.GaussianBlur(30)))
        d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x0, y0 + 10, x1, y1 + 10), radius, fill=(0, 0, 0, 90))
    d.rounded_rectangle(box, radius, fill=fill + (245,), outline=(outline + (255,)) if outline else None, width=4)
    d.rounded_rectangle((x0 + 4, y0 + 4, x1 - 4, y0 + (y1 - y0) * 0.45), radius, fill=(255, 255, 255, 10))
    sc = 0.9 + 0.1 * ease(p)
    if sc != 1:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        lay = lay.resize((int(W * sc), int(H * sc)), Image.BILINEAR)
        ox, oy = int(cx - cx * sc), int(cy - cy * sc)
        tmp = Image.new("RGBA", img.size, (0, 0, 0, 0)); tmp.paste(lay, (ox, oy)); lay = tmp
    lay.putalpha(lay.getchannel("A").point(lambda v: int(v * lin(p))))
    img.alpha_composite(lay)


def particles(img, t, seed=1, n=26, col=GOLD):
    rng = np.random.default_rng(seed)
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for i in range(n):
        x = rng.uniform(0, W); y0 = rng.uniform(0, H); sp = rng.uniform(20, 70); r = rng.uniform(2, 5)
        y = (y0 - t * sp) % H
        a = int(60 + 60 * math.sin(t * 2 + i))
        d.ellipse((x - r, y - r, x + r, y + r), fill=col + (a,))
    img.alpha_composite(lay)


# ------------------------------------------------------------------ scènes
class Metier:
    def __init__(self, key):
        self.k = key
        m = DATA["METIERS"][key]; e = DATA["EXTRA"][key]
        self.nom = clean(m["nom"]); self.resume = clean(m["resume"])
        self.info = e["m"]
        self.sal = [[clean(x) for x in s] for s in DATA["SALAIRES"][key]]
        self.emo = EMO.get(key, "🎯")


def s_hook(img, t, M):
    particles(img, t, 3)
    words(img, "Tu veux devenir", 520, 70, WHITE, t, 0.1, per=0.1)
    nm = M.nom + " ?"
    if font(BOLD, 120).getlength(nm) > 960 and (" " in M.nom or "-" in M.nom):
        cuts = [(nm[:i], nm[i + 1:]) for i, c in enumerate(nm) if c == " " and nm[i + 1:] != "?"]
        cuts += [(nm[:i + 1], nm[i + 1:]) for i, c in enumerate(nm) if c == "-"]
        best = None
        for l1, l2 in cuts:
            sc = max(font(BOLD, 100).getlength(l1), font(BOLD, 100).getlength(l2))
            if best is None or sc < best[0]: best = (sc, l1, l2)
        sz = min(fit(best[1], BOLD, 130, 960, 60), fit(best[2], BOLD, 130, 960, 60))
        pop_text(img, best[1], 660, sz, GOLD, prog(t, 0.55, 0.4))
        pop_text(img, best[2], 660 + int(sz * 1.15), sz, GOLD, prog(t, 0.65, 0.4))
    else:
        pop_text(img, nm, 680, fit(nm, BOLD, 150, 940, 70), GOLD, prog(t, 0.55, 0.4))
    emoji(img, M.emo, W // 2, 1075, 180, prog(t, 0.9, 0.45), rot=6 * math.sin(t * 3), bob=10, t=t)
    words(img, "Le métier en 30 secondes.", 1300, 54, WHITE, t, 1.6, per=0.08, path=MED)
    


def _range(s):
    nums = [int(n.replace(" ", "")) for n in re.findall(r"\d[\d ]{2,}\d", s)]
    nums = [n for n in nums if 500 <= n <= 30000]
    return (nums[0], nums[1]) if len(nums) >= 2 else ((nums[0], nums[0]) if nums else (None, None))


def s_but(img, t, M):
    chip(img, "LE BUT DU MÉTIER", 330, prog(t, 0.0, 0.3))
    emoji(img, M.emo, W // 2, 560, 170, prog(t, 0.2, 0.45), bob=8, t=t)
    panel(img, (90, 720, W - 90, 1180), prog(t, 0.4, 0.4), outline=GOLD, glow=GOLD)
    para(img, M.resume, 860, 52, WHITE, 820, t, 0.7, path=BOLD)


def _taches(M):
    q = re.sub(r"\s*\(.*?\)", "", first_sentence(M.info.get("quotidien", ""), 400)).rstrip(".…")
    items = [x.strip() for x in re.split(r",| et ", q) if len(x.strip()) > 2]
    return [x[0].upper() + x[1:] for x in items][:5]


def s_taches(img, t, M):
    chip(img, "AU QUOTIDIEN", 260, prog(t, 0.0, 0.3), bg=VIO, fg=WHITE)
    words(img, "Ce que tu fais vraiment", 380, 60, WHITE, t, 0.15, per=0.08)
    items = _taches(M)
    if len(items) < 2:
        panel(img, (90, 500, W - 90, 1100), prog(t, 0.5, 0.4))
        para(img, first_sentence(M.info.get("quotidien", ""), 220), 620, 44, WHITE, 820, t, 0.7)
        return
    for i, it in enumerate(items):
        y = 560 + i * 190
        p = prog(t, 0.6 + i * 0.45, 0.4)
        panel(img, (110, y - 72, W - 110, y + 72), p)
        if p <= 0:
            continue
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); al = int(255 * lin(p))
        dx = int((1 - ease(p)) * 120 * (1 if i % 2 == 0 else -1))
        d.ellipse((150 + dx, y - 32, 214 + dx, y + 32), fill=GREEN + (al,))
        d.line((166 + dx, y, 178 + dx, y + 13, 199 + dx, y - 12), fill=WHITE + (al,), width=7)
        fs_ = max(fit(it, BOLD, 42, 700, 26), 36)
        lines = wrap(it, font(BOLD, fs_), 700)[:2]
        for k, ln in enumerate(lines):
            d.text((245 + dx, y + (k - (len(lines) - 1) / 2) * 42), ln, font=font(BOLD, fs_), fill=WHITE + (al,), anchor="lm")
        img.alpha_composite(lay)


def s_qualites(img, t, M):
    words(img, "Les qualités qu'il faut", 420, 66, GOLD, t, 0.0, per=0.08)
    quals = [clean(x) for x in M.info.get("qualites", [])][:3]
    cols = [GOLD, VIO, (90, 190, 255)]
    for i, qq in enumerate(quals):
        sticker(img, qq, W // 2, 680 + i * 220, prog(t, 0.5 + i * 0.4, 0.4), rot=[-4, 3, -2][i], bg=cols[i], fg=BG,
                size=fit(qq, BOLD, 64, 760, 36))
    words(img, "Tu te reconnais ?", 1420, 54, WHITE, t, 2.3, per=0.08, path=MED)


def s_salaire2(img, t, M):
    particles(img, t, 7, 30)
    words(img, "Et côté salaire ?", 380, 78, WHITE, t, 0.0, per=0.1)
    s0 = M.sal[0][0]
    lo, hi = _range(s0)
    pc = prog(t, 0.6, 1.3)
    if lo:
        k = 1 - (1 - lin(pc)) ** 3
        a, b = int(lo * k), int(hi * k)
        num = f"{a:,}".replace(",", " ") + (" – " + f"{b:,}".replace(",", " ") if hi != lo else "") + " €"
        pop_text(img, ("Dès " if hi == lo else "") + num, 700, fit(num, BOLD, 130, 960, 60), GOLD, min(1.0, pc * 3))
        unit = "brut / mois" if "brut" in s0 else ("net / mois" if "net" in s0 else "par mois")
        text(img, unit + " en début de carrière", 840, 44, WHITE, path=MED, p=prog(t, 1.0, 0.3))
    else:
        pop_text(img, s0, 700, fit(s0, BOLD, 90, 960, 40), GOLD, prog(t, 0.6, 0.4))
    src = M.sal[0][2] if len(M.sal[0]) > 2 else ""
    if src:
        text(img, "Source : " + src, 1000, 32, GREY, path=REG, p=prog(t, 1.8, 0.3))


def s_fin(img, t, M):
    particles(img, t, 11, 34)
    words(img, "Ce métier t'intéresse ?", 470, 72, WHITE, t, 0.0, per=0.1)
    words(img, "Découvre comment", 640, 60, WHITE, t, 0.7, per=0.1, path=MED)
    words(img, "en faire ton avenir.", 730, 60, GOLD, t, 1.0, per=0.1)
    pb = prog(t, 1.8, 0.4)
    if pb > 0:
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); a = int(255 * pb)
        f = font(BOLD, 110); w1, w2 = f.getlength("trouve"), f.getlength("tavoie"); x0 = W // 2 - (w1 + w2) // 2
        dy = (1 - ease(pb)) * 40
        d.text((x0, 940 + dy), "trouve", font=f, fill=WHITE + (a,), anchor="lm")
        d.text((x0 + w1, 940 + dy), "tavoie", font=f, fill=GOLD + (a,), anchor="lm")
        img.alpha_composite(lay)
    shine(img, (100, 860, W - 100, 1020), t, 2.3, 0.7)
    pulse = 1 + 0.04 * math.sin(t * 7) if t > 2.7 else 1
    p = prog(t, 2.4, 0.35)
    if p > 0:
        w, h = int(620 * pulse), int(140 * pulse)
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); a = int(255 * p)
        d.rounded_rectangle((W // 2 - w // 2, 1160 - h // 2, W // 2 + w // 2, 1160 + h // 2), h // 2, fill=PINK + (a,))
        d.text((W // 2, 1160), "LIEN EN BIO", font=font(BOLD, int(60 * pulse)), fill=WHITE + (a,), anchor="mm")
        img.alpha_composite(lay)
    sticker(img, "Abonne-toi : 1 métier par jour", W // 2, 1360, prog(t, 3.0, 0.35), rot=-3, bg=GOLD, size=40, emo="🔔")


SCENES = [("hook", s_hook, 3.6), ("but", s_but, 5.0), ("taches", s_taches, 6.4), ("qualites", s_qualites, 4.4),
          ("salaire", s_salaire2, 4.4), ("fin", s_fin, 5.4)]
IMPACTS = {"hook": [0.55, 0.9], "but": [0.2], "qualites": [0.5, 0.9, 1.3], "salaire": [0.6, 1.9], "fin": [1.8]}
TOTAL = sum(d for _, _, d in SCENES)
OFF = {}
_o = 0
for n, _, d in SCENES:
    OFF[n] = _o; _o += d


def render_frame(M, name, t):
    fn = dict((n, f) for n, f, _ in SCENES)[name]; dur = dict((n, d) for n, _, d in SCENES)[name]
    img = base(OFF[name] + t, TOTAL)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fn(layer, t, M)
    zoom, sx, sy = 1.0 + 0.03 * t / dur, 0.0, 0.0
    for it in IMPACTS.get(name, []):
        dt = t - it
        if 0 <= dt < 0.3:
            k = 1 - dt / 0.3; zoom += 0.035 * k * k; sx += 8 * k * math.sin(dt * 90)
    fin = lin(t / 0.35); last = name == SCENES[-1][0]
    fout = 1.0 if last else lin((dur - t) / 0.3)
    zoom *= 1 + 0.08 * (1 - ease(fin))
    sy += -(1 - fout) ** 2 * 140
    fade = min(fin, fout)
    if zoom != 1.0:
        nw, nh = int(W * zoom), int(H * zoom)
        layer = layer.resize((nw, nh), Image.BILINEAR).crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
    if fade < 1:
        layer.putalpha(layer.getchannel("A").point(lambda v: int(v * fade)))
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0)); canvas.paste(layer, (int(sx), int(sy)))
    img.alpha_composite(canvas)
    if name == "hook" and 0.55 <= t < 0.75:
        img.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(110 * (1 - (t - 0.55) / 0.2)))))
    return img.convert("RGB")


# ------------------------------------------------------------------ son
SR = 44100
def build_audio(path):
    rng = np.random.default_rng(9)
    n = int((TOTAL + 0.3) * SR); S = np.zeros(n)
    def add(tg, kind, g):
        s = synth(kind, rng) * g; i = int(tg * SR)
        if i < 0: s = s[-i:]; i = 0
        e = min(n, i + len(s)); S[i:e] += s[:e - i]
    add(0.0, "amb", 0.5)
    add(OFF["hook"] + 0.55, "boom", 0.9); add(OFF["hook"] + 0.9, "pop", 0.5)
    for nm, _, d in SCENES[1:]:
        add(OFF[nm] - 0.22, "swish", 0.6)
    add(OFF["but"] + 0.2, "pop", 0.45)
    for k in range(5): add(OFF["taches"] + 0.6 + k * 0.45, "pop", 0.4)
    for k in range(3): add(OFF["qualites"] + 0.5 + k * 0.4, "flip", 0.7)
    for k in range(18): add(OFF["salaire"] + 0.6 + k * 0.07, "tick", 0.8)
    add(OFF["salaire"] + 1.9, "boom", 0.5)
    add(OFF["fin"] - 0.8, "riser", 0.6); add(OFF["fin"] + 1.8, "boom", 0.8); add(OFF["fin"] + 3.0, "pop", 0.45)
    pk = np.abs(S).max(); S = S / pk * 0.7
    d = (np.stack([S, S], 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(d.tobytes())


def description(M):
    tags = "#parcoursup #orientation #metier #" + re.sub(r"[^a-z]", "", M.k) + " #lycee #etudes"
    return f"{M.nom} : le métier en 30 secondes {M.emo} {tags}"


def render(key, outdir="out"):
    M = Metier(key)
    os.makedirs(outdir, exist_ok=True); tmpd = os.path.join(outdir, "tmp_" + key); os.makedirs(tmpd, exist_ok=True)
    for n, _, d in SCENES:
        tmp = os.path.join(tmpd, n + ".tmp.mp4")
        p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                              "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                              "-pix_fmt", "yuv420p", tmp], stdin=subprocess.PIPE)
        for i in range(int(round(d * FPS))):
            p.stdin.write(render_frame(M, n, i / FPS).tobytes())
        p.stdin.close()
        if p.wait() != 0:
            sys.exit("échec " + n)
        os.replace(tmp, os.path.join(tmpd, n + ".mp4"))
    with open(os.path.join(tmpd, "list.txt"), "w") as f:
        for n, _, _ in SCENES:
            f.write(f"file '{n}.mp4'\n")
    build_audio(os.path.join(tmpd, "sfx.wav"))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(tmpd, "list.txt"),
                    "-c", "copy", os.path.join(tmpd, "v.mp4")], check=True)
    date = datetime.date.today().isoformat()
    out = os.path.join(outdir, f"{date}_{key}.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(tmpd, "v.mp4"), "-i", os.path.join(tmpd, "sfx.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
                    "-movflags", "+faststart", out + ".tmp.mp4"], check=True)
    os.replace(out + ".tmp.mp4", out)
    open(os.path.join(outdir, f"{date}_{key}_description.txt"), "w", encoding="utf-8").write(description(M) + "\n")
    print(out)
    return out


def key_of_day(d=None):
    d = d or datetime.date.today()
    return ORDER[(d - datetime.date(2026, 11, 23)).days % len(ORDER)]


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "still":
        render_frame(Metier(a[1]), a[2], float(a[3])).save(a[4])
    elif a and a[0] != "auto":
        render(a[0])
    else:
        render(key_of_day())
