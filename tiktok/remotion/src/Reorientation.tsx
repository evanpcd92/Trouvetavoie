// Vidéo « Réorientation » (TikTok, 1080×1920) : pour les étudiants de 1re année qui veulent changer de voie.
// Zones laissées libres pour TikTok : en bas (légende, ~380 px) et à droite (boutons, ~150 px).
// Chiffres réels uniquement (compteurs du site, dates Parcoursup 2027). Pas de témoignage, pas de faux avis.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Mascot, Pose } from "./Mascot";
import { Background, BODY, C, Floaters, Logo, TITLE, useIn, Words } from "./ui";
import { REORIENTATION } from "./reorientation-texte";

export { REORIENTATION };

const SOUS_TITRES = [
  "En 1re année… et pas à ta place ?",
  "Tu peux te réorienter sur Parcoursup.",
  "Le quiz est aussi fait pour toi.",
  "Repars sur de bonnes bases.",
  "Quiz gratuit. Lien en bio !",
];
const HL = ["1re", "place", "réorienter", "Parcoursup.", "aussi", "toi.", "bonnes", "bases.", "gratuit.", "bio"];

export type RVoice = { key: string; scenes?: { file: string; dur: number }[]; segs: Record<string, { dur: number; env: number[] }> };
const FPS = 30, T = 14, LEAD = 10;
const TAIL = [34, 34, 36, 40, 90];

export function reoTimeline(v?: RVoice | null) {
  const voice = v && v.key === "reorientation" ? v : null;
  const lens = REORIENTATION.map((t, i) => Math.ceil(FPS * (voice?.segs[`r${i}`]?.dur ?? t.split(" ").length * 0.3)));
  const durs = lens.map((l, i) => LEAD + l + TAIL[i]);
  const starts: number[] = [];
  let acc = 0;
  durs.forEach((d, i) => { starts.push(acc); acc += d - (i < durs.length - 1 ? T : 0); });
  return { voice, lens, durs, starts, total: acc };
}

const mouth = (v: RVoice | null, i: number, f: number) => {
  const e = v?.segs[`r${i}`]?.env;
  const k = f - LEAD;
  if (!e) return k >= 0 && k < 60 ? 0.5 + 0.5 * Math.abs(Math.sin(k * 0.9)) : 0;
  return k >= 0 && k < e.length ? e[k] : 0;
};

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: C.white, color: C.navy, borderRadius: 32, padding: "28px 34px", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", ...style }}>{children}</div>
);

/** squelette : sous-titre en haut, contenu au milieu, mascotte en bas à gauche (au-dessus de la légende TikTok) */
const Scene: React.FC<{ i: number; v: RVoice | null; len: number; pose: Pose; accent: string; accent2: string; children?: React.ReactNode }> = ({ i, v, len, pose, accent, accent2, children }) => {
  const frame = useCurrentFrame();
  const words = SOUS_TITRES[i].split(" ").length;
  const m = useIn(2, 13);
  return (
    <AbsoluteFill>
      <Background accent={accent} accent2={accent2} />
      <Floaters color={accent} />
      <AbsoluteFill style={{ padding: "230px 160px 0 70px", fontFamily: BODY, color: C.white }}>
        <Words text={SOUS_TITRES[i]} delay={LEAD} per={Math.max(2, (len * 0.55) / words)} style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 80, lineHeight: 1.1 }} highlight={HL} />
        {children}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 30, top: 1920 - 350 - 430, transform: `translateY(${(1 - m) * 500}px)` }}>
        <Mascot pose={pose} mouth={mouth(v, i, frame)} size={430} lookX={0.6} seed={i + 3} />
      </div>
    </AbsoluteFill>
  );
};

const Stamp: React.FC<{ at: number; text: string }> = ({ at, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 9, mass: 0.6 } });
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", right: -10, top: -30, transform: `rotate(10deg) scale(${2 - p})`, opacity: Math.min(1, p * 1.5), border: `6px solid ${C.pink}`, color: C.pink, borderRadius: 14, padding: "6px 18px", fontFamily: TITLE, fontWeight: 800, fontSize: 38, background: "rgba(255,255,255,0.95)", whiteSpace: "nowrap" }}>{text}</div>
  );
};

