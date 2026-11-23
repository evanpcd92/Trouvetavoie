// Texte de la voix off, découpé en petits morceaux pour caler les images et les bruitages dessus.
import { MetierProps } from "./data";

export type Seg = { id: string; text: string };

const UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
const TENS = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];

function under100(n: number): string {
  if (n <= 16) return UNITS[n];
  if (n < 20) return "dix-" + UNITS[n - 10];
  if (n < 70) {
    const t = Math.floor(n / 10), u = n % 10;
    return TENS[t] + (u === 0 ? "" : u === 1 ? " et un" : "-" + UNITS[u]);
  }
  if (n < 80) return n === 71 ? "soixante et onze" : "soixante-" + under100(n - 60);
  if (n === 80) return "quatre-vingts";
  return "quatre-vingt-" + under100(n - 80);
}

function under1000(n: number): string {
  const c = Math.floor(n / 100), r = n % 100;
  const head = c === 0 ? "" : c === 1 ? "cent" : UNITS[c] + (r === 0 ? " cents" : " cent");
  if (r === 0) return head || "zéro";
  return (head ? head + " " : "") + under100(r);
}

export function enLettres(n: number): string {
  n = Math.round(n);
  if (n < 1000) return under1000(n);
  const k = Math.floor(n / 1000), r = n % 1000;
  const head = k === 1 ? "mille" : under1000(k) + " mille";
  return r === 0 ? head : head + " " + under1000(r);
}

/** rend un texte prononçable par la synthèse vocale */
export function speakable(s: string): string {
  return s
    .replace(/\s*\/\s*/g, " ou ")
    .replace(/…/g, ".")
    .replace(/\s*\(([^)]*)\)/g, ", $1,")
    .replace(/,\s*([.,!?])/g, "$1")
    .replace(/(\d)\s+(\d{3})/g, "$1$2")
    .replace(/(\d+)\s*h\b/g, (_, d) => `${d} heures`)
    .replace(/(\d+)\s*€\s*\+/g, (_, d) => `${d} euros et plus`)
    .replace(/(\d+)\s*€/g, (_, d) => `${d} euros`)
    .replace(/(\d+)\s*D\b/g, (_, d) => `${d} D`)
    .replace(/\d+/g, (d) => enLettres(parseInt(d, 10)))
    .replace(/\bIA\b/g, "I.A.")
    .replace(/\bRSA\b/g, "R.S.A.")
    .replace(/\s+/g, " ")
    .trim();
}

const end = (s: string) => (/[.!?…]$/.test(s) ? s : s + ".");

function salaireParle(m: MetierProps): string {
  const s = m.salaire;
  const unit = s.unit.replace("HT/mois", "hors taxes par mois").replace(/\/mois/, " par mois");
  const montant = s.high ? `${s.low} à ${s.high} €` : `${s.low} €`;
  let lead = "";
  if (s.label === "À partir de") lead = "À partir de ";
  else if (s.label === "Environ") lead = "Environ ";
  else if (/^Interne/i.test(s.label)) lead = "Pendant l'internat, environ ";
  else if (s.high) lead = "De ";
  return speakable(end(`${lead}${montant} ${unit}`.trim()));
}

/** 6 scènes : accroche, but, quotidien, qualités, salaire, fin */
export function voiceScript(m: MetierProps): Seg[][] {
  const nom = speakable(m.nom);
  return [
    [
      { id: "s0_0", text: "Yo ! Le métier du jour, c'est…" },
      { id: "s0_1", text: `${nom} !` },
    ],
    [
      { id: "s1_0", text: "Son but ?" },
      { id: "s1_1", text: speakable(end(m.but)) },
    ],
    [{ id: "s2_0", text: "Au quotidien, ça donne quoi ?" }, ...m.quotidien.map((q, i) => ({ id: `s2_${i + 1}`, text: speakable(end(q)) }))],
    [
      { id: "s3_0", text: "Pour ce métier, il te faut…" },
      ...m.qualites.map((q, i) => ({ id: `s3_${i + 1}`, text: speakable(end(q)) })),
    ],
    [
      { id: "s4_0", text: "Et niveau salaire ?" },
      { id: "s4_1", text: salaireParle(m) },
    ],
    [
      { id: "s5_0", text: `Comment devenir ${nom.toLowerCase()} ?` },
      { id: "s5_1", text: "Toutes les étapes sont sur trouve ta voie !" },
      { id: "s5_2", text: "Abonne-toi, à demain !" },
    ],
  ];
}
