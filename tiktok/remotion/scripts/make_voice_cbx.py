# Voix off naturelle (Chatterbox multilingue, licence MIT) : voix « E3 énergique », nettoyée et calée sur la vidéo.
# Usage : python scripts/make_voice_cbx.py <script.json> <dossier_sortie>
# Sortie identique à make_voice.py : <dossier>/scene<i>.wav + voice.json {key, scenes:[{file,dur}], segs:{id:{scene,off,dur,env,text}}}
#
# Pour chaque scène : plusieurs prises, une reconnaissance vocale (faster-whisper) écoute chacune et garde la plus fidèle au texte,
# puis le son est nettoyé (souffle, sifflantes, volume) et les mots sont repérés pour caler les images sur la voix.
# Voix de référence : voix/reference.wav, générée avec la voix « upmc » de Piper (données UPMC, licence CC BY-SA 4.0).
import json, os, re, subprocess, sys, tempfile, unicodedata
import numpy as np
import soundfile as sf
import torch, librosa
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(HERE, "voix", "reference.wav")
EXAGGERATION, CFG, TEMPERATURE, TEMPO = 0.75, 0.35, 0.75, 1.04  # réglages « E3 énergique »
FPS = 30
PRISES = 4

torch.set_num_threads(os.cpu_count() or 4)


def norm_words(s):
    # les chiffres entendus (« 88 ») sont écrits en lettres, pour être comparés au texte (« quatre-vingt-quatre »)
    try:
        from num2words import num2words
        s = re.sub(r"\d+", lambda m: " " + num2words(int(m.group()), lang="fr") + " ", s)
    except Exception:
        pass
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.findall(r"[a-z0-9]+", s.replace("-", "").replace("'", " ").replace("’", " "))


