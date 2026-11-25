// Vidéo « Parents » : pub pour les groupes Facebook de parents d'élèves (1080×1350, format 4:5 du fil Facebook).
// Chiffres réels uniquement (compteurs du site, prix des offres). Pas de témoignage, pas de faux avis.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Mascot, Pose } from "./Mascot";
import { Background, BODY, C, Floaters, Logo, TITLE, useIn, Words } from "./ui";
import { PARENTS } from "./parents-texte";

export { PARENTS };
export const NB_METIERS = 69;
export const NB_CHEMINS = 207;

// texte affiché à l'écran (plus court que le texte lu)
const SOUS_TITRES = [
  "Parcoursup arrive… et votre enfant ne sait pas quoi faire après le bac ?",
  "Licence, BTS, BUT, écoles privées… c’est vite le brouillard.",
  "trouvetavoie l’aide à y voir clair.",
  "Son plan Parcoursup, prêt à suivre.",
  "9,99 €, une seule fois.",
  "Faites le quiz ensemble ce soir.",
];
const HL = ["Parcoursup", "bac", "brouillard.", "trouvetavoie", "clair.", "plan", "9,99", "fois.", "ensemble", "soir."];

export type PVoice = { key: string; scenes?: { file: string; dur: number }[]; segs: Record<string, { dur: number; env: number[] }> };
const FPS = 30, T = 14, LEAD = 10;
const TAIL = [30, 26, 34, 34, 40, 90];

export function parentsTimeline(v?: PVoice | null) {
  const voice = v && v.key === "parents" ? v : null;
  const lens = PARENTS.map((t, i) => Math.ceil(FPS * (voice?.segs[`p${i}`]?.dur ?? t.split(" ").length * 0.3)));
  const durs = lens.map((l, i) => LEAD + l + TAIL[i]);
  const starts: number[] = [];
  let acc = 0;
  durs.forEach((d, i) => { starts.push(acc); acc += d - (i < durs.length - 1 ? T : 0); });
  return { voice, lens, durs, starts, total: acc };
}

const mouth = (v: PVoice | null, i: number, f: number) => {
  const e = v?.segs[`p${i}`]?.env;
  const k = f - LEAD;
  if (!e) return k >= 0 && k < 60 ? 0.5 + 0.5 * Math.abs(Math.sin(k * 0.9)) : 0;
  return k >= 0 && k < e.length ? e[k] : 0;
};

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: C.white, color: C.navy, borderRadius: 30, padding: "26px 32px", boxShadow: "0 22px 60px rgba(0,0,0,0.35)", ...style }}>{children}</div>
);

/** squelette : bandeau « Parents », sous-titre, contenu, mascotte en bas à droite, logo en bas à gauche */
const Scene: React.FC<{ i: number; v: PVoice | null; len: number; pose: Pose; accent: string; accent2: string; children?: React.ReactNode; mascot?: number }> = ({ i, v, len, pose, accent, accent2, children, mascot = 470 }) => {
  const frame = useCurrentFrame();
  const words = SOUS_TITRES[i].split(" ").length;
  const m = useIn(2, 13);
  return (
    <AbsoluteFill>
      <Background accent={accent} accent2={accent2} />
      <Floaters color={accent} />
      <AbsoluteFill style={{ padding: "130px 64px 0", fontFamily: BODY, color: C.white }}>
        <Words text={SOUS_TITRES[i]} delay={LEAD} per={Math.max(2, (len * 0.6) / words)} style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 70, lineHeight: 1.12 }} highlight={HL} />
        {children}
      </AbsoluteFill>
      <div style={{ position: "absolute", right: 30, top: 1350 - mascot - 14, transform: `translateY(${(1 - m) * 450}px)` }}>
        <Mascot pose={pose} mouth={mouth(v, i, frame)} size={mascot} lookX={-0.6} seed={i} />
      </div>
      <div style={{ position: "absolute", left: 64, bottom: 54 }}><Logo size={38} /></div>
    </AbsoluteFill>
  );
};

