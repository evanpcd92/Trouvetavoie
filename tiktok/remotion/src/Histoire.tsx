// Vidéo « Mon histoire » : le parcours du fondateur, raconté par la mascotte.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Mascot, Pose } from "./Mascot";
import { Background, BODY, C, Emoji, Floaters, Logo, TITLE, useIn, Words } from "./ui";

import { HISTOIRE } from "./histoire-texte";
export { HISTOIRE };
// texte affiché à l'écran (le texte lu ci-dessus est écrit pour la voix)
const SOUS_TITRES = [
  "J’étais en terminale STMG… et Parcoursup ne m’a pas aidé.",
  "Je ne savais pas quoi faire. J’ai cherché partout.",
  "Alors j’ai mis des vœux au hasard…",
  "Je me suis retrouvé dans une école payante. Mon seul choix.",
  "Alors j’ai créé trouvetavoie : le guide que j’aurais aimé avoir.",
  "Choisis ta voie. Ne la subis pas.",
];

export type HVoice = { key: string; scenes?: { file: string; dur: number }[]; segs: Record<string, { dur: number; env: number[] }> };
const FPS = 30, T = 14, LEAD = 10;
const TAIL = [26, 22, 50, 40, 40, 70];

export function histoireTimeline(v?: HVoice | null) {
  const voice = v && v.key === "histoire" ? v : null;
  const lens = HISTOIRE.map((t, i) => Math.ceil(FPS * (voice?.segs[`h${i}`]?.dur ?? t.split(" ").length * 0.3)));
  const durs = lens.map((l, i) => LEAD + l + TAIL[i]);
  const starts: number[] = [];
  let acc = 0;
  durs.forEach((d, i) => { starts.push(acc); acc += d - (i < durs.length - 1 ? T : 0); });
  return { voice, lens, durs, starts, total: acc };
}

const mouth = (v: HVoice | null, i: number, f: number) => {
  const e = v?.segs[`h${i}`]?.env;
  const k = f - LEAD;
  if (!e) return k >= 0 && k < 60 ? 0.5 + 0.5 * Math.abs(Math.sin(k * 0.9)) : 0;
  return k >= 0 && k < e.length ? e[k] : 0;
};

/** squelette commun : fond, sous-titre en haut, mascotte en bas */
const Scene: React.FC<{ i: number; v: HVoice | null; len: number; pose: Pose; accent: string; accent2: string; children?: React.ReactNode; mascotRight?: boolean }> = ({ i, v, len, pose, accent, accent2, children, mascotRight }) => {
  const frame = useCurrentFrame();
  const words = SOUS_TITRES[i].split(" ").length;
  const m = useIn(2, 13);
  return (
    <AbsoluteFill>
      <Background accent={accent} accent2={accent2} />
      <Floaters color={accent} />
      <AbsoluteFill style={{ padding: "230px 70px 0", fontFamily: BODY, color: C.white }}>
        <Words text={SOUS_TITRES[i]} delay={LEAD} per={Math.max(2, (len * 0.8) / words)} style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 70, lineHeight: 1.15 }} highlight={["STMG", "Parcoursup", "hasard…", "payante.", "trouvetavoie", "voie."]} />
        {children}
      </AbsoluteFill>
      <div style={{ position: "absolute", [mascotRight ? "right" : "left"]: 60, top: 1640 - 520, transform: `translateY(${(1 - m) * 500}px)` }}>
        <Mascot pose={pose} mouth={mouth(v, i, frame)} size={520} lookX={mascotRight ? -0.6 : 0.6} seed={i} />
      </div>
    </AbsoluteFill>
  );
};

const Stamp: React.FC<{ at: number; text: string; rot?: number }> = ({ at, text, rot = -12 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 9, mass: 0.6 } });
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", right: 24, top: "50%", transform: `translateY(-50%) rotate(${rot}deg) scale(${2 - p})`, opacity: Math.min(1, p * 1.5), border: `6px solid ${C.pink}`, color: C.pink, borderRadius: 14, padding: "6px 18px", fontFamily: TITLE, fontWeight: 800, fontSize: 40, letterSpacing: 2, background: "rgba(255,255,255,0.92)" }}>
      {text}
    </div>
  );
};

