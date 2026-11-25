// Écrit la description TikTok d'un métier : npx tsx scripts/description.ts <cle> <sortie.txt>
import fs from "node:fs";
import { buildMetier, MetierProps } from "../src/data";

const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
const tag = (s: string) =>
  "#" +
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z]/g, "")
    .toLowerCase();

// hashtags par grand domaine, d'après le diplôme ou le métier
function domaine(m: MetierProps): string[] {
  const t = (m.nom + " " + m.but).toLowerCase();
  if (/soign|patient|santé|médic|pharmac|hôpital|rééduqu|analyses|malade|blessé|urgence|autonom|grossesse|dents|corps/.test(t)) return ["#sante", "#medecine", "#paramedical"];
  if (/code|logiciel|données|informatique|appli|numérique|réseaux/.test(t)) return ["#informatique", "#tech", "#numerique"];
  if (/loi|justice|protéger|frontières|police|défendre|avions|secours/.test(t)) return ["#justice", "#securite", "#fonctionpublique"];
  if (/animaux|zoo|élev/.test(t)) return ["#animaux"];
  if (/vend|client|entreprise|comptes|banque|marketing|événement/.test(t)) return ["#business", "#entreprise"];
  if (/enfant|élève|jeunes/.test(t)) return ["#education", "#enfance"];
  return ["#metiersmanuels", "#artisanat"];
}

export function description(m: MetierProps): string {
  const s = m.salaire;
  const sal = s.low ? (s.high ? `${fmt(s.low)} à ${fmt(s.high)} € ${s.unit}` : `${s.label === "À partir de" ? "à partir de " : ""}${fmt(s.low)} € ${s.unit}`).trim() : "";
  const but = m.but.replace(/\.$/, "");
  return [
    `${m.nom} : combien ça gagne et à quoi ressemble le métier ? 👀`,
    "",
    `🎯 Le but : ${but.charAt(0).toLowerCase() + but.slice(1)}.`,
    sal ? `💶 Salaire de départ : ${sal} (source : ${s.source || "Onisep"}).` : "",
    `✅ Les qualités : ${m.qualites.join(", ").toLowerCase()}.`,
    "",
    "🧭 Les études pour y arriver + quiz d'orientation gratuit : lien en bio.",
    "Abonne-toi : un nouveau métier chaque jour 🔔",
    "",
    [tag(m.nom), "#orientation", "#parcoursup", "#metier", "#lycee", "#bac", "#etudes", ...domaine(m), "#trouvetavoie", "#pourtoi"].join(" "),
  ]
    .filter((x, i, a) => !(x === "" && a[i - 1] === ""))
    .join("\n");
}

if (process.argv[2]) {
  const txt = description(buildMetier(process.argv[2]));
  if (process.argv[3]) fs.writeFileSync(process.argv[3], txt + "\n");
  else console.log(txt);
}