// 0. Accroche : la 1re année qui ne va pas
const S0: React.FC<{ v: RVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cards = ["Licence 1", "BTS", "Prépa", "BUT"];
  return (
    <Scene i={0} v={v} len={len} pose="think" accent={C.pink} accent2={C.blue}>
      <div style={{ position: "relative", marginTop: 90, height: 560 }}>
        {cards.map((t, k) => {
          const p = spring({ frame: frame - (LEAD + 2 + k * 5), fps, config: { damping: 12 } });
          const wob = Math.sin(frame / 10 + k) * 3;
          return (
            <Card key={k} style={{ position: "absolute", left: k * 46, top: k * 110, width: 560, transform: `translateX(${(1 - p) * 900}px) rotate(${-6 + k * 4 + wob}deg)`, fontFamily: TITLE, fontWeight: 800, fontSize: 56 }}>
              🎓 {t}
              {k === 0 ? <Stamp at={LEAD + Math.round(len * 0.7)} text="PAS POUR MOI ?" /> : null}
            </Card>
          );
        })}
      </div>
    </Scene>
  );
};

// 1. Bonne nouvelle : même calendrier que les terminales
const S1: React.FC<{ v: RVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cal = spring({ frame: frame - (LEAD + Math.round(len * 0.45)), fps, config: { damping: 11 } });
  const chip = useIn(LEAD + Math.round(len * 0.35), 12);
  return (
    <Scene i={1} v={v} len={len} pose="talk" accent={C.mint} accent2={C.blue}>
      <div style={{ marginTop: 60, alignSelf: "flex-start", background: C.mint, color: C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 40, padding: "14px 30px", borderRadius: 999, transform: `scale(${chip})`, transformOrigin: "left center", display: "inline-block" }}>✅ Mêmes dates que les terminales</div>
      <Card style={{ marginTop: 40, width: 680, padding: 0, overflow: "hidden", transform: `scale(${cal}) rotate(${(1 - cal) * -10 - 2}deg)`, transformOrigin: "left top" }}>
        <div style={{ background: C.pink, color: C.white, fontFamily: TITLE, fontWeight: 800, fontSize: 42, padding: "18px 34px" }}>📅 Vœux Parcoursup 2027</div>
        <div style={{ padding: "24px 34px", fontFamily: TITLE }}>
          <div style={{ fontSize: 34, fontWeight: 600, color: C.ink2 }}>du</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>18 janvier</div>
          <div style={{ fontSize: 34, fontWeight: 600, color: C.ink2, marginTop: 8 }}>au</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: C.pink }}>11 mars</div>
        </div>
      </Card>
    </Scene>
  );
};

