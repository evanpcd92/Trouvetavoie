# Génère la musique de fond et les bruitages des vidéos (sons 100 % synthétisés, libres de droits).
# Usage : python3 scripts/make_audio.py  -> public/audio/*.wav
import os, wave
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "audio")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def save(name, x):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    peak = np.max(np.abs(x)) or 1
    x = x / peak * 0.89
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-d * t)


def note(f, dur, kind="pluck"):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == "pluck":
        s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)) * env(n, 0.004, 7)
    elif kind == "bass":
        s = np.tanh(1.6 * np.sin(2 * np.pi * f * t)) * env(n, 0.006, 4.5)
    elif kind == "pad":
        s = sum(np.sin(2 * np.pi * f * (1 + dt) * t) for dt in (-0.004, 0, 0.005)) / 3
        s *= np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.3)
    return s


def put(buf, s, at, g=1.0):
    i = int(at * SR); j = min(len(buf), i + len(s))
    if j > i:
        buf[i:j] += g * s[: j - i]


def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-30 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 9)


def clap():
    n = int(0.2 * SR)
    return rng.standard_normal(n) * env(n, 0.002, 22) * 0.6


def hat():
    n = int(0.05 * SR); s = rng.standard_normal(n)
    s = np.diff(np.concatenate([[0], s]))
    return s * env(n, 0.0005, 90) * 0.35


def music(total=42.0, bpm=112):
    L = np.zeros(int(total * SR)); R = np.zeros_like(L)
    beat = 60 / bpm
    A, Fs, Cs, E, D, B = 220.0, 185.0, 277.18, 329.63, 293.66, 246.94
    # Progression : D - A - Bm - G (lumineuse et positive)
    chords = [(146.83, [293.66, 369.99, 440.0]), (110.0, [277.18, 329.63, 440.0]),
              (123.47, [293.66, 369.99, 493.88]), (98.0, [293.66, 392.0, 493.88])]
    bars = int(total / (4 * beat)) + 1
    for b in range(bars):
        root, ch = chords[b % 4]
        t0 = b * 4 * beat
        intro = b < 1
        for k in range(4):
            t = t0 + k * beat
            if not intro:
                put(L, kick(), t, 0.9); put(R, kick(), t, 0.9)
                if k in (1, 3):
                    c = clap(); put(L, c, t, 0.5); put(R, c, t + 0.008, 0.5)
            h = hat(); put(L, h, t + beat / 2, 0.5); put(R, h, t + beat / 2, 0.7)
        # basse syncopée
        if not intro:
            for off in (0, 1.5, 2, 3, 3.5):
                put(L, note(root, beat * 0.9, "bass"), t0 + off * beat, 0.42)
                put(R, note(root, beat * 0.9, "bass"), t0 + off * beat, 0.42)
        # pad
        for f in ch:
            p = note(f / 2, 4 * beat, "pad"); put(L, p, t0, 0.07); put(R, p, t0, 0.07)
        # arpège pluck en croches
        seq = [0, 1, 2, 1, 2, 0, 1, 2]
        for i, s in enumerate(seq):
            f = ch[s] * (2 if (b % 2 and i >= 4) else 1)
            pl = note(f, 0.4, "pluck")
            put(L if i % 2 else R, pl, t0 + i * beat / 2, 0.16)
            put(R if i % 2 else L, pl, t0 + i * beat / 2 + 0.11, 0.05)
    # fondu de sortie
    n = len(L); fade = np.ones(n)
    fo = int(2.5 * SR); fade[-fo:] = np.linspace(1, 0, fo)
    fi = int(0.05 * SR); fade[:fi] = np.linspace(0, 1, fi)
    return np.stack([L * fade, R * fade], axis=1)


def whoosh(d=0.55):
    n = int(d * SR); u = np.linspace(0, 1, n)
    nz = rng.standard_normal(n)
    out = np.zeros(n); y = 0.0
    a = 0.02 + 0.3 * np.sin(np.pi * u) ** 2
    for i in range(n):
        y += a[i] * (nz[i] - y); out[i] = y
    return out * np.sin(np.pi * u) ** 1.5


def pop():
    n = int(0.14 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 480 * (1 + 0.9 * (1 - np.exp(-35 * t))) * t) * env(n, 0.002, 28)


def ding():
    n = int(1.0 * SR); t = np.arange(n) / SR
    return sum(g * np.sin(2 * np.pi * f * t) for f, g in ((1318.5, 1), (1975.5, 0.5), (2637, 0.25))) * env(n, 0.002, 5)


def cash():
    n = int(0.9 * SR); t = np.arange(n) / SR
    bell = sum(g * np.sin(2 * np.pi * f * t) for f, g in ((2093, 1), (2637, 0.7), (3136, 0.5))) * env(n, 0.002, 6)
    clink = rng.standard_normal(n) * env(n, 0.001, 60) * 0.5
    s = bell + clink
    s2 = np.zeros(n); d = int(0.09 * SR); s2[d:] = s[:-d] * 0.6
    return s + s2


def boom():
    n = int(1.0 * SR); t = np.arange(n) / SR
    f = 40 + 80 * np.exp(-10 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 4) + 0.2 * rng.standard_normal(n) * env(n, 0.001, 40)


save("music.wav", music())
save("whoosh.wav", whoosh())
save("pop.wav", pop())
save("ding.wav", ding())
save("cash.wav", cash())
save("boom.wav", boom())
print("ok", sorted(os.listdir(OUT)))
