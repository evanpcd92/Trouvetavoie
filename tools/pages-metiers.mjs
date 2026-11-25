// Génère une page statique par métier (pour Google) à partir des données de index.html.
// Usage : node tools/pages-metiers.mjs
// Sortie : metiers/<cle>/index.html, metiers/index.html, apres-bac/<bac>/index.html,
//          calendrier-parcoursup-2027/index.html, sitemap.xml, robots.txt
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://trouvetavoie.pages.dev"; // à changer si tu prends un nom de domaine
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

/** lit une constante JS de index.html (objet sur une ou plusieurs lignes) */
function read(name) {
  const start = src.indexOf(`const ${name} = `);
  if (start < 0) throw new Error(`constante introuvable : ${name}`);
  const from = start + `const ${name} = `.length;
  const lineEnd = src.indexOf("\n", from);
  const line = src.slice(from, lineEnd).trim();
  let body;
  if (line.endsWith(";")) body = line.slice(0, -1);
  else {
    const end = src.slice(from).search(/\n[}\]];/);
    body = src.slice(from, from + end + 2);
  }
  return Function(`return (${body});`)();
}
const METIERS = read("METIERS"), EXTRA = read("EXTRA"), SALAIRES = read("SALAIRES"), PSUP = read("PSUP"), PSLAB = read("PSLAB");
const DOM_BASE = read("DOM_BASE"), UNIVERS = read("UNIVERS"), SPE = read("SPE");
/** lit une question du quiz (ligne « id:{q:..., o:[...]} » de la constante Q) */
function question(id) {
  const m = src.match(new RegExp("\\n  " + id + ":(\\{q:.*\\}),?\\n"));
  if (!m) throw new Error(`question introuvable : ${id}`);
  return Function("SPE", `return (${m[1]});`)(SPE);
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const KEYS = Object.keys(METIERS);

// univers principal de chaque métier (poids le plus fort)
const univ = {};
for (const k of KEYS) {
  let best = null, w = 0;
  for (const [d, m] of Object.entries(DOM_BASE)) if ((m[k] || 0) > w) { w = m[k]; best = d; }
  univ[k] = best;
}
const univName = Object.fromEntries(UNIVERS.map(([n, d]) => [d, n]));

const CSS = `
:root{--ink:#0E1630;--ink2:#3E4766;--mute:#5E6782;--line:#E4E7EF;--bg:#F7F8FB;--card:#fff;--gold:#FFC93C;--gold-d:#8A6200;--navy:#0E1630;--green:#14804A}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 Inter,system-ui,sans-serif}
h1,h2,h3,.logo{font-family:Poppins,system-ui,sans-serif;line-height:1.15;margin:0}
a{color:inherit}
.wrap{max-width:860px;margin:0 auto;padding-left:max(18px,env(safe-area-inset-left));padding-right:max(18px,env(safe-area-inset-right))}
header{background:#fff;border-bottom:1px solid var(--line)}
.hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-block:14px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;font-size:20px}.logo .tv{color:var(--gold-d)}
.mk{width:34px;height:34px;border-radius:10px;background:var(--navy);display:grid;place-items:center}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:15px;text-decoration:none;border-radius:12px;padding:12px 18px;border:1px solid var(--line);background:#fff}
.btn-p{background:var(--navy);color:#fff;border-color:var(--navy)}.btn-g{background:var(--gold);border-color:var(--gold);color:var(--navy)}
main{padding-block:28px 64px}
.crumb{font-size:14px;color:var(--mute);margin-bottom:14px}.crumb a{color:var(--mute);text-decoration:none}
.k{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-d)}
h1{font-size:clamp(32px,6vw,46px);margin:8px 0 12px;text-wrap:balance}
.lead{font-size:19px;color:var(--ink2);margin:0 0 24px}
.infos{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:34px}
.info{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px}.info span{display:block;font-size:12.5px;color:var(--mute)}.info b{font-size:15px}
section{margin-top:36px}h2{font-size:25px;margin-bottom:12px}
p{margin:0 0 12px;color:var(--ink2)}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{background:#FFF4D1;color:var(--gold-d);font-weight:600;font-size:14px;border-radius:999px;padding:6px 14px}
.sal{background:var(--navy);color:#fff;border-radius:20px;padding:22px 24px}.sal b{font-family:Poppins,sans-serif;font-size:28px;display:block;margin:2px 0 6px}.sal p{color:#C3C9DD;margin:0}.sal small{color:#AAB3CF}
.card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px 24px}
.ch-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}.ch-h h3{font-size:20px}
.ps{font-size:12.5px;font-weight:600;border-radius:999px;padding:3px 10px;background:#E4F5EC;color:var(--green)}.ps.h{background:#EEF0F6;color:var(--ink2)}
ol.steps{list-style:none;padding:0;margin:0;display:grid;gap:12px;counter-reset:s}
ol.steps li{counter-increment:s;display:grid;grid-template-columns:34px 1fr;gap:12px}
ol.steps li:before{content:counter(s);width:34px;height:34px;border-radius:50%;background:var(--gold);display:grid;place-items:center;font-weight:700;font-family:Poppins,sans-serif}
ol.steps b{display:block}ol.steps small{color:var(--mute)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:16px}.facts div{background:var(--bg);border-radius:12px;padding:10px 12px;font-size:14px}.facts span{display:block;font-size:12px;color:var(--mute)}
.more{margin-top:14px;padding:14px 16px;border:2px dashed var(--line);border-radius:14px;color:var(--ink2);font-size:15px}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.rel{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}.rel a{display:block;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px;text-decoration:none;font-weight:600}.rel a:hover{border-color:var(--ink)}
footer{border-top:1px solid var(--line);padding-block:24px;font-size:13.5px;color:var(--mute)}
@media (max-width:600px){.hd .btn{display:none}.sal b{font-size:24px}.infos,.facts{grid-template-columns:1fr 1fr}.card{padding:18px}}
`;

const LOGO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC93C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polygon points="15.5,8.5 13.5,13.5 8.5,15.5 10.5,10.5" fill="#FFC93C"/></svg>`;

function layout({ title, desc, url, body, jsonld }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="fr_FR">
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230E1630'/%3E%3Ccircle cx='32' cy='32' r='19' fill='none' stroke='%23FFC93C' stroke-width='5'/%3E%3Cpolygon points='41,23 37,36 23,41 27,28' fill='%23FFC93C'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body>
<header><div class="wrap hd"><a class="logo" href="/"><span class="mk">${LOGO}</span><span>trouve<span class="tv">tavoie</span></span></a><a class="btn btn-p" href="/#quiz">Faire le quiz gratuit</a></div></header>
<main class="wrap">
${body}
</main>
<footer><div class="wrap">trouvetavoie · un outil d’aide à l’orientation. Il ne garantit pas une admission et ne remplace pas un conseiller d’orientation. · <a href="/#mentions">Mentions légales</a> · <a href="/#confidentialite">Confidentialité</a></div></footer>
</body>
</html>
`;
}

