// Scènes de la vidéo « métier du jour », en motion design (même niveau que la vidéo de présentation).
// Contenu : accroche, but, quotidien, qualités, salaire, fin. Jamais le parcours d'études.
// Zones laissées libres pour TikTok : en haut (~170 px), en bas (légende, ~380 px) et à droite (boutons, ~150 px).
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MetierProps } from "./data";
import { Mascot, Pose } from "./Mascot";
import { mouthAt, SceneVoice } from "./timing";
import { Background, BODY, Bubble, C, Emoji, Logo, TITLE, useIn } from "./ui";
import { Burst, Chip, clamp, Confetti, ease, Phone, shake, Title } from "./fx";

type P = { m: MetierProps; v: SceneVoice };

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ");
const nameSize = (s: string) => (s.length <= 9 ? 150 : s.length <= 13 ? 124 : s.length <= 18 ? 104 : 88);
const endOf = (v: SceneVoice, i = v.cues.length - 1) => v.cues[i] + v.lens[i];
const BOTTOM = 1540; // au-dessous : légende TikTok

/** la mascotte qui parle avec la voix */
const Mascotte: React.FC<{ v: SceneVoice; pose: Pose; x?: number; size?: number; delay?: number; seed?: number; look?: number }> = ({ v, pose, x = 30, size = 400, delay = 4, seed = 0, look = 0.6 }) => {
  const frame = useCurrentFrame();
  const p = useIn(delay, 13);
  return (
    <div style={{ position: "absolute", left: x, top: BOTTOM - size, transform: `translateY(${(1 - p) * 520}px)` }}>
      <Mascot pose={pose} mouth={mouthAt(v, frame)} size={size} lookX={look} seed={seed} />
    </div>
  );
};

/** rayons qui tournent derrière un élément */
const Rays: React.FC<{ x: number; y: number; r: number; color?: string; on: number }> = ({ x, y, r, color = "rgba(255,201,60,0.18)", on }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: `repeating-conic-gradient(from 0deg, ${color} 0deg 9deg, transparent 9deg 22deg)`, opacity: on, transform: `rotate(${frame * 0.5}deg) scale(${0.6 + 0.4 * on})`, maskImage: "radial-gradient(circle, #000 0%, transparent 65%)" }} />
  );
};

