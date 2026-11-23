// Écrit le texte de la voix off d'un métier en JSON : npx tsx scripts/dump-script.ts <cle> <sortie.json>
import fs from "node:fs";
import { buildMetier } from "../src/data";
import { voiceScript } from "../src/script";

const [key, out] = process.argv.slice(2);
fs.writeFileSync(out, JSON.stringify({ key, scenes: voiceScript(buildMetier(key)) }, null, 1));
