// Ajoute la vidéo d'un métier au site : version légère (720p) + image d'aperçu + liste VIDEOS de index.html.
// Usage : node tools/ajouter-video.mjs <cle> <video.mp4> <miniature.png>
//         (cle = clé du métier, ou « mon-histoire » pour la vidéo de la page Notre histoire)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REMOTION = path.join(ROOT, "tiktok/remotion"); // fournit ffmpeg via « npx remotion ffmpeg »
const [key, src, mini] = process.argv.slice(2);
if (!key || !src || !mini) throw new Error("Usage : node tools/ajouter-video.mjs <cle> <video.mp4> <miniature.png>");

const out = path.join(ROOT, "videos");
fs.mkdirSync(out, { recursive: true });
const ff = (args) => execFileSync("npx", ["remotion", "ffmpeg", "-y", "-loglevel", "error", ...args], { cwd: REMOTION, stdio: "inherit" });

ff(["-i", path.resolve(src), "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", "1200k", "-bufsize", "2400k", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", path.join(out, `${key}.mp4`)]);
ff(["-i", path.resolve(mini), "-vf", "scale=540:-2", "-q:v", "4", path.join(out, `${key}.jpg`)]);

if (key !== "mon-histoire") {
  const idx = path.join(ROOT, "index.html");
  let s = fs.readFileSync(idx, "utf8");
  const m = s.match(/const VIDEOS = \[(.*?)\];/);
  if (!m) throw new Error("liste VIDEOS introuvable dans index.html");
  const list = m[1] ? m[1].split(",").map((x) => x.trim().replace(/'/g, "")).filter(Boolean) : [];
  if (!list.includes(key)) list.push(key);
  s = s.replace(m[0], `const VIDEOS = [${list.map((k) => `'${k}'`).join(",")}];`);
  fs.writeFileSync(idx, s);
}
const mo = (fs.statSync(path.join(out, `${key}.mp4`)).size / 1e6).toFixed(1);
console.log(`Vidéo ajoutée au site : ${key} (${mo} Mo)`);
