// Écrit le texte de la voix de « Mon histoire » : npx tsx scripts/dump-histoire.ts <sortie.json>
import fs from "node:fs";
import { HISTOIRE } from "../src/histoire-texte";

fs.writeFileSync(process.argv[2], JSON.stringify({ key: "histoire", scenes: HISTOIRE.map((t, i) => [{ id: `h${i}`, text: t }]) }, null, 1));