/* ---------- 1. Accroche : carte mystère qui se retourne sur le métier ---------- */
export const Hook: React.FC<P> = ({ m, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = v.cues[1];
  const badge = spring({ frame: frame - 2, fps, config: { damping: 10, mass: 0.6 } });
  const card = spring({ frame: frame - 6, fps, config: { damping: 12 } });
  const flip = spring({ frame: frame - (reveal - 4), fps, config: { damping: 10, mass: 0.8 } });
  // avant la révélation, la carte « ? » tangue ; puis elle se retourne (180° → 0°)
  const wobble = frame < reveal - 4 ? Math.sin(frame / 4) * 10 : 0;
  const rot = 180 * (1 - flip) + wobble;
  const showFront = rot < 90;
  const letters = m.nom.split("");
  const per = Math.max(1, Math.min(2.2, 26 / letters.length));
  const cx = 540, cy = 720;
  const flash = interpolate(frame, [reveal, reveal + 3, reveal + 12], [0, 0.5, 0], clamp);
  const fs = nameSize(m.nom);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 38%, #24306A 0%, #0B1128 58%, #04060F 100%)" }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const r = random(`h${i}`);
        const y = ((r * 2000 - frame * (2 + r * 3)) % 2100 + 2100) % 2100 - 100;
        return <div key={i} style={{ position: "absolute", left: random(`hx${i}`) * 960, top: y, fontFamily: TITLE, fontWeight: 800, fontSize: 50 + r * 90, color: i % 2 ? C.gold : C.pink, opacity: frame < reveal ? 0.18 + r * 0.15 : 0.08, transform: `rotate(${(r - 0.5) * 50}deg)` }}>?</div>;
      })}
      <Rays x={cx} y={cy} r={760} on={interpolate(frame, [reveal, reveal + 18], [0, 1], clamp)} />
      <AbsoluteFill style={{ transform: shake(frame, [reveal], 26) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center", gap: 14 }}>
          <div style={{ background: C.gold, color: C.navy, fontFamily: TITLE, fontWeight: 800, fontSize: 40, padding: "14px 32px", borderRadius: 999, transform: `scale(${badge}) rotate(${(1 - badge) * -14}deg)`, letterSpacing: 1 }}>LE MÉTIER DU JOUR</div>
          <div style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.2)", color: C.white, fontFamily: TITLE, fontWeight: 700, fontSize: 36, padding: "14px 24px", borderRadius: 999, transform: `scale(${badge})` }}>N° {m.numero}/84</div>
        </div>
        <div style={{ position: "absolute", left: cx - 190, top: cy - 230, width: 380, height: 460, perspective: 1400 }}>
          <div style={{ width: "100%", height: "100%", transform: `scale(${card}) rotateY(${rot}deg)`, transformStyle: "preserve-3d", position: "relative" }}>
            {showFront ? (
              <div style={{ position: "absolute", inset: 0, borderRadius: 48, background: C.white, boxShadow: "0 40px 90px rgba(0,0,0,0.5)", display: "grid", placeItems: "center" }}>
                <Emoji name={m.key} size={250} style={{ transform: `rotate(${Math.sin(frame / 9) * 6}deg)` }} />
              </div>
            ) : (
              <div style={{ position: "absolute", inset: 0, borderRadius: 48, background: `linear-gradient(150deg, ${C.gold}, #F59E0B)`, boxShadow: "0 40px 90px rgba(0,0,0,0.5)", display: "grid", placeItems: "center", transform: "rotateY(180deg)", fontFamily: TITLE, fontWeight: 800, fontSize: 260, color: C.navy }}>?</div>
            )}
          </div>
        </div>
        <Burst at={reveal} x={cx} y={cy} n={18} len={360} />
        <Confetti at={reveal} x={cx} y={cy} n={56} spread={760} />
        <div style={{ position: "absolute", left: 60, right: 60, top: cy + 280, display: "flex", flexWrap: "wrap", justifyContent: "center", fontFamily: TITLE, fontWeight: 800, fontSize: fs, lineHeight: 1.02, color: C.white }}>
          {letters.map((ch, i) => {
            const a = reveal + 2 + i * per;
            const p = spring({ frame: frame - a, fps, config: { damping: 12, mass: 0.6 } });
            const ab = interpolate(frame, [a, a + 9], [12, 0], clamp);
            return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 120}px) scale(${1.8 - 0.8 * p})`, textShadow: `${ab}px 0 0 rgba(232,67,106,0.85), ${-ab}px 0 0 rgba(61,220,151,0.85), 0 14px 40px rgba(0,0,0,0.5)` }}>{ch}</span>;
          })}
        </div>
        <div style={{ position: "absolute", left: 540 - 160, top: cy + 300 + fs * (m.nom.length > 16 ? 2.1 : 1.1), width: 320, height: 14, borderRadius: 9, background: C.gold, transform: `scaleX(${interpolate(frame, [reveal + 10, reveal + 24], [0, 1], { ...clamp, easing: ease })})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <Mascotte v={v} pose={frame < reveal ? "talk" : "wave"} x={640} size={360} look={-0.6} delay={0} />
      <Bubble text="Tu connais ce métier ?" delay={endOf(v) + 4} tail="left" style={{ left: 140, top: 1360, fontSize: 36 }} />
    </AbsoluteFill>
  );
};

