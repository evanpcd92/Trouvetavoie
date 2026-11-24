# Génère la voix off (Kokoro, voix « Puck » francisée) pour chaque morceau du texte.
# Usage : python3 scripts/make_voice.py <script.json> <dossier_sortie>
# Sortie : <dossier>/<id>.wav + <dossier>/voice.json  {id: {dur, env}} (env = ouverture de bouche par image, 30 i/s)
import json, os, sys, tarfile, urllib.request
import numpy as np
import soundfile as sf
import sherpa_onnx

MODEL_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2"
CACHE = os.path.expanduser("~/.cache/trouvetavoie")
BASE = os.path.join(CACHE, "kokoro-multi-lang-v1_0")
BLEND = os.path.join(CACHE, "kokoro-blend")
PUCK, SIWIS, PART_PUCK = 18, 30, 0.65  # 65 % Puck (timbre) + 35 % Siwis (accent français)
SPEED = 1.15
FPS = 30


def ensure_model():
    if not os.path.exists(os.path.join(BASE, "model.onnx")):
        os.makedirs(CACHE, exist_ok=True)
        tmp = os.path.join(CACHE, "kokoro.tar.bz2")
        print("Téléchargement du modèle de voix (≈ 330 Mo)…", flush=True)
        urllib.request.urlretrieve(MODEL_URL, tmp)
        with tarfile.open(tmp) as t:
            t.extractall(CACHE)
        os.remove(tmp)
    os.makedirs(BLEND, exist_ok=True)
    for f in os.listdir(BASE):
        dst = os.path.join(BLEND, f)
        if f != "voices.bin" and not os.path.exists(dst):
            os.symlink(os.path.join(BASE, f), dst)
    v = np.fromfile(os.path.join(BASE, "voices.bin"), dtype=np.float32).reshape(54, -1)
    v[0] = PART_PUCK * v[PUCK] + (1 - PART_PUCK) * v[SIWIS]  # la voix mélangée prend l'emplacement 0
    v.tofile(os.path.join(BLEND, "voices.bin"))


def engine():
    K = BLEND
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=f"{K}/model.onnx", voices=f"{K}/voices.bin", tokens=f"{K}/tokens.txt",
                data_dir=f"{K}/espeak-ng-data", dict_dir=f"{K}/dict",
                lexicon=f"{K}/lexicon-us-en.txt,{K}/lexicon-zh.txt", lang="fr"),
            num_threads=4),
        max_num_sentences=1)
    return sherpa_onnx.OfflineTts(cfg)


def polish(x, sr):
    """coupe les silences, égalise le volume, petits fondus"""
    a = np.abs(x)
    thr = max(1e-3, 0.02 * a.max())
    idx = np.where(a > thr)[0]
    if len(idx):
        x = x[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.06 * sr)]
    # léger « présence » : on renforce un peu les aigus pour la clarté sur téléphone
    hp = np.concatenate([[0], np.diff(x)])
    x = x + 0.25 * hp
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    x = x / rms * 0.12
    x = np.tanh(x * 1.6) / 1.6  # compression douce
    f = int(0.01 * sr)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return x.astype(np.float32)


def envelope(x, sr):
    hop = sr // FPS
    n = int(np.ceil(len(x) / hop))
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    e = e / (np.percentile(e, 95) + 1e-9)
    return [round(float(min(1, v)), 3) for v in e]


def main(script_path, out_dir):
    ensure_model()
    tts = engine()
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        if f.endswith(".wav"):
            os.remove(os.path.join(out_dir, f))
    script = json.load(open(script_path, encoding="utf-8"))
    meta = {}
    for scene in script["scenes"]:
        for seg in scene:
            a = tts.generate(seg["text"], sid=0, speed=SPEED)
            x = polish(np.array(a.samples, dtype=np.float32), a.sample_rate)
            sf.write(os.path.join(out_dir, seg["id"] + ".wav"), x, a.sample_rate)
            meta[seg["id"]] = {"dur": round(len(x) / a.sample_rate, 3), "env": envelope(x, a.sample_rate), "text": seg["text"]}
    json.dump({"key": script["key"], "segs": meta}, open(os.path.join(out_dir, "voice.json"), "w", encoding="utf-8"), ensure_ascii=False)
    total = sum(m["dur"] for m in meta.values())
    print(f"Voix générée : {len(meta)} morceaux, {total:.1f} s de parole")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
