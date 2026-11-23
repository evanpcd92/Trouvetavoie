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

- Données : `../metiers.json` · ordre de rotation : `src/order.json`
- Mascotte : `src/Mascot.tsx` · scènes : `src/scenes.tsx` · montage : `src/Video.tsx`
- Musique et bruitages synthétisés (libres de droits) : `python3 scripts/make_audio.py`
- Emojis Twemoji (CC-BY 4.0) · polices Poppins et Inter (OFL)