/* ---------- 2. Le but : une flèche touche la cible, le texte se lit comme un karaoké ---------- */
export const But: React.FC<P> = ({ m, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hit = v.cues[1] - 2;
  const rings = [150, 110, 70, 32];
  const draw = interpolate(frame, [v.cues[0] - 8, v.cues[0] + 10], [0, 1], { ...clamp, easing: ease });
  const fly = interpolate(frame, [hit - 12, hit], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const wob = frame >= hit ? Math.sin((frame - hit) * 1.6) * 10 * Math.exp(-(frame - hit) / 8) : 0;
  const words = m.but.split(" ");
  const k = interpolate(frame, [v.cues[1], v.cues[1] + v.lens[1] * 0.92], [0, words.length], clamp);
  const card = spring({ frame: frame - (v.cues[1] - 6), fps, config: { damping: 13 } });
  const tx = 760, ty = 520;
  const fs = m.but.length > 110 ? 54 : m.but.length > 70 ? 60 : 66;
  return (
    <AbsoluteFill>
      <Background accent={C.pink} accent2={C.blue} />
      <AbsoluteFill style={{ transform: shake(frame, [hit], 14) }}>
        <Title text="Son but" hl={["but"]} at={v.cues[0] - 6} size={96} top={220} />
        <svg width={340} height={340} style={{ position: "absolute", left: tx - 170, top: ty - 170, overflow: "visible" }}>
          {rings.map((r, i) => (
            <circle key={i} cx={170} cy={170} r={r * draw} fill={i % 2 ? C.white : C.pink} stroke={C.white} strokeWidth={4} opacity={0.95} />
          ))}
          <g transform={`translate(${170 + fly * 520}, ${170 - fly * 380}) rotate(${-36 + wob})`}>
            <rect x={0} y={-6} width={190} height={12} rx={6} fill={C.gold} />
            <polygon points="-26,0 6,-20 6,20" fill={C.navy} />
            <polygon points="168,-6 200,-30 214,-30 188,0 214,30 200,30 168,6" fill={C.mint} />
          </g>
        </svg>
        <Burst at={hit} x={tx} y={ty} color={C.gold} n={12} len={180} />
        <div style={{ position: "absolute", left: 70, right: 150, top: 760, background: C.white, borderRadius: 40, padding: "46px 46px", boxShadow: "0 30px 70px rgba(0,0,0,0.4)", transform: `translateY(${(1 - card) * 200}px) rotate(${(1 - card) * -4}deg)`, opacity: card }}>
          <div style={{ display: "flex", flexWrap: "wrap", columnGap: "0.26em", fontFamily: TITLE, fontWeight: 700, fontSize: fs, lineHeight: 1.22 }}>
            {words.map((w, i) => {
              const said = k - i;
              const on = Math.max(0, Math.min(1, said));
              const cur = said > 0 && said < 1.2;
              return (
                <span key={i} style={{ position: "relative", display: "inline-block", color: on > 0 ? C.navy : "#C5CAD8", transform: `translateY(${cur ? -4 : 0}px)` }}>
                  {cur ? <span style={{ position: "absolute", left: -6, right: -6, top: "12%", bottom: "4%", background: C.gold, borderRadius: 10, zIndex: -1, opacity: 0.9 }} /> : null}
                  <span style={{ position: "relative" }}>{w}</span>
                </span>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <Mascotte v={v} pose="point" x={30} size={330} seed={1} />
    </AbsoluteFill>
  );
};

/* ---------- 3. Le quotidien : la journée défile, les cartes se retournent une à une ---------- */
export const Quotidien: React.FC<P> = ({ m, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = m.quotidien.length;
  const long = m.quotidien.some((x) => x.length > 48);
  const fs = long ? 38 : 44;
  const day = interpolate(frame, [v.cues[0], endOf(v) + 10], [0, 1], clamp);
  const noteAt = endOf(v) + 6;
  const note = spring({ frame: frame - noteAt, fps, config: { damping: 13 } });
  const lineH = interpolate(frame, [v.cues[1] - 6, endOf(v)], [0, 1], clamp);
  const top = 500;
  const gap = n >= 4 ? 150 : 180;
  return (
    <AbsoluteFill>
      <Background accent={C.blue} accent2={C.mint} />
      <Title text="Au quotidien" hl={["quotidien"]} at={v.cues[0] - 6} size={92} top={220} />
      {/* la journée : le soleil glisse jusqu'à la lune */}
      <div style={{ position: "absolute", left: 70, top: 352, width: 780, height: 70 }}>
        <div style={{ position: "absolute", left: 40, right: 40, top: 33, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.18)" }} />
        <div style={{ position: "absolute", left: 40, top: 33, height: 6, borderRadius: 3, background: C.gold, width: 700 * day }} />
        <div style={{ position: "absolute", left: 40 + 700 * day - 32, top: 2, fontSize: 56, transform: `rotate(${day * 360}deg)` }}>{day < 0.85 ? "☀️" : "🌙"}</div>
      </div>
      <div style={{ position: "absolute", left: 118, top: top + 40, width: 6, height: (gap * (n - 1)) * lineH, background: C.gold, borderRadius: 3 }} />
      {m.quotidien.map((it, i) => {
        const at = v.cues[i + 1] - 4;
        const p = spring({ frame: frame - at, fps, config: { damping: 12, mass: 0.7 } });
        const speaking = frame >= v.cues[i + 1] && frame < v.cues[i + 1] + v.lens[i + 1];
        const done = frame >= v.cues[i + 1] + v.lens[i + 1];
        if (frame < at) return null;
        return (
          <div key={i} style={{ position: "absolute", left: 70, right: 150, top: top + i * gap, perspective: 1200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, background: C.white, color: C.navy, borderRadius: 30, padding: "22px 28px", transformOrigin: "50% 0%", transform: `rotateX(${(1 - p) * -95}deg) scale(${speaking ? 1.04 : 1})`, boxShadow: speaking ? `0 0 0 5px ${C.gold}, 0 22px 50px rgba(0,0,0,0.4)` : "0 18px 40px rgba(0,0,0,0.3)", opacity: Math.min(1, p * 2) }}>
              <div style={{ flex: "none", width: 64, height: 64, borderRadius: "50%", background: done ? C.green : C.gold, color: done ? C.white : C.navy, display: "grid", placeItems: "center", fontFamily: TITLE, fontWeight: 800, fontSize: 34 }}>{done ? "✓" : i + 1}</div>
              <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: fs, lineHeight: 1.16 }}>{it}</div>
            </div>
          </div>
        );
      })}
      {m.aSavoir ? (
        <div style={{ position: "absolute", left: 70, right: 150, top: top + n * gap + 10, display: "flex", gap: 16, alignItems: "flex-start", border: `3px dashed ${C.gold}`, borderRadius: 26, padding: "18px 22px", background: "rgba(14,22,48,0.75)", opacity: note, transform: `scale(${0.8 + 0.2 * note})`, transformOrigin: "left top", color: C.white }}>
          <Emoji name="_spark" size={46} />
          <div style={{ fontFamily: BODY, fontSize: 32, lineHeight: 1.3, fontWeight: 500 }}>
            <b style={{ color: C.gold }}>Bon à savoir : </b>
            {m.aSavoir}
          </div>
        </div>
      ) : null}
      {top + n * gap + (m.aSavoir ? 200 : 0) < BOTTOM - 330 ? <Mascotte v={v} pose="talk" x={640} size={300} seed={2} look={-0.6} /> : null}
    </AbsoluteFill>
  );
};

/* ---------- 4. Les qualités : des badges qui claquent ---------- */
export const Qualites: React.FC<P> = ({ m, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = [C.gold, C.mint, C.pink];
  const hits = m.qualites.map((_, i) => v.cues[i + 1] - 2);
  return (
    <AbsoluteFill>
      <Background accent={C.mint} accent2={C.pink} />
      <AbsoluteFill style={{ transform: shake(frame, hits, 12) }}>
        <Title text="Il te faut…" hl={["faut…"]} at={v.cues[0] - 6} size={96} top={220} />
        {m.qualites.map((q, i) => {
          const a = hits[i];
          const p = spring({ frame: frame - a, fps, config: { damping: 9, mass: 0.6 } });
          const spin = spring({ frame: frame - a, fps, config: { damping: 14 } });
          const y = 470 + i * 230;
          const x = 70 + [0, 70, 20][i];
          if (frame < a - 1) return null;
          const big = q.length > 22 ? 44 : 54;
          return (
            <React.Fragment key={i}>
              <Rays x={x + 90} y={y + 90} r={260} color={`${colors[i]}33`} on={interpolate(frame, [a, a + 10, a + 40], [0, 1, 0.35], clamp)} />
              <div style={{ position: "absolute", left: x, top: y, width: 180, height: 180, perspective: 900 }}>
                <div style={{ width: "100%", height: "100%", transform: `rotateY(${(1 - spin) * 360}deg) scale(${p})` }}>
                  <svg width={180} height={180} viewBox="0 0 100 100">
                    <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill={colors[i]} stroke={C.white} strokeWidth={4} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: TITLE, fontWeight: 800, fontSize: 92, color: C.navy }}>✓</div>
                </div>
              </div>
              <Burst at={a} x={x + 90} y={y + 90} color={colors[i]} n={12} len={170} />
              <div style={{ position: "absolute", left: x + 160, top: y + 46, maxWidth: 1080 - 150 - (x + 160), background: C.white, color: C.navy, borderRadius: 999, padding: "18px 34px 18px 44px", fontFamily: TITLE, fontWeight: 800, fontSize: big, lineHeight: 1.1, boxShadow: "0 18px 40px rgba(0,0,0,0.35)", transform: `translateX(${(1 - p) * -200}px) scaleX(${Math.min(1, p)})`, transformOrigin: "left center", zIndex: -1 }}>{q}</div>
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
      <Mascotte v={v} pose={frame < endOf(v) ? "talk" : "cheer"} x={640} size={320} seed={3} look={-0.6} />
      <Bubble text="Ça te ressemble ?" delay={endOf(v) + 4} tail="bottom" style={{ left: 380, top: 1100, fontSize: 36 }} />
    </AbsoluteFill>
  );
};

/* ---------- 5. Le salaire : compteur à rouleaux et pluie de billets ---------- */
const Digits: React.FC<{ value: number; at: number; dur: number; size: number }> = ({ value, at, dur, size }) => {
  const frame = useCurrentFrame();
  const chars = fmt(value).split("");
  let di = 0;
  return (
    <span style={{ display: "inline-flex", height: size * 1.08, overflow: "hidden", lineHeight: `${size * 1.08}px` }}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i} style={{ width: size * 0.22 }} />;
        const d = Number(ch);
        const turns = 1 + (di++ % 3);
        const p = interpolate(frame, [at, at + dur + i * 3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const pos = p * (turns * 10 + d);
        return (
          <span key={i} style={{ display: "inline-block", transform: `translateY(${-pos * size * 1.08}px)` }}>
            {Array.from({ length: turns * 10 + 10 }).map((_, k) => <div key={k}>{k % 10}</div>)}
          </span>
        );
      })}
    </span>
  );
};

export const SalaireScene: React.FC<P> = ({ m, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = m.salaire;
  const countStart = v.cues[1];
  const countLen = Math.min(48, Math.max(26, v.lens[1] - 16));
  const land = countStart + countLen + 8;
  const card = spring({ frame: frame - (v.cues[0] + 4), fps, config: { damping: 12 } });
  const punch = frame >= land ? 1 + 0.1 * Math.exp(-(frame - land) / 5) * Math.cos((frame - land) / 2) : 1;
  const detail = useIn(land + 8, 14);
  const size = s.high ? 108 : 140;
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.green} />
      <Rays x={540} y={760} r={820} on={interpolate(frame, [land - 4, land + 14], [0, 1], clamp)} />
      <AbsoluteFill style={{ transform: shake(frame, [land], 22) }}>
        <Title text="Le salaire" hl={["salaire"]} at={v.cues[0] - 6} size={96} top={220} />
        <div style={{ position: "absolute", left: 70, right: 150, top: 470, perspective: 1400 }}>
          <div style={{ background: C.white, color: C.navy, borderRadius: 44, padding: "40px 30px 46px", textAlign: "center", boxShadow: "0 40px 90px rgba(0,0,0,0.45)", transform: `rotateX(${(1 - card) * 80}deg) scale(${0.9 + 0.1 * card})`, transformOrigin: "50% 100%", opacity: Math.min(1, card * 2) }}>
            <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 38, color: C.ink2 }}>{s.label}</div>
            <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: size, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, transform: `scale(${punch})`, whiteSpace: "nowrap", marginTop: 4 }}>
              <Digits value={s.low} at={countStart} dur={countLen} size={size} />
              {s.high ? <span style={{ margin: "0 10px" }}>–</span> : null}
              {s.high ? <Digits value={s.high} at={countStart + 6} dur={countLen} size={size} /> : null}
              <span style={{ color: C.goldD }}>€</span>
            </div>
            <div style={{ display: "inline-block", marginTop: 14, background: C.gold, borderRadius: 999, padding: "10px 28px", fontFamily: TITLE, fontWeight: 700, fontSize: 38 }}>{s.unit || "par mois"}</div>
          </div>
        </div>
        <Burst at={land} x={540} y={640} n={20} len={420} />
        {s.detail ? (
          <div style={{ position: "absolute", left: 70, right: 150, top: 900, fontFamily: BODY, fontSize: 34, lineHeight: 1.35, fontWeight: 500, color: C.white, opacity: detail, transform: `translateY(${(1 - detail) * 40}px)`, background: "rgba(14,22,48,0.85)", border: "2px solid rgba(255,255,255,0.12)", borderRadius: 28, padding: "24px 30px" }}>
            {s.detail}
            {s.source ? <div style={{ marginTop: 10, fontSize: 26, color: C.mute }}>Source : {s.source}</div> : null}
          </div>
        ) : null}
      </AbsoluteFill>
      <Bills start={land} />
      <Mascotte v={v} pose={frame >= land ? "cheer" : "talk"} x={30} size={340} seed={4} />
      <Bubble text="Pas mal, non ?" delay={Math.max(endOf(v), land) + 6} tail="left" style={{ left: 300, top: 1280, fontSize: 36 }} />
    </AbsoluteFill>
  );
};

/** pluie de billets et de pièces */
const Bills: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const f = frame - start;
  if (f < 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const r = random(`b${i}`), r2 = random(`bb${i}`);
        const delay = Math.round(r2 * 24);
        if (f < delay) return null;
        const t = f - delay;
        const x = r * 980 + Math.sin(t / 8 + i) * 30;
        const y = -140 + t * (12 + r2 * 10);
        return <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: 64 + (i % 4) * 14, transform: `rotate(${t * (i % 2 ? 5 : -5)}deg)`, opacity: 0.85 }}>{i % 3 === 0 ? "🪙" : "💶"}</div>;
      })}
    </AbsoluteFill>
  );
};

