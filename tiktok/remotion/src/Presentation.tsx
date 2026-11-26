// Vidéo de présentation du site (TikTok, 1080×1920), en motion design, avec de vraies captures du site.
// Zones laissées libres pour TikTok : en haut (~170 px), en bas (légende, ~380 px) et à droite (boutons, ~150 px).
// Uniquement des faits vrais : 84 métiers, quiz gratuit sans inscription, chemins, écoles, plan Parcoursup, calendrier, comparateur, lettres.
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
import { Background, BODY, C, Emoji, Logo, TITLE, useIn } from "./ui";
import { Burst, Chip, clamp, Confetti, ease, Phone, Roller, shake, Title } from "./fx";
import { PRESENTATION } from "./presentation-texte";

export { PRESENTATION };

export type PVoice = { key: string; scenes?: { file: string; dur: number }[]; segs: Record<string, { dur: number; env: number[] }> };
const FPS = 30, T = 16, LEAD = 8;
const TAIL = [24, 34, 40, 36, 40, 44, 44, 80];
const W = 1080, H = 1920;

export function presTimeline(v?: PVoice | null) {
  const voice = v && v.key === "presentation" ? v : null;
  const lens = PRESENTATION.map((t, i) => Math.ceil(FPS * (voice?.segs[`p${i}`]?.dur ?? t.split(" ").length * 0.32)));
  const durs = lens.map((l, i) => LEAD + l + TAIL[i]);
  const starts: number[] = [];
  let acc = 0;
  durs.forEach((d, i) => { starts.push(acc); acc += d - (i < durs.length - 1 ? T : 0); });
  return { voice, lens, durs, starts, total: acc };
}

const mouthAt = (v: PVoice | null, i: number, f: number) => {
  const e = v?.segs[`p${i}`]?.env;
  const k = f - LEAD;
  if (!e) return k >= 0 && k < 50 ? 0.5 + 0.5 * Math.abs(Math.sin(k * 0.9)) : 0;
  return k >= 0 && k < e.length ? e[k] : 0;
};

/* ---------- briques de motion design ---------- */

/** Doigt qui tape à l'écran (coordonnées en pixels de la capture, 780 de large) */
const Tap: React.FC<{ at: number; x: number; y: number; scroll?: number; width?: number }> = ({ at, x, y, scroll = 0, width = 440 }) => {
  const frame = useCurrentFrame();
  const k = (width - 28) / 780;
  if (frame < at - 14 || frame > at + 22) return null;
  const come = interpolate(frame, [at - 14, at], [1, 0], { ...clamp, easing: ease });
  const r = interpolate(frame, [at, at + 18], [0, 1], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: x * k - 60 * r, top: (y - scroll) * k - 60 * r, width: 120 * r, height: 120 * r, borderRadius: "50%", border: `6px solid ${C.gold}`, opacity: 1 - r }} />
      <div style={{ position: "absolute", left: x * k - 10, top: (y - scroll) * k - 6, fontSize: 72, transform: `translate(${come * 80}px, ${come * 120}px) scale(${frame >= at && frame < at + 5 ? 0.86 : 1})`, filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.35))" }}>👆</div>
    </>
  );
};

/** Surlignage d'une ligne de la capture au moment où on la choisit */
const Pick: React.FC<{ at: number; y: number; h?: number; scroll?: number; width?: number }> = ({ at, y, h = 112, scroll = 0, width = 440 }) => {
  const frame = useCurrentFrame();
  const k = (width - 28) / 780;
  const p = interpolate(frame, [at, at + 6], [0, 1], clamp);
  if (p <= 0) return null;
  return <div style={{ position: "absolute", left: 36 * k, top: (y - scroll - h / 2) * k, width: 708 * k, height: h * k, borderRadius: 14, border: `4px solid ${C.navy}`, background: "rgba(255,201,60,0.28)", opacity: p, transform: `scale(${1 + 0.04 * Math.sin(p * Math.PI)})` }} />;
};

