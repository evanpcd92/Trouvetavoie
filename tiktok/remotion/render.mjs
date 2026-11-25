// Rend la vidéo « métier du jour ».
// Usage : node render.mjs            -> métier du jour (rotation à partir du 23/11/2026, heure de Paris)
//         node render.mjs <cle>      -> un métier précis (ex. infirmier)
//         node render.mjs --date 2026-12-01
// Sortie : out/<date>_<cle>.mp4, _description.txt, et pour la page des vidéos : _web.mp4 (< 10 Mo), .jpg, _galerie.json
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { start, order } = JSON.parse(fs.readFileSync(path.join(HERE, "src/order.json"), "utf8"));
const DATA = JSON.parse(fs.readFileSync(path.join(HERE, "../metiers.json"), "utf8"));

const args = process.argv.slice(2);
const di = args.indexOf("--date");
const today = di >= 0 ? args[di + 1] : new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const explicit = args.find((a, i) => !a.startsWith("--") && (di < 0 || i !== di + 1));

const days = Math.round((Date.parse(today) - Date.parse(start)) / 86400000);
const key = explicit || order[((days % order.length) + order.length) % order.length];
if (!DATA.METIERS[key]) throw new Error(`Métier inconnu : ${key}`);

const nom = DATA.METIERS[key].nom;
const outDir = path.join(HERE, "out");
fs.mkdirSync(outDir, { recursive: true });
const base = `${today}_${key}`;
const mp4 = path.join(outDir, `${base}.mp4`);

console.log(`Métier du ${today} : ${nom} (${key})`);

// 1. Voix off : texte -> morceaux audio (public/voice)
const run = (cmd, a, opts = {}) => execFileSync(cmd, a, { cwd: HERE, stdio: "inherit", ...opts });
try {
  execFileSync("python3", ["-c", "import sherpa_onnx, soundfile, numpy; assert sherpa_onnx.__version__.startswith('1.')"], { stdio: "ignore" });
} catch {
  run("python3", ["-m", "pip", "install", "-q", "sherpa-onnx<2", "soundfile", "numpy"]);
}
const scriptJson = path.join(outDir, `${base}_texte.json`);
run("npx", ["tsx", "scripts/dump-script.ts", key, scriptJson]);
run("python3", ["scripts/make_voice.py", scriptJson, path.join(HERE, "public/voice")]);

// 2. Vidéo
execFileSync(
  "npx",
  ["remotion", "render", "src/index.ts", "MetierDuJour", mp4, `--props=${JSON.stringify({ metier: key })}`, "--codec=h264", "--crf=18", "--log=error"],
  { cwd: HERE, stdio: "inherit" },
);

// Description TikTok (accroche, but, salaire, qualités, hashtags)
run("npx", ["tsx", "scripts/description.ts", key, path.join(outDir, `${base}_description.txt`)]);
const desc = fs.readFileSync(path.join(outDir, `${base}_description.txt`), "utf8");
// Miniature (couverture TikTok)
run("npx", ["remotion", "still", "src/index.ts", "Miniature", path.join(outDir, `${base}_miniature.png`), `--props=${JSON.stringify({ metier: key })}`, "--log=error"]);

// 3. Version légère (< 10 Mo) et image d'aperçu pour la page des vidéos
run("npx", ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", mp4, "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-maxrate", "2000k", "-bufsize", "4000k", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", path.join(outDir, `${base}_web.mp4`)]);
run("npx", ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-ss", "2.6", "-i", mp4, "-frames:v", "1", "-vf", "scale=360:-1", "-q:v", "4", path.join(outDir, `${base}.jpg`)]);
fs.writeFileSync(
  path.join(outDir, `${base}_galerie.json`),
  JSON.stringify({ date: today, key, nom, numero: order.indexOf(key) + 1, video: `videos/${base}.mp4`, poster: `videos/${base}.jpg`, description: desc.trim() }, null, 1),
);
console.log(mp4);
