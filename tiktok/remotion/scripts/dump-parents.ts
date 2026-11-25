// Écrit le texte de la voix de la vidéo « Parents » : npx tsx scripts/dump-parents.ts <sortie.json>
import fs from "node:fs";
import { PARENTS } from "../src/parents-texte";

fs.writeFileSync(process.argv[2], JSON.stringify({ key: "parents", scenes: PARENTS.map((t, i) => [{ id: `p${i}`, text: t }]) }, null, 1));