def wer(ref, hyp):
    r, h = norm_words(ref), norm_words(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
            prev, d[j] = d[j], cur
    return d[len(h)] / max(1, len(r))


def nettoie(x, sr):
    """studio : coupe le grave sourd, enlève le souffle de fond, adoucit les « s », compresse, accélère un peu (sans artefact), volume constant"""
    with tempfile.TemporaryDirectory() as t:
        a, b = os.path.join(t, "a.wav"), os.path.join(t, "b.wav")
        sf.write(a, x, sr)
        chain = ",".join([
            "highpass=f=90",
            "afftdn=nr=14:nf=-42:tn=1",
            "deesser=i=0.35",
            "acompressor=threshold=-20dB:ratio=3:attack=6:release=90:makeup=2",
            f"atempo={TEMPO}",
            # coupe seulement le silence au début et à la fin (jamais au milieu des phrases)
            "silenceremove=start_periods=1:start_threshold=-45dB", "areverse", "silenceremove=start_periods=1:start_threshold=-45dB", "areverse",
            "loudnorm=I=-16:TP=-1.5:LRA=7",
        ])
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", a, "-af", chain, "-ar", str(sr), b], check=True)
        y, _ = sf.read(b, dtype="float32")
    f = int(0.008 * sr)
    if len(y) > 2 * f:
        y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    return y


def debuts(scene, words, dur):
    """début (en s) de chaque morceau de la scène : on aligne le texte attendu sur les mots entendus
    (alignement mot à mot, robuste aux mots mal reconnus), sinon au prorata du texte"""
    exp = [(w, j) for j, seg in enumerate(scene) for w in norm_words(seg["text"])]
    heard = [(t, k) for k, w in enumerate(words) for t in norm_words(w.word)]
    first = [next(n for n, (_, j) in enumerate(exp) if j == jj) if any(j == jj for _, j in exp) else 0 for jj in range(len(scene))]
    if not words or not heard:
        tot = max(1, len(exp))
        return [f / tot * dur for f in first]
    R, H = [w for w, _ in exp], [t for t, _ in heard]
    n, m = len(R), len(H)
    D = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        D[i][0] = i
    for j in range(m + 1):
        D[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            D[i][j] = min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (R[i - 1] != H[j - 1]))
    # pour chaque mot attendu, l'indice du premier mot entendu qui lui correspond
    pos = [m] * n
    i, j = n, m
    while i > 0 and j > 0:
        # mot identique : on l'aligne ; sinon on préfère « mot entendu en trop » à « mot mal entendu »,
        # pour qu'un mot mal reconnu (nom de métier) soit rattaché à son premier morceau entendu
        if R[i - 1] == H[j - 1] and D[i][j] == D[i - 1][j - 1]:
            pos[i - 1] = j - 1; i -= 1; j -= 1
        elif D[i][j] == D[i][j - 1] + 1:
            pos[i - 1] = j - 1; j -= 1
        elif D[i][j] == D[i - 1][j - 1] + 1:
            pos[i - 1] = j - 1; i -= 1; j -= 1
        else:
            pos[i - 1] = j; i -= 1
    out = []
    for jj, f in enumerate(first):
        if f == 0:
            out.append(0.0)
            continue
        h = min(m - 1, pos[f])
        out.append(max(0.0, words[heard[h][1]].start - 0.04))
    return out


def envelope(x, sr):
    hop = sr // FPS
    n = int(np.ceil(len(x) / hop))
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    e = e / (np.percentile(e, 95) + 1e-9)
    return [round(float(min(1, v)), 3) for v in e]


def main(script_path, out_dir):
    script = json.load(open(script_path, encoding="utf-8"))
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        if f.endswith(".wav"):
            os.remove(os.path.join(out_dir, f))
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    asr = WhisperModel("small", device="cpu", compute_type="int8")
    sr = model.sr
    meta, scenes = {}, []
    for i, scene in enumerate(script["scenes"]):
        texte = " ".join(seg["text"] for seg in scene)
        best = None
        for k in range(PRISES):
            torch.manual_seed(1000 * i + k)
            raw = model.generate(texte, language_id="fr", audio_prompt_path=REF, exaggeration=EXAGGERATION, cfg_weight=CFG, temperature=TEMPERATURE).squeeze(0).numpy()
            y = nettoie(raw, sr)
            segs, _ = asr.transcribe(librosa.resample(y, orig_sr=sr, target_sr=16000), language="fr", word_timestamps=True)
            segs = list(segs)
            heard = " ".join(s.text.strip() for s in segs)
            words = [w for s in segs for w in (s.words or [])]
            dur = len(y) / sr
            # pénalité si la prise « bavarde » (beaucoup plus longue que prévu pour ce texte)
            score = wer(texte, heard) + max(0.0, dur - 0.075 * len(texte)) * 0.08
            print(f"  scène {i}, prise {k + 1} : {score:.2f} — {heard}", flush=True)
            if best is None or score < best[0]:
                best = (score, y, words)
            if score < 0.1:
                break
        score, y, words = best
        name = f"scene{i}.wav"
        sf.write(os.path.join(out_dir, name), y, sr)
        dur = len(y) / sr
        env = envelope(y, sr)
        scenes.append({"file": name, "dur": round(dur, 3)})
        starts = debuts(scene, words, dur)
        for j, seg in enumerate(scene):
            off = starts[j]
            end = starts[j + 1] if j + 1 < len(scene) else dur
            f0, f1 = int(off * FPS), int(end * FPS)
            meta[seg["id"]] = {"scene": i, "off": round(off, 3), "dur": round(max(0.2, end - off), 3), "env": env[f0:max(f0 + 1, f1)], "text": seg["text"]}
        print(f"scène {i} : {dur:.1f} s (écart au texte {score:.2f})", flush=True)
    json.dump({"key": script["key"], "scenes": scenes, "segs": meta}, open(os.path.join(out_dir, "voice.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(f"Voix générée : {len(scenes)} scènes, {sum(s['dur'] for s in scenes):.1f} s de parole")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
