// Écrit le texte de la voix de « Mon histoire » v2 : npx tsx scripts/dump-histoire2.ts <sortie.json>
import fs from "node:fs";
import { HISTOIRE2 } from "../src/histoire2-texte";

fs.writeFileSync(process.argv[2], JSON.stringify({ key: "histoire2", scenes: HISTOIRE2.map((t, i) => [{ id: `h${i}`, text: t }]) }, null, 1));