// 0. Accroche : la date des vœux
const S0: React.FC<{ v: PVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tag = useIn(0, 12);
  const cal = spring({ frame: frame - (LEAD + Math.round(len * 0.35)), fps, config: { damping: 11 } });
  return (
    <Scene i={0} v={v} len={len} pose="think" accent={C.pink} accent2={C.blue}>
      <div style={{ position: "absolute", left: 64, top: 50, transform: `scale(${tag})`, transformOrigin: "left center", background: C.gold, color: C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 32, letterSpacing: 2, padding: "8px 26px", borderRadius: 999 }}>PARENTS DE LYCÉENS</div>
      <Card style={{ marginTop: 60, width: 640, transform: `scale(${cal}) rotate(${(1 - cal) * -12 - 2}deg)`, transformOrigin: "left top", padding: 0, overflow: "hidden" }}>
        <div style={{ background: C.pink, color: C.white, fontFamily: TITLE, fontWeight: 800, fontSize: 38, padding: "16px 34px" }}>📅 Vœux Parcoursup 2027</div>
        <div style={{ padding: "22px 30px", fontFamily: TITLE }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: C.ink2 }}>du</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1 }}>18 janvier</div>
          <div style={{ fontSize: 30, fontWeight: 600, color: C.ink2, marginTop: 6 }}>au</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1, color: C.pink }}>11 mars</div>
        </div>
      </Card>
    </Scene>
  );
};

// 1. Le brouillard : les questions qui tournent
const S1: React.FC<{ v: PVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const qs = ["Licence ?", "BTS ?", "BUT ?", "École privée ?", "Combien ça coûte ?", "Quelles chances ?", "Quel métier ?"];
  const pos = [[0, 30], [400, 0], [690, 110], [0, 190], [380, 270], [0, 400], [20, 560]];
  const fog = interpolate(frame, [LEAD + len * 0.65, LEAD + len * 0.95], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene i={1} v={v} len={len} pose="think" accent={C.blue} accent2={C.pink}>
      <div style={{ position: "relative", marginTop: 50, height: 700 }}>
        {qs.map((q, k) => {
          const p = spring({ frame: frame - (LEAD + 4 + k * 6), fps, config: { damping: 9, mass: 0.6 } });
          const dx = Math.sin(frame / 14 + k) * 14, dy = Math.cos(frame / 17 + k * 2) * 12;
          return (
            <div key={k} style={{ position: "absolute", left: pos[k][0], top: pos[k][1], transform: `translate(${dx}px, ${dy}px) scale(${p}) rotate(${Math.sin(k * 3) * 6}deg)`, background: k % 3 === 0 ? C.gold : k % 3 === 1 ? C.white : C.pink, color: k % 3 === 2 ? C.white : C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 52, padding: "18px 34px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: "0 14px 40px rgba(0,0,0,0.3)", filter: `blur(${fog * 9}px)` }}>{q}</div>
          );
        })}
      </div>
      <AbsoluteFill style={{ background: "#AAB3CF", opacity: fog * 0.35, mixBlendMode: "screen" }} />
    </Scene>
  );
};

const Count: React.FC<{ to: number; at: number }> = ({ to, at }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>{Math.round(to * (1 - Math.pow(1 - k, 3)))}</>;
};

// 2. La solution : logo + 3 compteurs réels
const S2: React.FC<{ v: PVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - (LEAD + 2), fps, config: { damping: 10 } });
  const flash = interpolate(frame, [LEAD + 2, LEAD + 5, LEAD + 14], [0, 0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tiles: [React.ReactNode, string, string, number][] = [
    ["0 €", "le quiz d’orientation", C.mint, 0.2],
    [<Count key="m" to={NB_METIERS} at={LEAD + Math.round(len * 0.4)} />, "métiers expliqués", C.gold, 0.4],
    [<Count key="c" to={NB_CHEMINS} at={LEAD + Math.round(len * 0.78)} />, "chemins détaillés", C.pink, 0.78],
  ];
  return (
    <Scene i={2} v={v} len={len} pose="cheer" accent={C.gold} accent2={C.blue} mascot={420}>
      <div style={{ marginTop: 40, transform: `scale(${logo})`, transformOrigin: "left center" }}><Logo size={84} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 50, width: 760 }}>
        {tiles.map(([n, l, col, at], k) => {
          const p = spring({ frame: frame - (LEAD + Math.round(len * at)), fps, config: { damping: 13 } });
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 24, background: "rgba(255,255,255,0.1)", border: `3px solid ${col}`, borderRadius: 28, padding: "22px 32px", transform: `translateX(${(1 - p) * -700}px)` }}>
              <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 88, color: col, minWidth: 190 }}>{n}</div>
              <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 44 }}>{l}</div>
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, margin: "-70px -64px 0" }} />
    </Scene>
  );
};

