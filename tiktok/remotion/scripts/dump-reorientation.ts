// Écrit le texte de la voix de la vidéo « Réorientation » : npx tsx scripts/dump-reorientation.ts <sortie.json>
import fs from "node:fs";
import { REORIENTATION } from "../src/reorientation-texte";

fs.writeFileSync(process.argv[2], JSON.stringify({ key: "reorientation", scenes: REORIENTATION.map((t, i) => [{ id: `r${i}`, text: t }]) }, null, 1));
