import raw from "../../metiers.json";
import rotation from "./order.json";

type Raw = {
  METIERS: Record<string, { nom: string; resume: string }>;
  EXTRA: Record<string, { m: { quotidien: string; qualites: string[] } }>;
  SALAIRES: Record<string, [string, string, string?][]>;
};
const DATA = raw as unknown as Raw;

export const ORDER: string[] = rotation.order;

export type Salaire = {
  label: string; // « À partir de », « Environ », « Interne : »…
  low: number;
  high: number | null;
  unit: string; // « brut/mois »…
  detail: string;
  source: string;
};

export type MetierProps = {
  key: string;
  nom: string;
  but: string;
  quotidien: string[];
  aSavoir: string | null;
  qualites: string[];
  salaire: Salaire;
  numero: number;
};

const clean = (s: string) =>
  (s || "")
    .replace(/[  ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const sentences = (s: string) =>
  clean(s)
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

const toNum = (s: string) => parseInt(s.replace(/\s/g, ""), 10);

export function parseSalaire(row: [string, string, string?]): Salaire {
  const s = clean(row[0]);
  const m = s.match(/^(.*?)(\d[\d ]*\d|\d)(?:\s*[–-]\s*(\d[\d ]*\d))?\s*€\s*(.*)$/);
  let label = "Salaire de départ";
  let low = 0;
  let high: number | null = null;
  let unit = "";
  if (m) {
    const pre = m[1].trim();
    low = toNum(m[2]);
    high = m[3] ? toNum(m[3]) : null;
    unit = m[4].trim();
    if (/^À partir de/i.test(pre)) label = "À partir de";
    else if (/:$/.test(pre)) label = pre.replace(/\s*≈\s*/, " ").trim();
    else if (pre.includes("≈")) label = "Environ";
  }
  unit = unit.replace(/^,\s*/, "");
  let detail = sentences(row[1] || "")[0] || "";
  if (detail.length > 120) detail = detail.slice(0, 117).replace(/\s+\S*$/, "") + "…";
  return { label, low, high, unit, detail, source: clean(row[2] || "") };
}

/** découpe sur les virgules hors parenthèses */
function commaSplit(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

const ARTICLE = /^(des|les|de|du|la|le|l’|l'|un|une|aux|au)\s/i;

function enumerate(sentence: string): string[] {
  const parts = commaSplit(sentence);
  const items: string[] = [];
  let carry = "";
  for (const raw of parts) {
    const part = carry ? `${carry}, ${raw}` : raw;
    carry = "";
    if (!part.includes(" ")) {
      carry = part; // verbe seul (« masser ») : on l'accroche au suivant
      continue;
    }
    if (items.length && ARTICLE.test(raw) && !carry) items[items.length - 1] += `, ${raw}`;
    else items.push(part);
  }
  if (carry) items.length ? (items[items.length - 1] += `, ${carry}`) : items.push(carry);
  return items;
}

function splitQuotidien(q: string): { items: string[]; aSavoir: string | null } {
  const ss = sentences(q);
  const first = ss[0].replace(/[.!?]$/, "");
  let items = first.includes(":") ? [] : enumerate(first);
  let rest = ss.slice(1);
  // les éléments trop longs sont coupés au dernier « et »
  for (let i = 0; i < items.length && items.length < 4; i++) {
    const it = items[i];
    const j = it.lastIndexOf(" et ");
    if (it.length > 70 && j > 20 && it.length - j > 15) items.splice(i, 1, it.slice(0, j), cap(it.slice(j + 4)));
  }
  if (items.length < 2 && first.includes(":")) {
    const [h, t] = first.split(/\s*:\s*/, 2);
    items = [h, t];
  } else if (items.length < 2) {
    items = ss.slice(0, 3).map((x) => x.replace(/[.!?]$/, ""));
    rest = ss.slice(3);
  }
  items = items.slice(0, 4).map((x) => cap(x.length > 90 ? x.slice(0, 87).replace(/\s+\S*$/, "") + "…" : x));
  let aSavoir: string | null = rest.length ? rest.join(" ") : null;
  if (aSavoir && aSavoir.length > 140) aSavoir = aSavoir.slice(0, 137).replace(/\s+\S*$/, "") + "…";
  return { items, aSavoir };
}

export { splitQuotidien };
export function buildMetier(key: string): MetierProps {
  const m = DATA.METIERS[key];
  if (!m) throw new Error(`Métier inconnu : ${key}`);
  const ex = DATA.EXTRA[key].m;
  const { items, aSavoir } = splitQuotidien(ex.quotidien);
  return {
    key,
    nom: clean(m.nom),
    but: clean(m.resume),
    quotidien: items,
    aSavoir,
    qualites: ex.qualites.map(clean).slice(0, 3),
    salaire: parseSalaire(DATA.SALAIRES[key][0]),
    numero: ORDER.indexOf(key) + 1,
  };
}

export const ALL_KEYS = Object.keys(DATA.METIERS);