/** Légende reliée au téléphone par un trait */
const Callout: React.FC<{ at: number; x: number; y: number; fromX: number; icon: string; text: string; color: string }> = ({ at, x, y, fromX, icon, text, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = interpolate(frame, [at, at + 8], [0, 1], { ...clamp, easing: ease });
  const p = spring({ frame: frame - at - 5, fps, config: { damping: 11, mass: 0.6 } });
  if (frame < at) return null;
  return (
    <>
      <div style={{ position: "absolute", left: fromX, top: y + 38, width: (x - fromX) * line, height: 5, background: color, borderRadius: 3 }} />
      <div style={{ position: "absolute", left: fromX - 10, top: y + 30, width: 20, height: 20, borderRadius: "50%", background: color, transform: `scale(${line})` }} />
      <div style={{ position: "absolute", left: x, top: y, transform: `scale(${p})`, transformOrigin: "left center", display: "flex", alignItems: "center", gap: 14, background: C.white, color: C.navy, borderRadius: 24, padding: "14px 24px 14px 14px", boxShadow: "0 18px 40px rgba(0,0,0,0.35)", fontFamily: TITLE, fontWeight: 800, fontSize: 34, whiteSpace: "nowrap" }}>
        <span style={{ width: 56, height: 56, borderRadius: 16, background: color, display: "grid", placeItems: "center", fontSize: 32 }}>{icon}</span>
        {text}
      </div>
    </>
  );
};

const Mascotte: React.FC<{ v: PVoice | null; i: number; pose: Pose; at?: number; x?: number; size?: number; look?: number }> = ({ v, i, pose, at = 4, x = 30, size = 400, look = 0.6 }) => {
  const frame = useCurrentFrame();
  const m = useIn(at, 13);
  return (
    <div style={{ position: "absolute", left: x, top: H - 360 - size, transform: `translateY(${(1 - m) * 520}px)` }}>
      <Mascot pose={pose} mouth={mouthAt(v, i, frame)} size={size} lookX={look} seed={i + 2} />
    </div>
  );
};

type SP = { v: PVoice | null; len: number };
const at = (len: number, r: number) => LEAD + Math.round(len * r);

/* ---------- les scènes ---------- */

// 0. Accroche
const S0: React.FC<SP> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = [["TU SAIS PAS", 0], ["QUOI FAIRE", 0.32], ["APRÈS LE BAC ?", 0.6]] as [string, number][];
  const hits = lines.map(([, r]) => at(len, r));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #1F2A5E 0%, #0B1128 55%, #04060F 100%)" }}>
      {Array.from({ length: 16 }).map((_, i) => {
        const r = random(`q${i}`);
        const y = ((r * 2000 - frame * (3 + r * 4)) % 2100 + 2100) % 2100 - 100;
        return <div key={i} style={{ position: "absolute", left: random(`x${i}`) * 1000, top: y, fontFamily: TITLE, fontWeight: 800, fontSize: 60 + r * 120, color: i % 2 ? C.gold : C.pink, opacity: 0.16 + r * 0.2, transform: `rotate(${(r - 0.5) * 50 + frame * (r - 0.5) * 2}deg)` }}>?</div>;
      })}
      <AbsoluteFill style={{ transform: shake(frame, hits), justifyContent: "center", paddingLeft: 70, paddingRight: 150, paddingBottom: 300 }}>
        {lines.map(([t, r], k) => {
          const a = at(len, r);
          const p = spring({ frame: frame - a, fps, config: { damping: 12, mass: 0.7 } });
          const ab = interpolate(frame, [a, a + 10], [16, 0], clamp);
          if (frame < a) return <div key={k} style={{ height: 150 }} />;
          const last = k === lines.length - 1;
          return (
            <div key={k} style={{ fontFamily: TITLE, fontWeight: 800, fontSize: last ? 128 : 116, lineHeight: 1.1, color: last ? C.gold : C.white, transform: `scale(${3 - 2 * p}) rotate(${(1 - p) * -6}deg)`, transformOrigin: "left center", opacity: Math.min(1, p * 2), textShadow: `${ab}px 0 0 rgba(232,67,106,0.85), ${-ab}px 0 0 rgba(61,220,151,0.85), 0 16px 40px rgba(0,0,0,0.5)`, whiteSpace: "nowrap" }}>{t}</div>
          );
        })}
      </AbsoluteFill>
      <Mascotte v={v} i={0} pose="think" at={6} size={380} x={600} look={-0.6} />
    </AbsoluteFill>
  );
};

