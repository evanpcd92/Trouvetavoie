// « Mon histoire » v2 (TikTok, 1080×1920) : l'histoire du fondateur, racontée par la narratrice, en motion design.
// Zones laissées libres pour TikTok : en haut (~170 px), en bas (légende, ~380 px) et à droite (boutons, ~150 px).
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { cube } from "@remotion/transitions/cube";
import { iris } from "@remotion/transitions/iris";
import { pushCut } from "@remotion/transitions/push-cut";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { Mascot, Pose } from "./Mascot";
import { Background, BODY, C, Logo, TITLE, useIn } from "./ui";
import { Burst, Chip, clamp, Confetti, ease, Phone, Roller, shake, Title } from "./fx";
import { HISTOIRE2 } from "./histoire2-texte";

export { HISTOIRE2 };
export type H2Voice = { key: string; scenes?: { file: string; dur: number }[]; segs: Record<string, { dur: number; env: number[] }> };
const FPS = 30, T = 16, LEAD = 8, W = 1080, H = 1920, BOTTOM = 1540;
const TAIL = [26, 34, 34, 40, 40, 36, 44, 80];

export function histoire2Timeline(v?: H2Voice | null) {
  const voice = v && v.key === "histoire2" ? v : null;
  const lens = HISTOIRE2.map((t, i) => Math.ceil(FPS * (voice?.segs[`h${i}`]?.dur ?? t.split(" ").length * 0.33)));
  const durs = lens.map((l, i) => LEAD + l + TAIL[i]);
  const starts: number[] = [];
  let acc = 0;
  durs.forEach((d, i) => { starts.push(acc); acc += d - (i < durs.length - 1 ? T : 0); });
  return { voice, lens, durs, starts, total: acc };
}

type SP = { v: H2Voice | null; len: number };
const at = (len: number, r: number) => LEAD + Math.round(len * r);

/** la mascotte représente le fondateur ; elle ne parle pas (c'est la narratrice qui raconte) */
const Lui: React.FC<{ pose: Pose; x?: number; size?: number; delay?: number; look?: number; seed?: number }> = ({ pose, x = 40, size = 380, delay = 4, look = 0.6, seed = 0 }) => {
  const p = useIn(delay, 13);
  return (
    <div style={{ position: "absolute", left: x, top: BOTTOM - size, transform: `translateY(${(1 - p) * 520}px)` }}>
      <Mascot pose={pose} size={size} lookX={look} seed={seed} />
    </div>
  );
};

/** étiquette de chapitre en haut */
const Chapitre: React.FC<{ n: number; label: string; color?: string }> = ({ n, label, color = C.gold }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 2, fps, config: { damping: 12 } });
  return (
    <div style={{ position: "absolute", left: 70, top: 190, display: "flex", alignItems: "center", gap: 12, transform: `translateX(${(1 - p) * -500}px)`, opacity: p }}>
      <div style={{ background: color, color: C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 28, padding: "8px 18px", borderRadius: 999, letterSpacing: 1.5 }}>CHAPITRE {n}</div>
      <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 30, color: "#D7DCEB", letterSpacing: 1 }}>{label.toUpperCase()}</div>
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "absolute", background: C.white, color: C.navy, borderRadius: 30, boxShadow: "0 30px 70px rgba(0,0,0,0.45)", ...style }}>{children}</div>
);

const Stamp: React.FC<{ at: number; text: string; color?: string; style?: React.CSSProperties; size?: number }> = ({ at: a, text, color = C.pink, style, size = 96 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - a, fps, config: { damping: 10, mass: 0.6 } });
  if (frame < a) return null;
  return <div style={{ position: "absolute", border: `10px solid ${color}`, color, borderRadius: 22, padding: "8px 34px", fontFamily: TITLE, fontWeight: 800, fontSize: size, letterSpacing: 3, background: "rgba(255,255,255,0.96)", transform: `rotate(-12deg) scale(${3 - 2 * p})`, opacity: Math.min(1, p * 2), whiteSpace: "nowrap", boxShadow: "0 20px 50px rgba(0,0,0,0.4)", ...style }}>{text}</div>;
};