// 2. Le quiz : la case « je me réoriente » se fait cocher
const S2: React.FC<{ v: RVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opts = ["Bac général", "Bac technologique", "Bac professionnel", "CAP", "Déjà dans le supérieur, je me réoriente"];
  const tapAt = LEAD + Math.round(len * 0.42);
  const tap = spring({ frame: frame - tapAt, fps, config: { damping: 10 } });
  const card = useIn(LEAD + 2, 14);
  return (
    <Scene i={2} v={v} len={len} pose="point" accent={C.gold} accent2={C.blue}>
      <Card style={{ marginTop: 50, width: 790, transform: `scale(${0.85 + 0.15 * card})`, opacity: card, transformOrigin: "left top" }}>
        <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 28, color: C.goldD, letterSpacing: 1 }}>QUIZ D’ORIENTATION · QUESTION 1</div>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 40, margin: "8px 0 18px" }}>Tu es dans quelle voie en ce moment ?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {opts.map((t, k) => {
            const last = k === opts.length - 1;
            const on = last ? Math.min(1, tap) : 0;
            return (
              <div key={k} style={{ position: "relative", border: `3px solid ${on > 0.5 ? C.navy : "#E3E6EF"}`, background: on > 0.5 ? "#FFF4D1" : C.white, borderRadius: 18, padding: "13px 22px", fontFamily: BODY, fontWeight: last ? 700 : 600, fontSize: 32, transform: `scale(${1 + (last ? Math.sin(Math.min(1, tap) * Math.PI) * 0.05 : 0)})` }}>
                {t}{on > 0.5 ? " ✓" : ""}
                {last && frame >= tapAt - 12 && frame < tapAt + 18 ? (
                  <span style={{ position: "absolute", right: 40, top: 14, fontSize: 56, transform: `translateY(${interpolate(frame, [tapAt - 12, tapAt], [40, 0], { extrapolateRight: "clamp" })}px)` }}>👆</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
    </Scene>
  );
};

const Count: React.FC<{ to: number; at: number }> = ({ to, at }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>{Math.round(to * (1 - Math.pow(1 - k, 3)))}</>;
};

// 3. Ce que le site apporte
const S3: React.FC<{ v: RVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - (LEAD + 2), fps, config: { damping: 10 } });
  const items: [string, string, number][] = [
    ["🎯", "Vœux ambitieux, réalistes, plan B", 0.5],
    ["🏫", "Les écoles où candidater", 0.62],
    ["✍️", "Ta lettre de motivation", 0.74],
  ];
  const tile = useIn(LEAD + 4, 12);
  return (
    <Scene i={3} v={v} len={len} pose="cheer" accent={C.gold} accent2={C.pink}>
      <div style={{ marginTop: 28, transform: `scale(${logo})`, transformOrigin: "left center" }}><Logo size={64} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 24, background: "rgba(255,255,255,0.1)", border: `3px solid ${C.gold}`, borderRadius: 28, padding: "10px 30px", width: 620, transform: `translateX(${(1 - tile) * -700}px)` }}>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 84, color: C.gold }}><Count to={69} at={LEAD + 4} /></div>
        <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 46 }}>métiers expliqués</div>
      </div>
      <Card style={{ marginTop: 22, width: 850, padding: "22px 30px" }}>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 32, color: C.goldD, letterSpacing: 1 }}>TON PLAN PARCOURSUP PERSONNALISÉ</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          {items.map(([ic, t, at], k) => {
            const on = spring({ frame: frame - (LEAD + Math.round(len * at)), fps, config: { damping: 10, mass: 0.6 } });
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 16, opacity: 0.35 + 0.65 * Math.min(1, on) }}>
                <div style={{ width: 58, height: 58, borderRadius: 16, background: on > 0.5 ? C.green : "#E4E7EF", display: "grid", placeItems: "center", color: C.white, fontSize: 34, fontWeight: 800 }}>{on > 0.5 ? "✓" : ""}</div>
                <span style={{ fontSize: 44 }}>{ic}</span>
                <span style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 36, whiteSpace: "nowrap" }}>{t}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </Scene>
  );
};

// 4. Appel à l'action
const S4: React.FC<{ v: RVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const pill = useIn(LEAD + Math.round(len * 0.4), 11);
  const sub = useIn(LEAD + 4, 13);
  const pulse = 1 + Math.sin(frame / 5) * 0.03;
  return (
    <Scene i={4} v={v} len={len} pose="wave" accent={C.gold} accent2={C.blue}>
      <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 36, alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", opacity: sub, transform: `translateY(${(1 - sub) * 30}px)` }}>
          {["Quiz gratuit", "5 minutes", "Sans inscription"].map((t, k) => (
            <div key={k} style={{ background: [C.mint, C.white, C.pink][k], color: k === 2 ? C.white : C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 36, padding: "12px 26px", borderRadius: 999 }}>{t}</div>
          ))}
        </div>
        <div style={{ background: C.gold, color: C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 64, padding: "24px 46px", borderRadius: 999, transform: `scale(${pill * pulse})`, transformOrigin: "left center", boxShadow: "0 0 80px rgba(255,201,60,0.45)" }}>Lien en bio 👆</div>
        <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 46, opacity: pill }}>@trouvetavoie.com</div>
        <div style={{ fontSize: 36, color: "#D7DCEB", fontWeight: 600, opacity: pill }}>Choisis « je me réoriente » 🎯</div>
      </div>
    </Scene>
  );
};