// 1. Révélation du logo
const S1: React.FC<SP> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const land = at(len, 0.42);
  const tile = spring({ frame: frame - (land - 10), fps, config: { damping: 9, mass: 0.7 } });
  const ring = interpolate(frame, [land - 6, land + 14], [0, 1], { ...clamp, easing: ease });
  const needle = spring({ frame: frame - land, fps, config: { damping: 7, mass: 0.8 } });
  const word = "trouvetavoie".split("");
  const sweep = interpolate(frame, [land + 22, land + 46], [-30, 130], clamp);
  const rays = interpolate(frame, [land, land + 20], [0, 1], clamp);
  const cy = 820;
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.blue} />
      <div style={{ position: "absolute", left: W / 2 - 700, top: cy - 700, width: 1400, height: 1400, borderRadius: "50%", background: "repeating-conic-gradient(from 0deg, rgba(255,201,60,0.16) 0deg 8deg, transparent 8deg 20deg)", opacity: rays, transform: `rotate(${frame * 0.6}deg) scale(${0.6 + 0.4 * rays})`, maskImage: "radial-gradient(circle, #000 0%, transparent 62%)" }} />
      <Title text="Pas de panique." at={LEAD} size={66} top={230} />
      <div style={{ position: "absolute", left: W / 2 - 150, top: cy - 150, width: 300, height: 300, borderRadius: 80, background: C.gold, transform: `scale(${tile}) rotate(${(1 - tile) * -90}deg)`, boxShadow: "0 0 120px rgba(255,201,60,0.55)", display: "grid", placeItems: "center" }}>
        <svg width={220} height={220} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" strokeDasharray={57} strokeDashoffset={57 * (1 - ring)} transform="rotate(-90 12 12)" />
          <g transform={`rotate(${(1 - needle) * -540} 12 12)`}>
            <polygon points="15.5,8.5 13.5,13.5 8.5,15.5 10.5,10.5" fill={C.navy} />
          </g>
        </svg>
      </div>
      <Burst at={land} x={W / 2} y={cy} n={18} len={330} />
      <Confetti at={land} x={W / 2} y={cy} n={50} spread={700} />
      <div style={{ position: "absolute", left: 0, right: 0, top: cy + 210, display: "flex", justifyContent: "center", fontFamily: TITLE, fontWeight: 800, fontSize: 112, overflow: "hidden", padding: "0 20px" }}>
        <div style={{ position: "relative", display: "flex" }}>
          {word.map((ch, i) => {
            const p = spring({ frame: frame - (land + 6 + i * 2), fps, config: { damping: 12, mass: 0.5 } });
            return <span key={i} style={{ display: "inline-block", color: i < 6 ? C.white : C.gold, transform: `translateY(${(1 - p) * 140}px)`, opacity: p }}>{ch}</span>;
          })}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent ${sweep - 15}%, rgba(255,255,255,0.75) ${sweep}%, transparent ${sweep + 15}%)`, mixBlendMode: "overlay" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: cy + 390, textAlign: "center", fontFamily: TITLE, fontWeight: 700, fontSize: 46, color: "#D7DCEB", opacity: interpolate(frame, [land + 26, land + 40], [0, 1], clamp), transform: `translateY(${interpolate(frame, [land + 26, land + 40], [30, 0], clamp)}px)` }}>
        Choisis ton métier. On te montre <span style={{ color: C.gold }}>tous les chemins</span>.
      </div>
    </AbsoluteFill>
  );
};

// 2. Le quiz, en vrai, sur téléphone
const S2: React.FC<SP> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 2, fps, config: { damping: 14, mass: 0.9 } });
  const t1 = at(len, 0.14), sw1 = at(len, 0.3), t2 = at(len, 0.44), sw2 = at(len, 0.6);
  const screen = frame < sw1 ? "quiz1" : frame < sw2 ? "quiz2" : "resultats";
  const flash = Math.max(interpolate(frame, [sw1 - 2, sw1, sw1 + 6], [0, 1, 0], clamp), interpolate(frame, [sw2 - 2, sw2, sw2 + 6], [0, 1, 0], clamp));
  const scroll = screen === "resultats" ? interpolate(frame, [sw2 + 10, sw2 + 120], [0, 760], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  const tiltY = interpolate(enter, [0, 1], [55, -14]) + Math.sin(frame / 22) * 3;
  const pw = 450;
  return (
    <AbsoluteFill>
      <Background accent={C.pink} accent2={C.blue} />
      <Title text="Un quiz gratuit" hl={["gratuit"]} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, perspective: 1600 }}>
        <Phone src={screen} scroll={scroll} width={pw} glare={interpolate(frame, [10, 50], [0, 1], clamp)} style={{ left: 470 + (1 - enter) * 700, top: 410, transform: `rotateY(${tiltY}deg) rotateX(6deg)` }}>
          {screen === "quiz1" ? <><Pick at={t1} y={993} /><Tap at={t1} x={560} y={993} /></> : null}
          {screen === "quiz2" ? <><Pick at={t2} y={1197} /><Tap at={t2} x={560} y={1197} /></> : null}
          <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
        </Phone>
      </div>
      <Chip at={at(len, 0.08)} text="✅ Gratuit" bg={C.mint} from="left" style={{ left: 70, top: 520 }} />
      <Chip at={at(len, 0.2)} text="🔓 Sans inscription" from="left" size={36} style={{ left: 70, top: 640 }} />
      <Chip at={at(len, 0.42)} text="⏱ 5 minutes" bg={C.gold} from="left" style={{ left: 70, top: 760 }} />
      <Chip at={sw2 + 8} text="✨ Tes métiers" bg={C.pink} fg={C.white} size={38} style={{ left: 70, top: 900 }} />
      <Burst at={sw2 + 8} x={250} y={940} color={C.pink} n={12} len={150} />
      <Mascotte v={v} i={2} pose="point" at={18} size={330} x={40} look={0.8} />
    </AbsoluteFill>
  );
};

// 3. 84 métiers
const KEYS = ["infirmier", "developpeur", "medecin", "avocat", "pilote", "architecte", "psychologue", "cuisinier", "kine", "pompier", "graphiste", "veterinaire", "journaliste", "policier", "comptable", "ingenieur", "photographe", "electricien", "sagefemme", "jeuxvideo", "boulanger", "sport", "prof", "marketing", "cyber", "coiffeur", "pharmacien", "styliste", "dentiste", "osteo", "pnc", "uxdesigner"];
const S3: React.FC<SP> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grid = interpolate(frame, [0, 20], [0, 1], { ...clamp, easing: ease });
  const big = spring({ frame: frame - LEAD, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <Background accent={C.mint} accent2={C.blue} />
      <div style={{ position: "absolute", inset: -400, perspective: 1300, opacity: 0.85 * grid }}>
        <div style={{ position: "absolute", left: 0, top: 300, width: 1880, transform: "rotateX(52deg) rotateZ(-18deg)", transformOrigin: "50% 50%" }}>
          {Array.from({ length: 7 }).map((_, row) => {
            const dir = row % 2 ? 1 : -1;
            const off = ((frame * 3.2 * dir + row * 137) % 190 + 190) % 190;
            return (
              <div key={row} style={{ display: "flex", gap: 30, marginBottom: 30, transform: `translateX(${off - 190}px)` }}>
                {Array.from({ length: 12 }).map((_, c) => {
                  const k = KEYS[(row * 5 + c * 3) % KEYS.length];
                  return <div key={c} style={{ width: 160, height: 160, borderRadius: 38, background: "rgba(255,255,255,0.95)", display: "grid", placeItems: "center", flex: "none", boxShadow: "0 14px 30px rgba(0,0,0,0.3)" }}><Emoji name={k} size={104} /></div>;
                })}
              </div>
            );
          })}
        </div>
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,17,40,0.92) 0%, rgba(11,17,40,0.35) 40%, rgba(11,17,40,0.35) 62%, rgba(11,17,40,0.95) 100%)" }} />
      <div style={{ position: "absolute", left: 70, top: 230, transform: `scale(${big})`, transformOrigin: "left top" }}>
        <Roller value={84} at={LEAD} size={300} />
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 86, color: C.white, marginTop: -10 }}>MÉTIERS</div>
        <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 52, color: "#D7DCEB" }}>expliqués simplement</div>
      </div>
      <Chip at={at(len, 0.42)} text="☀️ Le quotidien" from="right" size={46} style={{ left: 70, top: 900 }} />
      <Chip at={at(len, 0.6)} text="💪 Les qualités" bg={C.mint} from="right" size={46} style={{ left: 170, top: 1030 }} />
      <Chip at={at(len, 0.8)} text="💶 Le vrai salaire" bg={C.gold} from="right" size={52} style={{ left: 70, top: 1170 }} />
      <Burst at={at(len, 0.8) + 4} x={460} y={1220} n={14} len={200} />
    </AbsoluteFill>
  );
};

// 4. La fiche métier qui défile, avec légendes
const S4: React.FC<SP> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const scroll = interpolate(frame, [LEAD + 10, LEAD + len + 20], [0, 2900], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pw = 420;
  const right = 70 + pw;
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.pink} />
      <Title text="Tous les chemins" hl={["chemins"]} size={80} />
      <div style={{ position: "absolute", inset: 0, perspective: 1500 }}>
        <Phone src="fiche" scroll={scroll} width={pw} style={{ left: 70, top: 400, transform: `translateY(${(1 - enter) * 900}px) rotateY(${16 + Math.sin(frame / 25) * 3}deg)` }} />
      </div>
      <Callout at={at(len, 0.12)} x={right + 40} y={520} fromX={right - 20} icon="🧭" text="Les chemins" color={C.gold} />
      <Callout at={at(len, 0.5)} x={right + 40} y={700} fromX={right - 20} icon="🏫" text="Les écoles" color={C.mint} />
      <Callout at={at(len, 0.64)} x={right + 40} y={880} fromX={right - 20} icon="💶" text="Leur prix" color={C.pink} />
      <Callout at={at(len, 0.8)} x={right + 40} y={1060} fromX={right - 20} icon="📊" text="Tes chances" color={C.blue} />
    </AbsoluteFill>
  );
};

// 5. Le plan Parcoursup
const S5: React.FC<SP> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scroll = interpolate(frame, [0, LEAD + len + 40], [0, 5200], clamp);
  const cols: [string, string, string, number][] = [["🚀", "Ambitieux", C.pink, 0.42], ["🎯", "Réalistes", C.gold, 0.6], ["🛟", "Plan B", C.mint, 0.82]];
  const pdf = at(len, 0.95);
  return (
    <AbsoluteFill>
      <Background accent={C.pink} accent2={C.gold} />
      <Title text="Ton plan Parcoursup personnalisé" hl={["personnalisé"]} size={74} />
      <div style={{ position: "absolute", inset: 0, perspective: 1400 }}>
        <Phone src="plan" scroll={scroll} width={400} style={{ left: 340, top: 470, transform: "rotateX(14deg) rotateZ(4deg) scale(0.95)", filter: "blur(2px) brightness(0.7)" }} />
      </div>
      {cols.map(([ic, t, col, r], k) => {
        const a = at(len, r);
        const p = spring({ frame: frame - a, fps, config: { damping: 11, mass: 0.7 } });
        if (frame < a) return null;
        const x = 70 + k * 285;
        return (
          <div key={k} style={{ position: "absolute", left: x, top: 640 + k * 40, width: 265, background: C.white, borderRadius: 26, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.45)", transform: `translateY(${(1 - p) * 900}px) rotate(${(1 - p) * (k - 1) * 30 + (k - 1) * 3}deg)` }}>
            <div style={{ height: 14, background: col }} />
            <div style={{ padding: "18px 18px 22px" }}>
              <div style={{ fontSize: 54 }}>{ic}</div>
              <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 38, color: C.navy, marginTop: 4 }}>{t}</div>
              {[0, 1, 2].map((j) => {
                const q = interpolate(frame, [a + 8 + j * 4, a + 16 + j * 4], [0, 1], clamp);
                return (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, opacity: q, transform: `translateX(${(1 - q) * 40}px)` }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: col, display: "grid", placeItems: "center", color: C.navy, fontWeight: 800, fontSize: 20, flex: "none" }}>✓</div>
                    <div style={{ height: 14, borderRadius: 7, background: "#E4E7EF", width: 150 - j * 30 }} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <Burst at={at(len, 0.82) + 6} x={70 + 2 * 285 + 132} y={720} color={C.mint} n={12} len={180} />
      <Chip at={pdf} text="📄 En PDF, à garder" bg={C.white} size={40} style={{ left: 70, top: 1180 }} />
    </AbsoluteFill>
  );
};

// 6. Les outils : carrousel 3D de téléphones
const S6: React.FC<SP> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const items: [string, string][] = [["calendrier", "📅 Le calendrier"], ["comparer", "⚖️ Le comparateur"], ["lettres", "✍️ Les lettres"]];
  const marks = [at(len, 0.0), at(len, 0.3), at(len, 0.58)];
  const gather = at(len, 0.8);
  let idx = 0;
  marks.forEach((m, k) => { if (frame >= m) idx = k; });
  const target = idx;
  const prev = Math.max(0, idx - 1);
  const m0 = marks[idx];
  const turn = idx === 0 ? 0 : interpolate(frame, [m0 - 2, m0 + 12], [prev, target], { ...clamp, easing: ease });
  const g = interpolate(frame, [gather, gather + 16], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      <Background accent={C.blue} accent2={C.mint} />
      <div style={{ position: "absolute", inset: 0, perspective: 1600 }}>
        {items.map(([src], k) => {
          const d = k - turn;
          const ang = d * 42 * (1 - g);
          const x = 300 + d * 330 * (1 - g) + g * (k - 1) * 40;
          const z = -Math.abs(d) * 260 * (1 - g) - g * k * 30;
          const scroll = interpolate(frame, [m0, m0 + 120], [0, k === 1 ? 300 : 700], clamp) * (k === idx ? 1 : 0);
          return <Phone key={k} src={src} scroll={scroll} width={420} style={{ left: x, top: 420, transform: `translateZ(${z}px) rotateY(${-ang}deg) rotateZ(${g * (k - 1) * 7}deg)`, opacity: 1 - Math.min(0.6, Math.abs(d) * 0.35) * (1 - g), zIndex: 10 - Math.round(Math.abs(d) * 2) }} />;
        })}
      </div>
      <div style={{ position: "absolute", left: 70, right: 160, top: 210, height: 120, overflow: "hidden" }}>
        {items.map(([, label], k) => {
          const y = interpolate(frame, [marks[k] - 2, marks[k] + 10], [120, 0], { ...clamp, easing: ease }) + (k < idx ? -120 : 0) + (g > 0 ? -120 * g : 0);
          return <div key={k} style={{ position: "absolute", fontFamily: TITLE, fontWeight: 800, fontSize: 84, color: C.white, transform: `translateY(${frame < marks[k] - 2 ? 120 : y}px)` }}>{label}</div>;
        })}
        <div style={{ position: "absolute", fontFamily: TITLE, fontWeight: 800, fontSize: 70, color: C.gold, transform: `translateY(${(1 - g) * 120}px)` }}>Tout au même endroit</div>
      </div>
      <Burst at={gather + 10} x={510} y={950} n={18} len={360} />
      <Chip at={gather + 12} text="✓ Tout est là" bg={C.gold} size={54} style={{ left: 300, top: 1440 }} />
    </AbsoluteFill>
  );
};

// 7. Appel à l'action
const S7: React.FC<SP> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - 2, fps, config: { damping: 10 } });
  const b = at(len, 0.42);
  const btn = spring({ frame: frame - b, fps, config: { damping: 9, mass: 0.7 } });
  const pulse = 1 + Math.sin(frame / 5) * 0.035;
  const shine = ((frame - b) % 45) / 45;
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.pink} />
      <Confetti at={0} rain n={46} />
      <div style={{ position: "absolute", left: 70, top: 200, transform: `scale(${logo})`, transformOrigin: "left center" }}><Logo size={62} /></div>
      <Title text="Fais le quiz, c'est gratuit." hl={["gratuit."]} at={LEAD + 4} size={96} top={330} />
      <div style={{ position: "absolute", left: 70, top: 720, transform: `scale(${btn * pulse})`, transformOrigin: "left center", background: C.gold, color: C.navy, borderRadius: 999, padding: "30px 56px", fontFamily: TITLE, fontWeight: 800, fontSize: 72, boxShadow: "0 0 90px rgba(255,201,60,0.55)", overflow: "hidden" }}>
        Lien en bio 👆
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${shine * 160 - 40}%, rgba(255,255,255,0.7) ${shine * 160 - 25}%, transparent ${shine * 160 - 10}%)` }} />
      </div>
      <Chip at={b + 10} text="trouvetavoie.pages.dev" bg={C.white} size={40} style={{ left: 70, top: 900 }} />
      <Chip at={b + 16} text="@trouvetavoie.com" bg={C.pink} fg={C.white} size={40} style={{ left: 70, top: 1010 }} />
      <Burst at={b} x={360} y={790} n={16} len={300} />
      <Mascotte v={v} i={7} pose="wave" at={8} size={420} x={560} look={-0.5} />
    </AbsoluteFill>
  );
};