/* ---------- 0. Retour en arrière ---------- */
const S0: React.FC<SP> = ({ len }) => {
  const frame = useCurrentFrame();
  const spin = interpolate(frame, [0, LEAD + len + 20], [0, -1440], { ...clamp, easing: Easing.out(Easing.cubic) });
  const glitch = frame % 9 < 2 ? 8 : 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #2A2350 0%, #0B1128 60%, #04060F 100%)" }}>
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: ((i * 160 + frame * 26) % 2100) - 100, height: 3, background: "rgba(255,255,255,0.07)" }} />
      ))}
      <div style={{ position: "absolute", left: 70, top: 210, fontFamily: TITLE, fontWeight: 800, fontSize: 44, color: C.gold, letterSpacing: 3, transform: `translateX(${glitch}px)`, textShadow: `${glitch}px 0 0 rgba(232,67,106,0.8)` }}>◀◀ RETOUR EN ARRIÈRE</div>
      <svg width={460} height={460} viewBox="0 0 100 100" style={{ position: "absolute", left: W / 2 - 230, top: 470 }}>
        <circle cx={50} cy={50} r={46} fill="rgba(255,255,255,0.06)" stroke={C.white} strokeWidth={3} />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={50} y1={8} x2={50} y2={i % 3 === 0 ? 15 : 12} stroke={C.white} strokeWidth={i % 3 === 0 ? 3 : 1.5} transform={`rotate(${i * 30} 50 50)`} />
        ))}
        <line x1={50} y1={50} x2={50} y2={22} stroke={C.gold} strokeWidth={4} strokeLinecap="round" transform={`rotate(${spin / 12} 50 50)`} />
        <line x1={50} y1={50} x2={50} y2={14} stroke={C.pink} strokeWidth={2.5} strokeLinecap="round" transform={`rotate(${spin} 50 50)`} />
        <circle cx={50} cy={50} r={3.5} fill={C.gold} />
      </svg>
      <Title text="Comment tout a commencé" hl={["commencé"]} at={LEAD + 4} size={88} top={1000} />
    </AbsoluteFill>
  );
};

/* ---------- 1. Terminale STMG, Parcoursup ne l'aide pas ---------- */
const S1: React.FC<SP> = ({ len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badge = spring({ frame: frame - LEAD, fps, config: { damping: 11 } });
  const ps = at(len, 0.42), no = at(len, 0.78);
  const app = spring({ frame: frame - ps, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill>
      <Background accent={C.blue} accent2={C.pink} />
      <AbsoluteFill style={{ transform: shake(frame, [no], 16) }}>
        <Chapitre n={1} label="Le lycée" />
        <Title text="Terminale STMG" hl={["STMG"]} at={LEAD} size={96} top={270} />
        <div style={{ position: "absolute", left: 70, top: 440, perspective: 1200 }}>
          <div style={{ width: 520, background: C.white, color: C.navy, borderRadius: 28, padding: "24px 28px", boxShadow: "0 30px 70px rgba(0,0,0,0.45)", transform: `rotateY(${(1 - badge) * 100}deg) rotate(-3deg)`, transformOrigin: "left center" }}>
            <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 24, color: C.ink2, letterSpacing: 1.5 }}>CARTE DE LYCÉEN</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
              <div style={{ width: 96, height: 96, borderRadius: 20, background: "#FFF4D1", display: "grid", placeItems: "center", fontSize: 58 }}>🎒</div>
              <div>
                <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 46 }}>Terminale</div>
                <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 46, color: C.blue }}>STMG</div>
              </div>
            </div>
          </div>
        </div>
        {frame >= ps ? (
          <Card style={{ left: 300, top: 760, width: 560, padding: "26px 30px", transform: `translateY(${(1 - app) * 700}px) rotate(${(1 - app) * 10 + 2}deg)` }}>
            <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 40 }}>Parcoursup</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16 }}>
              <svg width={64} height={64} viewBox="0 0 50 50" style={{ transform: `rotate(${frame * 12}deg)` }}>
                <circle cx={25} cy={25} r={20} fill="none" stroke="#E4E7EF" strokeWidth={6} />
                <path d="M25 5 A20 20 0 0 1 45 25" fill="none" stroke={C.blue} strokeWidth={6} strokeLinecap="round" />
              </svg>
              <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 32, color: C.ink2 }}>Chargement de tes envies…</div>
            </div>
          </Card>
        ) : null}
        <Stamp at={no} text="PAS AIDÉ" style={{ left: 340, top: 850 }} size={84} />
      </AbsoluteFill>
      <Lui pose="think" x={40} size={360} />
    </AbsoluteFill>
  );
};