export type ReoProps = { voice?: RVoice | null };

export const ReorientationVideo: React.FC<ReoProps> = ({ voice }) => {
  const { voice: v, lens, durs, starts, total } = reoTimeline(voice);
  const S = [S0, S1, S2, S3, S4];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tr: any[] = [wipe({ direction: "from-bottom" }), slide({ direction: "from-right" }), slide({ direction: "from-bottom" }), fade()];
  const at = (i: number, r: number) => starts[i] + LEAD + Math.round(lens[i] * r);
  const sfx: [string, number, number][] = [
    ["whoosh", 0, 0.3],
    ...[0, 1, 2, 3].map((k) => ["pop", starts[0] + LEAD + 2 + k * 5, 0.3] as [string, number, number]),
    ["boom", at(0, 0.7), 0.4],
    ...[1, 2, 3, 4].map((i) => ["whoosh", starts[i] - 2, 0.4] as [string, number, number]),
    ["ding", at(1, 0.35), 0.45], ["pop", at(1, 0.45), 0.45],
    ["pop", at(2, 0.42), 0.5], ["ding", at(2, 0.42) + 4, 0.4],
    ["ding", starts[3] + LEAD + 2, 0.5],
    ...[0.5, 0.62, 0.74].map((r) => ["pop", at(3, r), 0.35] as [string, number, number]),
    ["ding", at(4, 0.4), 0.5],
  ];
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Audio src={staticFile("audio/music.wav")} volume={(f) => (f > total - 45 ? 0.13 * Math.max(0, (total - f) / 45) : f < starts[1] ? 0.07 : 0.13)} />
      {v
        ? REORIENTATION.map((_, i) => (
            <Sequence key={i} from={starts[i] + LEAD} durationInFrames={lens[i] + 12} layout="none">
              <Audio src={staticFile(`voice-reorientation/scene${i}.wav`)} volume={1} />
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

/** Miniature TikTok de la vidéo Réorientation : 1080×1920 */
export const MiniReorientation: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #2A2F6E 0%, ${C.navy} 62%, #070B1C 100%)`, fontFamily: TITLE, color: C.white, alignItems: "center" }}>
    <div style={{ marginTop: 260, background: C.gold, color: C.navy, fontWeight: 800, fontSize: 46, padding: "14px 36px", borderRadius: 999, letterSpacing: 1.5 }}>RÉORIENTATION</div>
    <div style={{ marginTop: 60, fontSize: 120, fontWeight: 800, lineHeight: 1.02, textAlign: "center", padding: "0 60px", textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
      PAS À TA PLACE EN <span style={{ color: C.gold }}>1RE ANNÉE</span> ?
    </div>
    <div style={{ marginTop: 50, position: "relative", background: C.white, color: C.navy, borderRadius: 26, padding: "24px 40px", fontWeight: 800, fontSize: 52, transform: "rotate(-2deg)" }}>
      🎓 Licence 1
      <span style={{ position: "absolute", right: -60, top: -34, border: `6px solid ${C.pink}`, color: C.pink, borderRadius: 12, padding: "4px 14px", fontWeight: 800, fontSize: 34, background: "#fff", transform: "rotate(10deg)", whiteSpace: "nowrap" }}>PAS POUR MOI ?</span>
    </div>
    <div style={{ position: "absolute", left: 50, bottom: 360 }}><Mascot pose="think" size={460} lookX={0.6} /></div>
    <div style={{ position: "absolute", right: 170, bottom: 560, background: C.gold, color: C.navy, fontWeight: 800, fontSize: 44, padding: "18px 30px", borderRadius: 28, transform: "rotate(3deg)" }}>Tu peux te réorienter</div>
    <div style={{ position: "absolute", right: 170, bottom: 470 }}><Logo size={40} /></div>
  </AbsoluteFill>
);
