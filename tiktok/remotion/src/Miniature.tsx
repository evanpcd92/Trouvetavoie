// Miniature (couverture TikTok) d'une vidéo métier : 1080×1920, une seule image.
import React from "react";
import { AbsoluteFill } from "remotion";
import { buildMetier } from "./data";
import { Mascot } from "./Mascot";
import { C, Emoji, Logo, TITLE } from "./ui";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ");
const nameSize = (s: string) => (s.length <= 9 ? 170 : s.length <= 13 ? 140 : s.length <= 18 ? 116 : s.length <= 24 ? 96 : 84);

export type MiniatureProps = { metier: string };

export const Miniature: React.FC<MiniatureProps> = ({ metier }) => {
  const m = buildMetier(metier);
  const s = m.salaire;
  const salaire = s.low ? (s.high ? `${fmt(s.low)} – ${fmt(s.high)} €` : `${s.label === "À partir de" ? "dès " : ""}${fmt(s.low)} €`) : "";
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #24306A 0%, ${C.navy} 62%, #070B1C 100%)`, fontFamily: TITLE, color: C.white, alignItems: "center" }}>
      {/* rayons lumineux */}
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from 0deg at 50% 36%, rgba(255,201,60,0.07) 0deg 8deg, transparent 8deg 22deg)` }} />
      <div style={{ marginTop: 250, background: C.gold, color: C.navy, fontWeight: 800, fontSize: 46, padding: "14px 36px", borderRadius: 999, letterSpacing: 1.5 }}>LE MÉTIER DU JOUR</div>
      <div style={{ marginTop: 50, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: `8px solid ${C.gold}`, display: "grid", placeItems: "center", boxShadow: "0 0 120px rgba(255,201,60,0.35)" }}>
        <Emoji name={m.key} size={190} />
      </div>
      <div style={{ marginTop: 44, fontSize: 52, fontWeight: 700, color: "#D7DCEB" }}>DEVENIR</div>
      <div style={{ fontSize: nameSize(m.nom), fontWeight: 800, lineHeight: 1.0, textAlign: "center", padding: "0 60px", textTransform: "uppercase", textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>{m.nom}</div>
      {salaire ? (
        <div style={{ marginTop: 46, background: C.white, color: C.navy, borderRadius: 34, padding: "22px 44px", textAlign: "center", transform: "rotate(-2deg)", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
          <div style={{ fontSize: 34, fontWeight: 600, color: C.ink2 }}>💶 Salaire de départ</div>
          <div style={{ fontSize: s.high ? 78 : 92, fontWeight: 800, lineHeight: 1.1, whiteSpace: "nowrap" }}>{salaire}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.goldD }}>{s.unit || "par mois"}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 40, bottom: 220 }}>
        <Mascot pose="point" size={420} lookX={0.6} />
      </div>
      <div style={{ position: "absolute", right: 60, bottom: 330, background: C.gold, color: C.navy, fontWeight: 800, fontSize: 44, padding: "18px 30px", borderRadius: 28, transform: "rotate(3deg)" }}>Tout savoir en 30 s</div>
      <div style={{ position: "absolute", right: 60, bottom: 240 }}>
        <Logo size={40} />
      </div>
    </AbsoluteFill>
  );
};

/** Miniature de la vidéo « Mon histoire » */
export const MiniHistoire: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #3A2350 0%, ${C.navy} 60%, #070B1C 100%)`, fontFamily: TITLE, color: C.white, alignItems: "center" }}>
    <div style={{ marginTop: 260, background: C.gold, color: C.navy, fontWeight: 800, fontSize: 46, padding: "14px 36px", borderRadius: 999, letterSpacing: 1.5 }}>MON HISTOIRE</div>
    <div style={{ marginTop: 60, fontSize: 112, fontWeight: 800, lineHeight: 1.02, textAlign: "center", padding: "0 60px", textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
      J’ÉTAIS EN <span style={{ color: C.gold }}>STMG</span>…
    </div>
    <div style={{ marginTop: 34, fontSize: 64, fontWeight: 700, lineHeight: 1.15, textAlign: "center", padding: "0 80px" }}>
      et Parcoursup ne m’a <span style={{ color: C.pink }}>pas aidé</span>.
    </div>
    <div style={{ marginTop: 50, position: "relative", background: C.white, color: C.navy, borderRadius: 26, padding: "24px 36px", fontWeight: 700, fontSize: 42, transform: "rotate(-2deg)" }}>
      Vœux au hasard
      <span style={{ position: "absolute", right: -40, top: -30, border: `6px solid ${C.pink}`, color: C.pink, borderRadius: 12, padding: "4px 14px", fontWeight: 800, fontSize: 36, background: "#fff", transform: "rotate(10deg)" }}>REFUSÉ</span>
    </div>
    <div style={{ position: "absolute", left: 60, bottom: 220 }}>
      <Mascot pose="think" size={440} lookX={0.6} />
    </div>
    <div style={{ position: "absolute", right: 60, bottom: 330, background: C.gold, color: C.navy, fontWeight: 800, fontSize: 44, padding: "18px 30px", borderRadius: 28, transform: "rotate(3deg)" }}>Alors j’ai créé…</div>
    <div style={{ position: "absolute", right: 60, bottom: 240 }}>
      <Logo size={40} />
    </div>
  </AbsoluteFill>
);

/** Image d'aperçu des liens partagés (Open Graph) : 1200×630 */
export const OgImage: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 75% 45%, #24306A 0%, ${C.navy} 60%)`, fontFamily: TITLE, color: C.white, flexDirection: "row", alignItems: "center", padding: "0 70px" }}>
    <div style={{ flex: 1 }}>
      <Logo size={44} />
      <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05, marginTop: 34 }}>
        Choisis ton métier.<br />On te montre <span style={{ color: C.gold }}>tous les chemins</span>.
      </div>
      <div style={{ fontSize: 28, color: "#C3C9DD", marginTop: 24, fontWeight: 600 }}>69 métiers · études, écoles, salaires · quiz gratuit</div>
    </div>
    <div style={{ width: 330, height: 560, position: "relative", display: "grid", placeItems: "center" }}>
      <div style={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,201,60,0.45) 0%, rgba(255,201,60,0.12) 60%, transparent 72%)", top: 60, width: 420, height: 420 }} />
      <Mascot pose="wave" size={520} lookX={-0.4} />
    </div>
  </AbsoluteFill>
);