function pageMetier(k) {
  const m = METIERS[k], ex = (EXTRA[k] || {}), mm = ex.m || {}, c0 = m.chemins[0], f0 = (ex.c || [])[0];
  const sal = (SALAIRES[k] || [])[0];
  const ps = PSLAB[(PSUP[k] || "P")[0]] || PSLAB.P;
  const url = `${SITE}/metiers/${k}/`;
  const nomMin = lower(m.nom);
  const title = `Devenir ${nomMin} : études, salaire et formations | trouvetavoie`;
  const desc = `${m.resume} Études, formations, salaire de départ${sal ? ` (${sal[0]})` : ""} et tous les chemins pour devenir ${nomMin}.`;
  const autres = m.chemins.slice(1).map((c) => c.nom);
  const rel = KEYS.filter((x) => x !== k && univ[x] === univ[k]).slice(0, 6);
  const body = `
<div class="crumb"><a href="/">Accueil</a> / <a href="/metiers/">Métiers</a> / ${esc(m.nom)}</div>
<div class="k">${esc(univName[univ[k]] || "Fiche métier")}</div>
<h1>Devenir ${esc(nomMin)}</h1>
<p class="lead">${esc(m.resume)}</p>
<div class="infos">${(m.infos || []).map(([a, b]) => `<div class="info"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join("")}</div>