// 3. Le plan Parcoursup personnalisé : la liste se coche au fil de la voix
const S3: React.FC<{ v: PVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = useIn(LEAD + 2, 14);
  const items: [string, string, number][] = [
    ["🎯", "Vœux ambitieux, réalistes, plan B", 0.36],
    ["🏫", "Les écoles où candidater", 0.6],
    ["📅", "Les dates à ne pas rater", 0.76],
    ["✍️", "5 lettres de motivation", 0.9],
  ];
  return (
    <Scene i={3} v={v} len={len} pose="point" accent={C.mint} accent2={C.blue} mascot={400}>
      <Card style={{ marginTop: 50, width: 952, transform: `scale(${0.85 + 0.15 * card})`, opacity: card, transformOrigin: "left top" }}>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 36, color: C.goldD, letterSpacing: 1 }}>PLAN PARCOURSUP · OFFRE COMPLET</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 26 }}>
          {items.map(([ic, t, at], k) => {
            const on = spring({ frame: frame - (LEAD + Math.round(len * at)), fps, config: { damping: 10, mass: 0.6 } });
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 18, opacity: 0.35 + 0.65 * Math.min(1, on) }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: on > 0.5 ? C.green : "#E4E7EF", display: "grid", placeItems: "center", color: C.white, fontSize: 34, fontWeight: 800, transform: `scale(${0.7 + 0.3 * on})` }}>{on > 0.5 ? "✓" : ""}</div>
                <span style={{ fontSize: 48 }}>{ic}</span>
                <span style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 42 }}>{t}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </Scene>
  );
};

// 4. Le prix
const S4: React.FC<{ v: PVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const price = spring({ frame: frame - (LEAD + 2), fps, config: { damping: 8, mass: 0.7 } });
  const ticks = ["Sans abonnement", "Sans publicité", "Sans compte à créer"];
  return (
    <Scene i={4} v={v} len={len} pose="cheer" accent={C.gold} accent2={C.pink}>
      <Card style={{ marginTop: 44, display: "inline-block", alignSelf: "flex-start", width: 680, textAlign: "center", padding: "36px 32px", transform: `scale(${price}) rotate(-3deg)` }}>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 170, lineHeight: 1 }}>9,99 €</div>
        <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 44, color: C.goldD, marginTop: 6 }}>paiement unique</div>
        <div style={{ fontSize: 32, color: C.ink2, marginTop: 8 }}>Offre Essentiel dès 4,99 €</div>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 50 }}>
        {ticks.map((t, k) => {
          const p = spring({ frame: frame - (LEAD + Math.round(len * (0.42 + k * 0.17))), fps, config: { damping: 12 } });
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: TITLE, fontWeight: 700, fontSize: 48, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
              <span style={{ width: 58, height: 58, borderRadius: "50%", background: C.mint, color: C.navy, display: "grid", placeItems: "center", fontSize: 30, fontWeight: 800 }}>✓</span>{t}
            </div>
          );
        })}
      </div>
    </Scene>
  );
};

