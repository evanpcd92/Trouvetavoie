// Rend la vidéo « métier du jour ».
// Usage : node render.mjs            -> métier du jour (rotation à partir du 23/11/2026, heure de Paris)
//         node render.mjs <cle>      -> un métier précis (ex. infirmier)
//         node render.mjs --date 2026-12-01
// Sortie : out/<date>_<cle>.mp4 et out/<date>_<cle>_description.txt
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
execFileSync(
  "npx",
  ["remotion", "render", "src/index.ts", "MetierDuJour", mp4, `--props=${JSON.stringify({ metier: key })}`, "--codec=h264", "--crf=18", "--log=error"],
  { cwd: HERE, stdio: "inherit" },
);

const tag = nom
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^A-Za-z]/g, "")
  .toLowerCase();
const desc = `${nom} : son but, son quotidien, les qualités qu'il faut et le salaire 💼
Toutes les étapes pour y arriver sur trouvetavoie.pages.dev 🧭

#orientation #parcoursup #metier #${tag} #lycee #bac #etudes #trouvetavoie
`;
fs.writeFileSync(path.join(outDir, `${base}_description.txt`), desc);
console.log(mp4);