${mm.quotidien ? `<section><h2>Au quotidien</h2><p>${esc(mm.quotidien)}</p></section>` : ""}
${mm.qualites ? `<section><h2>Les qualités à avoir</h2><div class="chips">${mm.qualites.map((q) => `<span class="chip">${esc(q)}</span>`).join("")}</div></section>` : ""}
${sal ? `<section><h2>Le salaire en début de carrière</h2><div class="sal"><b>${esc(sal[0])}</b><p>${esc(sal[1])}</p>${sal[2] ? `<small>Source : ${esc(sal[2])}</small>` : ""}</div></section>` : ""}

<section>
  <h2>Les études pour devenir ${esc(nomMin)}</h2>
  <div class="card">
    <div class="ch-h"><h3>${esc(c0.nom)} <small style="font-weight:500;color:var(--mute);font-size:15px">· ${esc(c0.sous)}</small></h3><span class="ps${ps[1] === "ps-p" ? "" : " h"}">${esc(ps[0])}</span></div>
    <ol class="steps">${c0.steps.map(([t, d, x]) => `<li><div><b>${esc(t)}</b><small>${[d && d !== "—" ? esc(d) : "", x ? esc(x) : ""].filter(Boolean).join(" · ")}</small></div></li>`).join("")}</ol>
    ${f0 ? `<div class="facts"><div><span>Durée totale</span>${esc(f0.duree)}</div><div><span>Coût</span>${esc(f0.cout)}</div><div><span>Alternance</span>${esc(f0.alt)}</div><div><span>Sélectivité</span>${esc(f0.sel)}</div></div>` : ""}
    ${autres.length ? `<div class="more">Il existe ${autres.length === 1 ? "un autre chemin" : `${autres.length} autres chemins`} pour devenir ${esc(nomMin)} : <b>${autres.map(esc).join("</b> et <b>")}</b>. Compare-les sur trouvetavoie, avec les écoles et tes chances d’admission.</div>` : ""}
  </div>
  <div class="cta"><a class="btn btn-p" href="/#metier-${k}">Voir tous les chemins</a><a class="btn btn-g" href="/#quiz">Pas sûr ? Fais le quiz gratuit</a></div>
</section>

${mm.evol ? `<section><h2>Les évolutions possibles</h2><p>${esc(mm.evol)}</p></section>` : ""}
${rel.length ? `<section><h2>Des métiers proches</h2><div class="rel">${rel.map((x) => `<a href="/metiers/${x}/">${esc(METIERS[x].nom)}</a>`).join("")}</div></section>` : ""}
<p style="margin-top:36px;font-size:13.5px;color:var(--mute)">Sources : ${esc(m.sources || "Onisep, Parcoursup")}.</p>`;
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Métiers", item: `${SITE}/metiers/` },
      { "@type": "ListItem", position: 3, name: m.nom, item: url },
    ],
  };
  return layout({ title, desc, url, body, jsonld });
}

function pageIndex() {
  const groups = UNIVERS.map(([n, d]) => [n, KEYS.filter((k) => univ[k] === d).sort((a, b) => METIERS[a].nom.localeCompare(METIERS[b].nom, "fr"))]).filter((g) => g[1].length);
  const body = `