/* ---------- 6. Fin : le site sur un téléphone 3D, appel à l'action ---------- */
export const Outro: React.FC<P> = ({ m, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phone = spring({ frame: frame - (v.cues[1] - 10), fps, config: { damping: 14, mass: 0.9 } });
  const btnAt = v.cues[1] + 6;
  const btn = spring({ frame: frame - btnAt, fps, config: { damping: 9, mass: 0.7 } });
  const pulse = 1 + Math.sin(frame / 5) * 0.035;
  const shine = (((frame - btnAt) % 45) + 45) % 45 / 45;
  const bell = useIn(v.cues[2], 10);
  const q = `Comment devenir ${m.nom.toLowerCase()} ?`;
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.blue} />
      <Confetti at={v.cues[2]} rain n={40} />
      <Title text={q} hl={m.nom.toLowerCase().split(" ").filter((w) => w.length > 2)} at={v.cues[0] - 4} size={m.nom.length > 16 ? 70 : 80} top={210} />
      <div style={{ position: "absolute", inset: 0, perspective: 1600 }}>
        <Phone src="accueil" width={380} scroll={interpolate(frame, [v.cues[1], v.cues[1] + 140], [0, 900], { ...clamp, easing: Easing.inOut(Easing.cubic) })} glare={interpolate(frame, [v.cues[1], v.cues[1] + 40], [0, 1], clamp)} style={{ left: 520 + (1 - phone) * 600, top: 520, transform: `rotateY(${-18 + (1 - phone) * -50 + Math.sin(frame / 22) * 3}deg) rotateX(5deg)` }} />
      </div>
      <div style={{ position: "absolute", left: 70, top: 560, transform: `scale(${useIn(v.cues[1] - 6, 11)})`, transformOrigin: "left center" }}><Logo size={46} /></div>
      <div style={{ position: "absolute", left: 70, top: 650, fontFamily: TITLE, fontWeight: 700, fontSize: 40, lineHeight: 1.2, color: "#D7DCEB", width: 430, opacity: useIn(v.cues[1], 12) }}>Toutes les étapes pour y arriver</div>
      <div style={{ position: "absolute", left: 70, top: 790, transform: `scale(${btn * pulse})`, transformOrigin: "left center", background: C.gold, color: C.navy, borderRadius: 999, padding: "24px 40px", fontFamily: TITLE, fontWeight: 800, fontSize: 52, boxShadow: "0 0 80px rgba(255,201,60,0.55)", overflow: "hidden", whiteSpace: "nowrap" }}>
        Lien en bio 👆
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${shine * 160 - 40}%, rgba(255,255,255,0.7) ${shine * 160 - 25}%, transparent ${shine * 160 - 10}%)` }} />
      </div>
      <Burst at={btnAt} x={250} y={850} n={14} len={240} />
      <Chip at={btnAt + 8} text="trouvetavoie.pages.dev" size={30} style={{ left: 70, top: 950 }} />
      <div style={{ position: "absolute", left: 70, top: 1050, display: "flex", alignItems: "center", gap: 14, background: C.pink, color: C.white, borderRadius: 999, padding: "14px 28px", fontFamily: TITLE, fontWeight: 800, fontSize: 36, transform: `scale(${bell})`, transformOrigin: "left center" }}>
        <span style={{ display: "inline-block", transform: `rotate(${Math.sin(frame / 2.5) * 18 * Math.exp(-Math.max(0, frame - v.cues[2]) / 30)}deg)`, transformOrigin: "50% 0%" }}>🔔</span>
        Abonne-toi
      </div>
      <Mascotte v={v} pose={frame < v.cues[2] ? "talk" : "wave"} x={60} size={330} seed={5} />
      <Bubble text="À demain !" delay={v.cues[2] + 8} tail="left" style={{ left: 330, top: 1300, fontSize: 36 }} />
    </AbsoluteFill>
  );
};