export type PresProps = { voice?: PVoice | null };

export const PresentationVideo: React.FC<PresProps> = ({ voice }) => {
  const { voice: v, lens, durs, starts, total } = presTimeline(voice);
  const S = [S0, S1, S2, S3, S4, S5, S6, S7];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tr: any[] = [
    pushCut({ flashColor: C.gold, flashOpacity: 0.9 }),
    iris({ width: W, height: H }),
    cube({ direction: "from-right" }),
    slide({ direction: "from-bottom" }),
    wipe({ direction: "from-left" }),
    cube({ direction: "from-bottom" }),
    clockWipe({ width: W, height: H }),
  ];
  const A = (i: number, r: number) => starts[i] + at(lens[i], r);
  const sfx: [string, number, number][] = [
    ...[0, 0.32, 0.6].map((r) => ["boom", A(0, r), 0.45] as [string, number, number]),
    ["whoosh", starts[1] - 4, 0.5],
    ["whoosh", A(1, 0.42) - 10, 0.35], ["boom", A(1, 0.42), 0.5], ["ding", A(1, 0.42) + 6, 0.5],
    ["whoosh", starts[2] - 2, 0.4],
    ...[0.08, 0.2, 0.42].map((r) => ["pop", A(2, r), 0.4] as [string, number, number]),
    ["pop", A(2, 0.14), 0.5], ["pop", A(2, 0.44), 0.5], ["whoosh", A(2, 0.3), 0.25], ["ding", A(2, 0.6) + 8, 0.5],
    ["whoosh", starts[3] - 2, 0.4], ["ding", starts[3] + LEAD + 34, 0.4],
    ...[0.42, 0.6].map((r) => ["pop", A(3, r), 0.4] as [string, number, number]), ["cash", A(3, 0.8), 0.5],
    ["whoosh", starts[4] - 2, 0.4],
    ...[0.12, 0.5, 0.64, 0.8].map((r) => ["pop", A(4, r), 0.4] as [string, number, number]),
    ["whoosh", starts[5] - 2, 0.4],
    ...[0.42, 0.6, 0.82].map((r) => ["whoosh", A(5, r) - 4, 0.3] as [string, number, number]),
    ...[0.42, 0.6, 0.82].map((r) => ["pop", A(5, r) + 6, 0.45] as [string, number, number]),
    ["ding", A(5, 0.95), 0.4],
    ["whoosh", starts[6] - 2, 0.4],
    ...[0.3, 0.58].map((r) => ["whoosh", A(6, r), 0.35] as [string, number, number]),
    ["boom", A(6, 0.8) + 10, 0.4], ["ding", A(6, 0.8) + 12, 0.5],
    ["whoosh", starts[7] - 2, 0.45], ["boom", A(7, 0.42), 0.45], ["ding", A(7, 0.42) + 4, 0.5], ["pop", A(7, 0.42) + 10, 0.4], ["pop", A(7, 0.42) + 16, 0.4],
  ];
  return (
    <AbsoluteFill style={{ background: C.navy, fontFamily: BODY }}>
      <Audio src={staticFile("audio/music.wav")} volume={(f) => (f > total - 45 ? 0.15 * Math.max(0, (total - f) / 45) : f < starts[1] ? 0.06 : 0.15)} />
      {v
        ? PRESENTATION.map((_, i) => (
            <Sequence key={i} from={starts[i] + LEAD} durationInFrames={lens[i] + 12} layout="none">
              <Audio src={staticFile(`voice-presentation/scene${i}.wav`)} volume={1} />
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

/** Miniature TikTok de la vidéo de présentation : 1080×1920 */
export const MiniPresentation: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #2A2F6E 0%, ${C.navy} 62%, #070B1C 100%)`, fontFamily: TITLE, color: C.white }}>
    <div style={{ position: "absolute", left: 70, top: 230 }}><Logo size={58} /></div>
    <div style={{ position: "absolute", left: 70, right: 130, top: 360, fontSize: 108, fontWeight: 800, lineHeight: 1.02, textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
      TU SAIS PAS QUOI FAIRE <span style={{ color: C.gold, whiteSpace: "nowrap" }}>APRÈS LE BAC&nbsp;?</span>
    </div>
    <div style={{ position: "absolute", inset: 0, perspective: 1500 }}>
      <Phone src="resultats" width={400} style={{ left: 560, top: 860, transform: "rotateY(-16deg) rotateZ(4deg)" }} />
    </div>
    <div style={{ position: "absolute", left: 60, top: 1080 }}><Mascot pose="point" size={460} lookX={0.7} /></div>
    <div style={{ position: "absolute", left: 70, top: 900, background: C.gold, color: C.navy, fontWeight: 800, fontSize: 46, padding: "16px 32px", borderRadius: 999, transform: "rotate(-3deg)" }}>Quiz gratuit · 84 métiers</div>
  </AbsoluteFill>
);