<div class="crumb"><a href="/">Accueil</a> / Métiers</div>
<h1>${KEYS.length} fiches métiers</h1>
<p class="lead">Études, salaire et chemins pour y arriver, expliqués simplement. Choisis un métier.</p>
${groups.map(([n, ks]) => `<section><h2>${esc(n)}</h2><div class="rel">${ks.map((k) => `<a href="/metiers/${k}/">${esc(METIERS[k].nom)}</a>`).join("")}</div></section>`).join("\n")}
<div class="cta" style="margin-top:36px"><a class="btn btn-g" href="/#quiz">Pas d’idée ? Fais le quiz gratuit</a></div>`;
  return layout({ title: `Fiches métiers : études, salaires et formations | trouvetavoie`, desc: `${KEYS.length} fiches métiers pour les lycéens : études, salaire de départ et tous les chemins pour y arriver.`, url: `${SITE}/metiers/`, body });
}

// ---------- Pages « Que faire après ton bac ? » ----------
const salaire = (k) => (SALAIRES[k] && SALAIRES[k][0] ? SALAIRES[k][0][0] : "");
const liste = (w, n = 12) =>
  Object.entries(w).filter(([k, v]) => v > 0 && METIERS[k]).sort((a, b) => b[1] - a[1] || METIERS[a[0]].nom.localeCompare(METIERS[b[0]].nom, "fr")).slice(0, n).map(([k]) => k);
const carte = (k) => `<a href="/metiers/${k}/"><b>${esc(METIERS[k].nom)}</b><small style="display:block;font-weight:500;color:var(--mute);font-size:13px">${esc(salaire(k))}</small></a>`;
const add = (into, w, f = 1) => { for (const [k, v] of Object.entries(w || {})) into[k] = (into[k] || 0) + v * f; return into; };

const techno = question("techno"), pro = question("pro");
const SOUS = { stmg: question("stmg"), sti2d: question("sti2d"), st2s: question("st2s") };
const BACS = [];
for (const [nom, w, id] of techno.o) {
  const total = add({}, w, 3);
  const groupes = [];
  if (SOUS[id]) for (const [n2, w2] of SOUS[id].o) { add(total, w2); groupes.push([n2, liste(w2, 8)]); }
  BACS.push({ id, titre: `Bac ${nom}`, intro: `Les métiers qui collent le mieux à un bac ${nom}, d’après les réponses de notre quiz d’orientation.`, top: liste(total), groupes, gTitre: SOUS[id] ? SOUS[id].q.replace(/ \?$/, "") : "" });
}
{
  const total = {}; const groupes = [];
  for (const [n, w] of SPE) { add(total, w); groupes.push([n, liste(w, 8)]); }
  BACS.unshift({ id: "general", titre: "Bac général", intro: "Les métiers les plus accessibles avec un bac général, puis le détail spécialité par spécialité.", top: liste(total), groupes, gTitre: "Selon tes spécialités" });
}
{
  const total = {}; const groupes = [];
  for (const [n, w, id] of pro.o) { if (id === "pro-autre") continue; add(total, w); groupes.push([n, liste(w, 8)]); }
  BACS.push({ id: "pro", titre: "Bac pro", intro: "Les métiers vers lesquels mène chaque domaine de bac professionnel, souvent en alternance.", top: liste(total), groupes, gTitre: "Selon le domaine de ton bac pro" });
}
function pageBac(b) {
  const url = `${SITE}/apres-bac/${b.id}/`;
  const body = `
<div class="crumb"><a href="/">Accueil</a> / <a href="/apres-bac/">Après ton bac</a> / ${esc(b.titre)}</div>
<div class="k">Orientation</div>
<h1>Que faire après un ${esc(b.titre.replace(/^Bac /, "bac "))} ?</h1>
<p class="lead">${esc(b.intro)}</p>
<section><h2>Les métiers les plus adaptés</h2><div class="rel">${b.top.map(carte).join("")}</div></section>
${b.groupes.filter((g) => g[1].length).map((g, i) => `${i === 0 && b.gTitre ? `<section><h2>${esc(b.gTitre)}</h2></section>` : ""}<section style="margin-top:18px"><h3 style="font-size:18px;margin-bottom:10px">${esc(g[0])}</h3><div class="rel">${g[1].map(carte).join("")}</div></section>`).join("\n")}
<div class="cta" style="margin-top:34px"><a class="btn btn-g" href="/#quiz">Fais le quiz gratuit pour affiner</a><a class="btn btn-p" href="/apres-bac/">Les autres bacs</a></div>
<p style="margin-top:28px;font-size:13.5px;color:var(--mute)">Ces pistes viennent des réponses de notre quiz d’orientation ; chaque fiche métier détaille les études, les écoles et le salaire avec leurs sources.</p>`;
  return layout({ title: `Que faire après un ${b.titre.replace(/^Bac /, "bac ")} ? Les métiers et études possibles | trouvetavoie`, desc: `${b.intro} Salaires, études et tous les chemins pour y arriver.`, url, body });
}
function pageBacs() {
  const body = `
