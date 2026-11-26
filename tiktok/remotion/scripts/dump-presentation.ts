// Écrit le texte de la voix de la vidéo de présentation : npx tsx scripts/dump-presentation.ts <sortie.json>
import fs from "node:fs";
import { PRESENTATION } from "../src/presentation-texte";

fs.writeFileSync(process.argv[2], JSON.stringify({ key: "presentation", scenes: PRESENTATION.map((t, i) => [{ id: `p${i}`, text: t }]) }, null, 1));