// 5. Appel à l'action
const S5: React.FC<{ v: PVoice | null; len: number }> = ({ v, len }) => {
  const frame = useCurrentFrame();
  const pill = useIn(LEAD + Math.round(len * 0.5), 11);
  const sub = useIn(LEAD + 8, 13);
  const pulse = 1 + Math.sin(frame / 5) * 0.03;
  return (
    <Scene i={5} v={v} len={len} pose="wave" accent={C.gold} accent2={C.blue}>
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 40, alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 14, opacity: sub, transform: `translateY(${(1 - sub) * 30}px)` }}>
          {["Quiz gratuit", "5 minutes", "Sans inscription"].map((t, k) => (
            <div key={k} style={{ background: [C.mint, C.white, C.pink][k], color: k === 2 ? C.white : C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 36, padding: "12px 26px", borderRadius: 999 }}>{t}</div>
          ))}
        </div>
        <div style={{ background: C.gold, color: C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 60, padding: "26px 40px", borderRadius: 32, transform: `scale(${pill * pulse})`, transformOrigin: "left center", boxShadow: "0 0 80px rgba(255,201,60,0.45)" }}>trouvetavoie.pages.dev</div>
        <div style={{ fontSize: 42, color: "#D7DCEB", fontWeight: 700, opacity: pill, maxWidth: 560 }}>Rubrique « Parents » en bas du site 👪</div>
      </div>
    </Scene>
  );
};

export type ParentsProps = { voice?: PVoice | null };

export const ParentsVideo: React.FC<ParentsProps> = ({ voice }) => {
  const { voice: v, lens, durs, starts, total } = parentsTimeline(voice);
  const S = [S0, S1, S2, S3, S4, S5];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tr: any[] = [slide({ direction: "from-right" }), wipe({ direction: "from-bottom" }), slide({ direction: "from-bottom" }), slide({ direction: "from-right" }), fade()];
  const at = (i: number, r: number) => starts[i] + LEAD + Math.round(lens[i] * r);
  const sfx: [string, number, number][] = [
    ["whoosh", 0, 0.3], ["pop", 2, 0.4], ["boom", at(0, 0.35), 0.35],
    ...[1, 2, 3, 4, 5].map((i) => ["whoosh", starts[i] - 2, 0.4] as [string, number, number]),
    ...[0, 1, 2, 3, 4, 5, 6].map((k) => ["pop", starts[1] + LEAD + 4 + k * 6, 0.3] as [string, number, number]),
    ["ding", starts[2] + LEAD + 2, 0.5], ["pop", at(2, 0.2), 0.4], ["pop", at(2, 0.4), 0.4], ["pop", at(2, 0.78), 0.4],
    ...[0.36, 0.6, 0.76, 0.9].map((r) => ["ding", at(3, r), 0.3] as [string, number, number]),
    ["cash", starts[4] + LEAD + 2, 0.5],
    ...[0, 1, 2].map((k) => ["pop", at(4, 0.42 + k * 0.17), 0.4] as [string, number, number]),
    ["ding", at(5, 0.5), 0.5],
  ];
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Audio src={staticFile("audio/music.wav")} volume={(f) => (f > total - 45 ? 0.12 * Math.max(0, (total - f) / 45) : f < starts[2] ? 0.07 : 0.13)} />
      {v
        ? PARENTS.map((_, i) => (
            <Sequence key={i} from={starts[i] + LEAD} durationInFrames={lens[i] + 12} layout="none">
              <Audio src={staticFile(`voice-parents/scene${i}.wav`)} volume={1} />
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

/** Miniature (image de couverture) de la vidéo Parents : 1080×1350 */
export const MiniParents: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #24306A 0%, ${C.navy} 62%, #070B1C 100%)`, fontFamily: TITLE, color: C.white, padding: "90px 70px" }}>
    <div style={{ alignSelf: "flex-start", background: C.gold, color: C.navy, fontWeight: 800, fontSize: 36, padding: "10px 30px", borderRadius: 999, letterSpacing: 1.5 }}>PARENTS DE LYCÉENS</div>
    <div style={{ marginTop: 44, fontSize: 92, fontWeight: 800, lineHeight: 1.04 }}>
      Votre enfant ne sait pas quoi faire <span style={{ color: C.gold }}>après le bac</span> ?
    </div>
    <div style={{ marginTop: 34, fontSize: 44, fontWeight: 700, color: "#D7DCEB", maxWidth: 620 }}>Quiz d’orientation gratuit + plan Parcoursup 2027</div>
    <div style={{ position: "absolute", right: 30, bottom: -10 }}><Mascot pose="point" size={440} lookX={-0.6} /></div>
    <div style={{ position: "absolute", left: 70, bottom: 70 }}><Logo size={44} /></div>
  </AbsoluteFill>
);