const S0: React.FC<{ v: HVoice | null; len: number }> = ({ v, len }) => {
  const b = useIn(LEAD + 6, 9);
  return (
    <Scene i={0} v={v} len={len} pose="talk" accent={C.blue} accent2={C.pink}>
      <div style={{ marginTop: 70, display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ background: C.gold, color: C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 64, padding: "18px 40px", borderRadius: 26, transform: `scale(${b}) rotate(${(1 - b) * -20}deg)` }}>Bac STMG</div>
        <Emoji name="_book" size={110} style={{ transform: `scale(${b})` }} />
      </div>
    </Scene>
  );
};

const S1: React.FC<{ v: HVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const q = "quel métier est fait pour moi ?";
  const typed = q.slice(0, Math.max(0, Math.floor((frame - LEAD - 4) / 1.6)));
  const res = useIn(LEAD + 4 + q.length * 1.6 + 8, 14);
  return (
    <Scene i={1} v={v} len={len} pose="think" accent={C.blue} accent2={C.mint} mascotRight>
      <div style={{ marginTop: 60, background: C.white, color: C.navy, borderRadius: 999, padding: "26px 36px", fontSize: 40, fontWeight: 600, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
        <span style={{ fontSize: 44 }}>🔍</span>
        <span>{typed}<span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span></span>
      </div>
      <div style={{ marginTop: 26, fontSize: 38, fontWeight: 700, color: C.mute, opacity: res, transform: `translateY(${(1 - res) * 20}px)` }}>Aucune réponse claire…</div>
      {[0, 1, 2, 3].map((k) => (
        <div key={k} style={{ position: "absolute", left: 120 + k * 230, top: 900 + (k % 2) * 120, fontFamily: TITLE, fontWeight: 800, fontSize: 110, color: C.gold, opacity: 0.35, transform: `translateY(${Math.sin(frame / 12 + k) * 20}px) rotate(${Math.sin(frame / 20 + k) * 15}deg)` }}>?</div>
      ))}
    </Scene>
  );
};

const S2: React.FC<{ v: HVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const voeux = ["Vœu 1 · Une licence au hasard", "Vœu 2 · Un BTS au hasard", "Vœu 3 · Une école au hasard"];
  const stampAt = (k: number) => LEAD + Math.round(len * 0.55) + k * 9;
  return (
    <Scene i={2} v={v} len={len} pose="idle" accent={C.pink} accent2={C.blue}>
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 22 }}>
        {voeux.map((t, k) => {
          const p = spring({ frame: frame - (LEAD + 6 + k * 8), fps, config: { damping: 14 } });
          return (
            <div key={k} style={{ position: "relative", background: C.white, color: C.navy, borderRadius: 26, padding: "28px 30px", fontFamily: TITLE, fontWeight: 700, fontSize: 40, transform: `translateX(${(1 - p) * 900}px)`, boxShadow: "0 16px 40px rgba(0,0,0,0.25)" }}>
              {t}
              <Stamp at={stampAt(k)} text="REFUSÉ" rot={-10 + k * 6} />
            </div>
          );
        })}
      </div>
    </Scene>
  );
};

const S3: React.FC<{ v: HVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const card = useIn(LEAD + 4, 14);
  const stop = LEAD + Math.round(len * 0.82);
  return (
    <Scene i={3} v={v} len={len} pose="idle" accent={C.pink} accent2={C.navy2} mascotRight>
      <div style={{ marginTop: 60, position: "relative", background: C.white, color: C.navy, borderRadius: 32, padding: "34px 36px", transform: `scale(${0.8 + 0.2 * card})`, opacity: card, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 46 }}>École privée</div>
        <div style={{ fontSize: 34, color: C.ink2, marginTop: 6 }}>Payante · choisie par défaut</div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <Emoji key={k} name="_sal" size={70} style={{ transform: `translateY(${frame > LEAD + 20 + k * 6 ? Math.min(400, (frame - LEAD - 20 - k * 6) * 9) : 0}px)`, opacity: frame > LEAD + 20 + k * 6 ? Math.max(0, 1 - (frame - LEAD - 20 - k * 6) / 40) : 1 }} />
          ))}
        </div>
        <Stamp at={stop} text="J’AI ARRÊTÉ" rot={-8} />
      </div>
    </Scene>
  );
};