/* ---------- 2. Il cherche partout ---------- */
const S2: React.FC<SP> = ({ len }) => {
  const frame = useCurrentFrame();
  const q = "quoi faire après le bac ?";
  const typed = Math.round(interpolate(frame, [LEAD, at(len, 0.35)], [0, q.length], clamp));
  const scatter = interpolate(frame, [at(len, 0.72), at(len, 0.72) + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill>
      <Background accent={C.mint} accent2={C.blue} />
      <Chapitre n={2} label="Perdu" color={C.mint} />
      <Title text="Il a cherché partout…" hl={["partout…"]} at={LEAD} size={84} top={270} />
      <Card style={{ left: 70, right: 150, top: 450, padding: "22px 28px", display: "flex", alignItems: "center", gap: 18, borderRadius: 999 }}>
        <span style={{ fontSize: 44 }}>🔍</span>
        <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: 40 }}>{q.slice(0, typed)}<span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span></span>
      </Card>
      {Array.from({ length: 9 }).map((_, i) => {
        const a = at(len, 0.3) + i * 3;
        const p = interpolate(frame, [a, a + 10], [0, 1], { ...clamp, easing: ease });
        if (frame < a) return null;
        const r = random(`s${i}`);
        const x = 70 + (i % 3) * 270 + (r - 0.5) * 30;
        const y = 600 + Math.floor(i / 3) * 190;
        const dx = (r - 0.5) * 1600 * scatter, dy = (random(`t${i}`) - 0.2) * 1400 * scatter;
        return (
          <Card key={i} style={{ left: x, top: y, width: 240, padding: "18px 18px", borderRadius: 20, transform: `translate(${(1 - p) * (i % 2 ? 600 : -600) + dx}px, ${dy}px) rotate(${(r - 0.5) * 14 + scatter * (r - 0.5) * 120}deg)`, opacity: 1 - scatter * 0.6 }}>
            <div style={{ height: 14, width: "80%", background: C.blue, borderRadius: 7, opacity: 0.5 }} />
            <div style={{ height: 10, width: "95%", background: "#E4E7EF", borderRadius: 5, marginTop: 12 }} />
            <div style={{ height: 10, width: "70%", background: "#E4E7EF", borderRadius: 5, marginTop: 8 }} />
          </Card>
        );
      })}
      <div style={{ position: "absolute", left: 70, top: 1000, fontFamily: TITLE, fontWeight: 800, fontSize: 110, color: C.pink, opacity: scatter, transform: `scale(${0.6 + 0.4 * scatter})`, transformOrigin: "left center", textShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>Rien de clair.</div>
      <Lui pose="think" x={620} size={320} look={-0.6} />
    </AbsoluteFill>
  );
};

/* ---------- 3. Vœux au hasard : le dé, puis REFUSÉ ---------- */
const Die: React.FC<{ t: number }> = ({ t }) => {
  const s = 150, h = s / 2;
  const face = (tr: string, dots: number[][], bg = C.white) => (
    <div style={{ position: "absolute", width: s, height: s, background: bg, borderRadius: 26, border: "4px solid #E4E7EF", transform: tr }}>
      {dots.map(([x, y], k) => <div key={k} style={{ position: "absolute", left: x * s - 13, top: y * s - 13, width: 26, height: 26, borderRadius: "50%", background: C.navy }} />)}
    </div>
  );
  const c = [0.5, 0.5], a = [0.25, 0.25], b = [0.75, 0.75], d = [0.25, 0.75], e = [0.75, 0.25];
  return (
    <div style={{ width: s, height: s, position: "relative", transformStyle: "preserve-3d", transform: `rotateX(${t * 1.3}deg) rotateY(${t * 1.7}deg)` }}>
      {face(`translateZ(${h}px)`, [c])}
      {face(`rotateY(180deg) translateZ(${h}px)`, [a, b, d, e, c])}
      {face(`rotateY(90deg) translateZ(${h}px)`, [a, b])}
      {face(`rotateY(-90deg) translateZ(${h}px)`, [a, c, b])}
      {face(`rotateX(90deg) translateZ(${h}px)`, [a, b, d, e])}
      {face(`rotateX(-90deg) translateZ(${h}px)`, [a, b, d, e, [0.25, 0.5], [0.75, 0.5]])}
    </div>
  );
};

const S3: React.FC<SP> = ({ len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const roll = interpolate(frame, [0, at(len, 0.4)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const no = at(len, 0.72);
  const fall = interpolate(frame, [no + 18, no + 40], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const flash = interpolate(frame, [no, no + 3, no + 12], [0, 0.45, 0], clamp);
  return (
    <AbsoluteFill>
      <Background accent={C.pink} accent2={C.gold} />
      <AbsoluteFill style={{ transform: shake(frame, [no], 26) }}>
        <Chapitre n={3} label="Parcoursup" color={C.pink} />
        <Title text="Des vœux au hasard…" hl={["hasard…"]} at={LEAD} size={88} top={270} />
        <div style={{ position: "absolute", left: 70 + roll * 560, top: 470 - Math.abs(Math.sin(roll * Math.PI * 3)) * 140 * (1 - roll), perspective: 900 }}>
          <Die t={roll * 900} />
        </div>
        {[0, 1, 2].map((k) => {
          const a = at(len, 0.28) + k * 6;
          const p = spring({ frame: frame - a, fps, config: { damping: 12 } });
          if (frame < a) return null;
          const refused = frame >= no;
          return (
            <Card key={k} style={{ left: 70 + k * 270, top: 720 + (k % 2) * 40 + fall * (700 + k * 120), width: 240, padding: "20px 20px", transform: `translateY(${(1 - p) * 900}px) rotate(${(k - 1) * 6 + fall * (k - 1) * 40}deg)`, filter: refused ? "grayscale(1) brightness(0.85)" : undefined }}>
              <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 32 }}>Vœu {k + 1}</div>
              <div style={{ fontSize: 46, margin: "6px 0" }}>🎲</div>
              <div style={{ height: 10, width: "90%", background: "#E4E7EF", borderRadius: 5 }} />
              <div style={{ height: 10, width: "60%", background: "#E4E7EF", borderRadius: 5, marginTop: 8 }} />
            </Card>
          );
        })}
        <Stamp at={no} text="REFUSÉ" style={{ left: 170, top: 820 }} size={120} />
        <Burst at={no} x={480} y={900} color={C.pink} n={16} len={320} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.pink, opacity: flash }} />
    </AbsoluteFill>
  );
};

/* ---------- 4. L'école payante, puis il arrête ---------- */
const S4: React.FC<SP> = ({ len }) => {
  const frame = useCurrentFrame();
  const roll = interpolate(frame, [LEAD, at(len, 0.45)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const tear = interpolate(frame, [at(len, 0.82), at(len, 0.82) + 22], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const rows = ["Frais d'inscription", "Frais de scolarité", "Matériel", "Total"];
  const half = (side: -1 | 1) => (
    <div style={{ position: "absolute", left: 0, top: 0, width: 600, height: 760 * roll, overflow: "hidden", clipPath: side < 0 ? "polygon(0 0, 52% 0, 46% 20%, 54% 40%, 45% 60%, 53% 80%, 48% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 48% 100%, 53% 80%, 45% 60%, 54% 40%, 46% 20%)", transform: `translate(${side * tear * 260}px, ${tear * tear * 900}px) rotate(${side * tear * 22}deg)` }}>
      <div style={{ width: 600, height: 760, background: "#FFFDF6", borderRadius: "16px 16px 0 0", padding: "34px 36px", boxSizing: "border-box", backgroundImage: "radial-gradient(circle at 50% 100%, transparent 14px, #FFFDF6 15px)", boxShadow: "0 30px 70px rgba(0,0,0,0.45)" }}>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 40, color: C.navy, textAlign: "center" }}>ÉCOLE PRIVÉE</div>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 24, color: C.ink2, textAlign: "center", marginTop: 4 }}>Reçu d'inscription</div>
        <div style={{ borderTop: "3px dashed #D5D9E4", margin: "22px 0" }} />
        {rows.map((r, k) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontFamily: BODY, fontWeight: k === 3 ? 800 : 600, fontSize: k === 3 ? 38 : 32, color: C.navy, margin: "18px 0" }}>
            <span>{r}</span><span style={{ color: k === 3 ? C.pink : C.navy }}>{"€".repeat(k === 3 ? 4 : 2)}</span>
          </div>
        ))}
        <div style={{ borderTop: "3px dashed #D5D9E4", margin: "22px 0" }} />
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 34, color: C.ink2, textAlign: "center" }}>Le seul choix restant</div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.pink} />
      <Chapitre n={4} label="L'école payante" />
      <Title text="Une école payante. Par défaut." hl={["payante."]} at={LEAD} size={76} top={270} />
      <div style={{ position: "absolute", left: 70, top: 480, width: 600, height: 760 }}>
        {half(-1)}
        {half(1)}
      </div>
      <div style={{ position: "absolute", left: 70, top: 1290, fontFamily: TITLE, fontWeight: 800, fontSize: 84, color: C.white, opacity: tear, transform: `translateY(${(1 - tear) * 60}px)` }}>Il a <span style={{ color: C.gold }}>arrêté</span>.</div>
      <Lui pose={frame < at(len, 0.55) ? "idle" : "think"} x={640} size={320} look={-0.6} />
    </AbsoluteFill>
  );
};

