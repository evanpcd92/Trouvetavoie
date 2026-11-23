# Vidéos « métier du jour » (Remotion)

Vidéo TikTok de 35 à 40 s, en 1080×1920, avec la mascotte trouvetavoie. Elle présente le but du métier, son quotidien, les qualités qu'il demande et le salaire. Elle ne montre jamais les parcours.

```bash
npm install
node render.mjs                 # métier du jour (rotation de 50 jours à partir du 23/11/2026)
node render.mjs medecin         # un métier précis
node render.mjs --date 2026-12-01
npm run dev                     # Remotion Studio
```

Sortie : `out/<date>_<metier>.mp4` et `out/<date>_<metier>_description.txt`.

Voix off : `render.mjs` écrit le texte (`src/script.ts`), puis `scripts/make_voice.py` le fait lire par Kokoro (voix « Puck » mélangée à 35 % avec la voix française « Siwis » pour gommer l'accent). Le modèle (≈ 330 Mo) est téléchargé une fois dans `~/.cache/trouvetavoie`. Dépendances Python : `pip install "sherpa-onnx<2" soundfile numpy`. Les images, les bruitages et la bouche de la mascotte sont calés sur chaque morceau de voix (`src/timing.ts`).

- Données : `../metiers.json` · ordre de rotation : `src/order.json`
- Mascotte : `src/Mascot.tsx` · voix : `src/script.ts`, `scripts/make_voice.py` · scènes : `src/scenes.tsx` · montage : `src/Video.tsx`
- Musique et bruitages synthétisés (libres de droits) : `python3 scripts/make_audio.py`
- Emojis Twemoji (CC-BY 4.0) · polices Poppins et Inter (OFL)