const S4: React.FC<{ v: HVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - (LEAD + 4), fps, config: { damping: 10 } });
  const flash = interpolate(frame, [LEAD + 4, LEAD + 7, LEAD + 16], [0, 0.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chips = ["69 métiers", "Tous les chemins", "Quiz gratuit"];
  return (
    <Scene i={4} v={v} len={len} pose="cheer" accent={C.gold} accent2={C.blue}>
      <div style={{ marginTop: 60, transform: `scale(${logo})` }}><Logo size={76} /></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 44 }}>
        {chips.map((t, k) => {
          const p = spring({ frame: frame - (LEAD + Math.round(len * 0.55) + k * 10), fps, config: { damping: 8, mass: 0.6 } });
          return <div key={k} style={{ background: [C.gold, C.mint, C.pink][k], color: C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 44, padding: "16px 30px", borderRadius: 999, transform: `scale(${p}) rotate(${[-3, 2, -2][k] * p}deg)` }}>{t}</div>;
        })}
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, margin: "-230px -70px 0" }} />
    </Scene>
  );
};

const S5: React.FC<{ v: HVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const pill = useIn(LEAD + Math.round(len * 0.45), 11);
  const pulse = 1 + Math.sin(frame / 5) * 0.03;
  return (
    <Scene i={5} v={v} len={len} pose="wave" accent={C.gold} accent2={C.pink} mascotRight>
      <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 26, alignItems: "flex-start" }}>
        <div style={{ background: C.gold, color: C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 52, padding: "20px 40px", borderRadius: 999, transform: `scale(${pill * pulse})` }}>Lien en bio 👆</div>
        <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 44, opacity: pill }}>@trouvetavoie.com</div>
        <div style={{ fontSize: 36, color: "#D7DCEB", opacity: pill }}>Quiz d’orientation gratuit</div>
      </div>
    </Scene>
  );
};

export type HistoireProps = { voice?: HVoice | null };

export const MonHistoire: React.FC<HistoireProps> = ({ voice }) => {
  const { voice: v, lens, durs, starts, total } = histoireTimeline(voice);
  const S = [S0, S1, S2, S3, S4, S5];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tr: any[] = [slide({ direction: "from-right" }), wipe({ direction: "from-bottom" }), slide({ direction: "from-bottom" }), fade(), slide({ direction: "from-right" })];
  const sfx: [string, number, number][] = [
    ["whoosh", 0, 0.3], ["pop", LEAD + 6, 0.5],
    ...[1, 2, 3, 4, 5].map((i) => ["whoosh", starts[i] - 2, 0.45] as [string, number, number]),
    ...[0, 1, 2].map((k) => ["boom", starts[2] + LEAD + Math.round(lens[2] * 0.55) + k * 9, 0.35] as [string, number, number]),
    ["boom", starts[3] + LEAD + Math.round(lens[3] * 0.82), 0.45],
    ["ding", starts[4] + LEAD + 4, 0.5],
    ...[0, 1, 2].map((k) => ["pop", starts[4] + LEAD + Math.round(lens[4] * 0.55) + k * 10, 0.45] as [string, number, number]),
    ["pop", starts[5] + LEAD + Math.round(lens[5] * 0.45), 0.5],
  ];
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Audio src={staticFile("audio/music.wav")} volume={(f) => (f > total - 45 ? 0.1 * Math.max(0, (total - f) / 45) : f < starts[4] ? 0.08 : 0.16)} />
      {v
        ? HISTOIRE.map((_, i) => (
            <Sequence key={i} from={starts[i] + LEAD} durationInFrames={lens[i] + 12} layout="none">
              <Audio src={staticFile(`voice-histoire/scene${i}.wav`)} volume={1} />
            </Sequence>
          ))
        : null}
      {sfx.map(([n, at, vol], i) => (
        <Sequence key={i} from={Math.max(0, at)} durationInFrames={40} layout="none">
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