/* ---------- 5. Rebondir ---------- */
const S5: React.FC<SP> = ({ len }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [LEAD, at(len, 0.9)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const path = "M 0 120 C 80 160, 150 260, 230 300 S 380 310, 450 220 S 600 40, 760 10";
  return (
    <AbsoluteFill>
      <Background accent={C.mint} accent2={C.gold} />
      <Chapitre n={5} label="Rebondir" color={C.mint} />
      <Title text="Il a rebondi." hl={["rebondi."]} at={LEAD} size={96} top={270} />
      <svg width={800} height={380} viewBox="-20 -20 800 360" style={{ position: "absolute", left: 70, top: 460, overflow: "visible" }}>
        <path d={path} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={14} strokeLinecap="round" />
        <path d={path} fill="none" stroke={C.gold} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        {draw > 0.97 ? <polygon points="760,10 720,0 744,40" fill={C.gold} transform="rotate(-10 760 10)" /> : null}
      </svg>
      <Chip at={at(len, 0.12)} text="🚀 Sa propre activité" from="left" size={44} style={{ left: 70, top: 900 }} />
      <Chip at={at(len, 0.5)} text="📚 Reprendre ses études" bg={C.mint} from="left" size={44} style={{ left: 70, top: 1030 }} />
      <Chip at={at(len, 0.8)} text="✓ En choisissant vraiment" bg={C.gold} from="left" size={44} style={{ left: 70, top: 1160 }} />
      <Burst at={at(len, 0.8) + 4} x={520} y={1210} n={14} len={220} />
      <Lui pose={frame > at(len, 0.8) ? "cheer" : "idle"} x={660} size={300} look={-0.6} />
    </AbsoluteFill>
  );
};

/* ---------- 6. La création de trouvetavoie ---------- */
const S6: React.FC<SP> = ({ len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const land = LEAD + 6;
  const tile = spring({ frame: frame - (land - 8), fps, config: { damping: 9, mass: 0.7 } });
  const ring = interpolate(frame, [land - 4, land + 14], [0, 1], { ...clamp, easing: ease });
  const needle = spring({ frame: frame - land, fps, config: { damping: 7, mass: 0.8 } });
  const phone = spring({ frame: frame - at(len, 0.3), fps, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.blue} />
      <div style={{ position: "absolute", left: 70, top: 200, width: 130, height: 130, borderRadius: 36, background: C.gold, transform: `scale(${tile}) rotate(${(1 - tile) * -90}deg)`, boxShadow: "0 0 80px rgba(255,201,60,0.55)", display: "grid", placeItems: "center" }}>
        <svg width={96} height={96} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2.2} strokeLinecap="round">
          <circle cx="12" cy="12" r="9" strokeDasharray={57} strokeDashoffset={57 * (1 - ring)} transform="rotate(-90 12 12)" />
          <g transform={`rotate(${(1 - needle) * -540} 12 12)`}><polygon points="15.5,8.5 13.5,13.5 8.5,15.5 10.5,10.5" fill={C.navy} /></g>
        </svg>
      </div>
      <Burst at={land} x={135} y={265} n={14} len={200} />
      <Confetti at={land} x={135} y={265} n={40} spread={600} />
      <Title text="Alors il a créé trouvetavoie" hl={["trouvetavoie"]} at={LEAD + 4} size={70} top={360} />
      <div style={{ position: "absolute", inset: 0, perspective: 1500 }}>
        <Phone src="accueil" width={360} scroll={interpolate(frame, [at(len, 0.35), at(len, 1)], [0, 1400], { ...clamp, easing: Easing.inOut(Easing.cubic) })} glare={interpolate(frame, [at(len, 0.3), at(len, 0.55)], [0, 1], clamp)} style={{ left: 560, top: 560 + (1 - phone) * 1200, transform: `rotateY(-16deg) rotateX(4deg)` }} />
      </div>
      <div style={{ position: "absolute", left: 70, top: 600, opacity: interpolate(frame, [at(len, 0.5), at(len, 0.56)], [0, 1], clamp) }}>
        <Roller value={84} at={at(len, 0.5)} size={170} />
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 52, color: C.white, marginTop: -6 }}>métiers</div>
      </div>
      <Chip at={at(len, 0.7)} text="🧭 Tous les chemins" from="left" size={40} style={{ left: 70, top: 920 }} />
      <Chip at={at(len, 0.88)} text="✅ Quiz gratuit" bg={C.mint} from="left" size={40} style={{ left: 70, top: 1030 }} />
      <Lui pose="point" x={40} size={300} look={0.7} />
    </AbsoluteFill>
  );
};