<div class="crumb"><a href="/">Accueil</a> / Après ton bac</div>
<h1>Que faire après ton bac ?</h1>
<p class="lead">Choisis ta série : on te montre les métiers les plus adaptés, avec leur salaire et leurs études.</p>
<div class="rel">${BACS.map((b) => `<a href="/apres-bac/${b.id}/">🎓 ${esc(b.titre)}</a>`).join("")}</div>
<div class="cta" style="margin-top:34px"><a class="btn btn-g" href="/#quiz">Fais le quiz d’orientation gratuit</a></div>`;
  return layout({ title: "Que faire après ton bac ? Métiers par série | trouvetavoie", desc: "Les métiers adaptés à chaque bac : général, STMG, STI2D, ST2S, STL, STD2A, STHR, STAV et bac pro.", url: `${SITE}/apres-bac/`, body });
}

// ---------- Calendrier Parcoursup 2027 (calendrier officiel publié en octobre 2026) ----------
const CAL = [
  ["Jeudi 17 décembre 2026", "Ouverture du site et du catalogue des formations", "Consulte les formations, leurs attendus et leurs chiffres d’admission."],
  ["Lundi 18 janvier 2027", "Inscription et début des vœux", "Crée ton dossier et commence à formuler tes vœux (jusqu’à 10 vœux et 20 sous-vœux)."],
  ["Jeudi 11 mars 2027", "Dernier jour pour formuler tes vœux", "Après cette date, plus d’ajout de vœux en phase principale."],
  ["Jeudi 1er avril 2027", "Dernier jour pour compléter ton dossier et confirmer tes vœux", "Projets de formation motivés, pièces demandées et confirmation de chaque vœu."],
  ["À partir du 1er juin 2027", "Premières réponses des formations", "Réponds aux propositions dans les délais indiqués."],
  ["Samedi 10 juillet 2027", "Fin de la phase principale", "Si tu n’as pas de proposition, la phase complémentaire reste ouverte."],
  ["Jeudi 9 septembre 2027", "Fin de la phase complémentaire", "Pense aussi aux formations hors Parcoursup et à l’alternance."],
];
function pageCalendrier() {
  const body = `
<div class="crumb"><a href="/">Accueil</a> / Calendrier Parcoursup 2027</div>
<div class="k">Parcoursup 2027</div>
<h1>Calendrier Parcoursup 2027 : toutes les dates clés</h1>
<p class="lead">Les dates officielles de la procédure, et ce que tu dois faire à chaque étape.</p>
<ol class="steps" style="margin-top:20px">${CAL.map(([d, t, x]) => `<li><div><b>${esc(t)}</b><small style="display:block;color:var(--gold-d);font-weight:700">${esc(d)}</small><small>${esc(x)}</small></div></li>`).join("")}</ol>
<p style="margin-top:24px;font-size:13.5px;color:var(--mute)">Source : calendrier officiel de la session 2027 publié sur parcoursup.gouv.fr. Vérifie toujours les dates sur le site officiel.</p>
<div class="cta"><a class="btn btn-g" href="/#quiz">Pas d’idée de vœux ? Fais le quiz gratuit</a><a class="btn btn-p" href="/#calendrier">Le calendrier interactif</a></div>`;
  return layout({ title: "Calendrier Parcoursup 2027 : les dates clés | trouvetavoie", desc: "Vœux du 18 janvier au 11 mars 2027, confirmation jusqu’au 1er avril, premières réponses le 1er juin : toutes les dates officielles de Parcoursup 2027.", url: `${SITE}/calendrier-parcoursup-2027/`, body });
}

const out = path.join(ROOT, "metiers");
fs.mkdirSync(out, { recursive: true });
for (const k of KEYS) {
  fs.mkdirSync(path.join(out, k), { recursive: true });
  fs.writeFileSync(path.join(out, k, "index.html"), pageMetier(k));
}
fs.writeFileSync(path.join(out, "index.html"), pageIndex());
const outB = path.join(ROOT, "apres-bac");
for (const b of BACS) { fs.mkdirSync(path.join(outB, b.id), { recursive: true }); fs.writeFileSync(path.join(outB, b.id, "index.html"), pageBac(b)); }
fs.writeFileSync(path.join(outB, "index.html"), pageBacs());
fs.mkdirSync(path.join(ROOT, "calendrier-parcoursup-2027"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "calendrier-parcoursup-2027", "index.html"), pageCalendrier());
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [`${SITE}/`, `${SITE}/metiers/`, ...KEYS.map((k) => `${SITE}/metiers/${k}/`), `${SITE}/apres-bac/`, ...BACS.map((b) => `${SITE}/apres-bac/${b.id}/`), `${SITE}/calendrier-parcoursup-2027/`].map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`,
);
fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /tiktok/\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`${KEYS.length} pages métiers, ${BACS.length} pages « après ton bac », calendrier, sitemap.xml et robots.txt`);