/* ---------- 7. À toi ---------- */
const S7: React.FC<SP> = ({ len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = at(len, 0.62);
  const btn = spring({ frame: frame - b, fps, config: { damping: 9, mass: 0.7 } });
  const pulse = 1 + Math.sin(frame / 5) * 0.035;
  const shine = ((((frame - b) % 45) + 45) % 45) / 45;
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.pink} />
      <Confetti at={0} rain n={46} />
      <div style={{ position: "absolute", left: 70, top: 200, transform: `scale(${useIn(2, 10)})`, transformOrigin: "left center" }}><Logo size={56} /></div>
      <Title text="Choisis ta voie. Ne la subis pas." hl={["voie.", "subis"]} at={LEAD} size={100} top={320} />
      <div style={{ position: "absolute", left: 70, top: 800, transform: `scale(${btn * pulse})`, transformOrigin: "left center", background: C.gold, color: C.navy, borderRadius: 999, padding: "28px 52px", fontFamily: TITLE, fontWeight: 800, fontSize: 66, boxShadow: "0 0 90px rgba(255,201,60,0.55)", overflow: "hidden", whiteSpace: "nowrap" }}>
        Lien en bio 👆
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${shine * 160 - 40}%, rgba(255,255,255,0.7) ${shine * 160 - 25}%, transparent ${shine * 160 - 10}%)` }} />
      </div>
      <Burst at={b} x={330} y={870} n={16} len={300} />
      <Chip at={b + 10} text="trouvetavoie.pages.dev" size={38} style={{ left: 70, top: 980 }} />
      <Lui pose="wave" x={600} size={400} look={-0.5} delay={6} />
    </AbsoluteFill>
  );
};

export type H2Props = { voice?: H2Voice | null };

export const Histoire2Video: React.FC<H2Props> = ({ voice }) => {
  const { voice: v, lens, durs, starts, total } = histoire2Timeline(voice);
  const S = [S0, S1, S2, S3, S4, S5, S6, S7];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tr: any[] = [
    iris({ width: W, height: H }),
    cube({ direction: "from-right" }),
    wipe({ direction: "from-left" }),
    pushCut({ flashColor: C.pink, flashOpacity: 0.85 }),
    slide({ direction: "from-bottom" }),
    clockWipe({ width: W, height: H }),
    cube({ direction: "from-bottom" }),
  ];
  const A = (i: number, r: number) => starts[i] + at(lens[i], r);
  const sfx: [string, number, number][] = [
    ["whoosh", 0, 0.45], ["whoosh", 18, 0.25],
    ["whoosh", starts[1] - 2, 0.4], ["pop", starts[1] + LEAD, 0.4], ["whoosh", A(1, 0.42) - 4, 0.3], ["boom", A(1, 0.78), 0.5],
    ["whoosh", starts[2] - 2, 0.4], ...Array.from({ length: 9 }).map((_, k) => ["pop", A(2, 0.3) + k * 3, 0.18] as [string, number, number]), ["whoosh", A(2, 0.72), 0.45],
    ["whoosh", starts[3] - 2, 0.4], ...[0, 1, 2].map((k) => ["pop", A(3, 0.28) + k * 6, 0.35] as [string, number, number]), ["boom", A(3, 0.72), 0.65],
    ["whoosh", starts[4] - 2, 0.4], ["cash", A(4, 0.3), 0.35], ["whoosh", A(4, 0.82), 0.5],
    ["whoosh", starts[5] - 2, 0.4], ...[0.12, 0.5, 0.8].map((r) => ["pop", A(5, r), 0.4] as [string, number, number]), ["ding", A(5, 0.8) + 4, 0.45],
    ["whoosh", starts[6] - 2, 0.4], ["boom", starts[6] + LEAD + 6, 0.45], ["ding", starts[6] + LEAD + 8, 0.5], ["ding", A(6, 0.5) + 30, 0.35], ["pop", A(6, 0.7), 0.4], ["pop", A(6, 0.88), 0.4],
    ["whoosh", starts[7] - 2, 0.45], ["boom", A(7, 0.62), 0.45], ["ding", A(7, 0.62) + 4, 0.5],
  ];
  return (
    <AbsoluteFill style={{ background: C.navy, fontFamily: BODY }}>
      <Audio src={staticFile("audio/music.wav")} volume={(f) => (f > total - 45 ? 0.14 * Math.max(0, (total - f) / 45) : 0.11)} />
      {v
        ? HISTOIRE2.map((_, i) => (
            <Sequence key={i} from={starts[i] + LEAD} durationInFrames={lens[i] + 12} layout="none">
              <Audio src={staticFile(`voice-histoire2/scene${i}.wav`)} volume={1} />
            </Sequence>
          ))
        : null}
      {sfx.map(([n, t, vol], i) => (
        <Sequence key={i} from={Math.max(0, t)} durationInFrames={40} layout="none">
          <Audio src={staticFile(`audio/${n}.wav`)} volume={vol} />
        </Sequence>
      ))}
      <TransitionSeries>
        {S.flatMap((Comp, i) => [
          <TransitionSeries.Sequence key={`s${i}`} durationInFrames={durs[i]}>
            <Comp v={v} len={lens[i]} />
          </TransitionSeries.Sequence>,
          ...(i < S.length - 1 ? [<TransitionSeries.Transition key={`t${i}`} presentation={tr[i]} timing={linearTiming({ durationInFrames: T })} />] : []),
        ])}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/** Miniature TikTok de « Mon histoire » v2 : 1080×1920 */
export const MiniHistoire2: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #3A2350 0%, ${C.navy} 60%, #070B1C 100%)`, fontFamily: TITLE, color: C.white }}>
    <div style={{ position: "absolute", left: 70, top: 220, background: C.gold, color: C.navy, fontWeight: 800, fontSize: 42, padding: "12px 30px", borderRadius: 999, letterSpacing: 1.5 }}>L'HISTOIRE DE TROUVETAVOIE</div>
    <div style={{ position: "absolute", left: 70, right: 130, top: 330, fontSize: 104, fontWeight: 800, lineHeight: 1.03, textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
      VŒUX AU HASARD, <span style={{ color: C.pink }}>REFUSÉ.</span> ALORS IL A CRÉÉ <span style={{ color: C.gold }}>SA VOIE.</span>
    </div>
    <div style={{ position: "absolute", left: 120, top: 980, border: `10px solid ${C.pink}`, color: C.pink, borderRadius: 22, padding: "8px 30px", fontWeight: 800, fontSize: 96, letterSpacing: 3, background: "rgba(255,255,255,0.96)", transform: "rotate(-12deg)" }}>REFUSÉ</div>
    <div style={{ position: "absolute", left: 560, top: 1120 }}><Mascot pose="point" size={420} lookX={-0.6} /></div>
    <div style={{ position: "absolute", left: 70, top: 1300 }}><Logo size={44} /></div>
  </AbsoluteFill>
);
