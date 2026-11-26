// Briques de motion design partagées par les vidéos (présentation, métier du jour…).
import React from "react";
import { Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, TITLE } from "./ui";

const W = 1080, H = 1920;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** Téléphone réaliste avec une vraie capture du site, qui défile */
export const Phone: React.FC<{ src: string; scroll?: number; width?: number; style?: React.CSSProperties; children?: React.ReactNode; glare?: number }> = ({ src, scroll = 0, width = 440, style, children, glare = 0 }) => {
  const h = Math.round(width * 2.164);
  const scr = width - 28;
  const k = scr / 780;
  return (
    <div style={{ position: "absolute", width, height: h, borderRadius: width * 0.15, background: "linear-gradient(145deg,#2A2F45,#0B0E1A)", padding: 14, boxShadow: "0 60px 120px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.12)", ...style }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: width * 0.12, overflow: "hidden", background: "#F7F8FC" }}>
        <Img src={staticFile(`site/${src}.jpg`)} style={{ position: "absolute", left: 0, top: 0, width: scr, transform: `translateY(${-scroll * k}px)` }} />
        <div style={{ position: "absolute", left: "50%", top: 12, width: width * 0.3, height: 30, marginLeft: -width * 0.15, borderRadius: 20, background: "#0B0E1A" }} />
        {glare > 0 ? <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${glare * 140 - 40}%, rgba(255,255,255,0.45) ${glare * 140 - 25}%, transparent ${glare * 140 - 10}%)` }} /> : null}
        {children ? <div style={{ position: "absolute", left: 0, top: 0, width: scr, height: "100%", transformOrigin: "0 0" }}>{children}</div> : null}
      </div>
    </div>
  );
};

/** Rayons qui jaillissent (éclat) */
export const Burst: React.FC<{ at: number; x: number; y: number; color?: string; n?: number; len?: number }> = ({ at, x, y, color = C.gold, n = 14, len = 220 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: ease });
  if (frame < at || frame > at + 20) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * 360;
        return <div key={i} style={{ position: "absolute", left: 0, top: -5, width: len * (0.4 + 0.6 * p), height: 10, borderRadius: 6, background: color, transformOrigin: "0 50%", transform: `rotate(${a}deg) translateX(${len * 0.35 * p}px) scaleX(${1 - p})`, opacity: 1 - p * 0.6 }} />;
      })}
    </div>
  );
};

/** Confettis (déterministes) */
export const Confetti: React.FC<{ at: number; x?: number; y?: number; n?: number; spread?: number; rain?: boolean }> = ({ at, x = W / 2, y = H / 2, n = 60, spread = 900, rain = false }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const cols = [C.gold, C.pink, C.mint, C.blue, C.white];
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const r1 = random(`c${i}`), r2 = random(`d${i}`), r3 = random(`e${i}`);
        let px: number, py: number;
        if (rain) {
          px = r1 * W;
          py = -60 + ((t * (6 + r2 * 7) + r3 * H) % (H + 120));
        } else {
          const ang = r1 * Math.PI * 2, sp = (0.4 + r2) * spread / 30;
          px = x + Math.cos(ang) * sp * t;
          py = y + Math.sin(ang) * sp * t + 0.55 * t * t;
        }
        const op = rain ? 0.9 : interpolate(t, [0, 40, 60], [1, 1, 0], clamp);
        return <div key={i} style={{ position: "absolute", left: px, top: py, width: 14 + r3 * 12, height: 8 + r2 * 10, background: cols[i % cols.length], borderRadius: i % 3 === 0 ? "50%" : 3, transform: `rotate(${t * (8 + r1 * 14) + r3 * 360}deg)`, opacity: op }} />;
      })}
    </>
  );
};

/** Titre de scène en haut : mots qui claquent, un mot surligné */
export const Title: React.FC<{ text: string; hl?: string[]; at?: number; size?: number; color?: string; top?: number }> = ({ text, hl = [], at = 8, size = 84, color = C.white, top = 190 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div style={{ position: "absolute", left: 70, right: 160, top, display: "flex", flexWrap: "wrap", columnGap: "0.25em", fontFamily: TITLE, fontWeight: 800, fontSize: size, lineHeight: 1.05, color }}>
      {words.map((w, i) => {
        const p = spring({ frame: frame - at - i * 3, fps, config: { damping: 13, mass: 0.6 } });
        const on = hl.some((h) => w.toLowerCase().includes(h.toLowerCase()));
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 70}px) rotate(${(1 - p) * 8}deg)`, color: on ? C.navy : undefined, zIndex: 1 }}>
            {on ? <span style={{ position: "absolute", left: -10, right: -10, top: "8%", bottom: "2%", background: C.gold, borderRadius: 12, zIndex: -1, transform: `scaleX(${interpolate(frame, [at + i * 3 + 6, at + i * 3 + 16], [0, 1], clamp)})`, transformOrigin: "left center" }} /> : null}
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Pastille qui surgit */
export const Chip: React.FC<{ at: number; text: string; bg?: string; fg?: string; size?: number; style?: React.CSSProperties; from?: "left" | "right" | "pop" }> = ({ at, text, bg = C.white, fg = C.navy, size = 40, style, from = "pop" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 11, mass: 0.6 } });
  if (frame < at) return null;
  const tr = from === "pop" ? `scale(${p})` : `translateX(${(1 - p) * (from === "left" ? -700 : 700)}px) rotate(${(1 - p) * (from === "left" ? -12 : 12)}deg)`;
  return <div style={{ position: "absolute", background: bg, color: fg, fontFamily: TITLE, fontWeight: 800, fontSize: size, padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: 999, boxShadow: "0 18px 40px rgba(0,0,0,0.35)", whiteSpace: "nowrap", transform: tr, ...style }}>{text}</div>;
};

/** Compteur à rouleaux (machine à sous) */
export const Roller: React.FC<{ value: number; at: number; size: number; color?: string }> = ({ value, at, size, color = C.gold }) => {
  const frame = useCurrentFrame();
  const digits = String(value).split("").map(Number);
  return (
    <div style={{ display: "flex", height: size * 1.05, overflow: "hidden", fontFamily: TITLE, fontWeight: 800, fontSize: size, lineHeight: `${size * 1.05}px`, color }}>
      {digits.map((d, i) => {
        const turns = 2 + i;
        const p = interpolate(frame, [at, at + 28 + i * 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const pos = p * (turns * 10 + d);
        return (
          <div key={i} style={{ transform: `translateY(${-pos * size * 1.05}px)` }}>
            {Array.from({ length: turns * 10 + 10 }).map((_, k) => <div key={k}>{k % 10}</div>)}
          </div>
        );
      })}
    </div>
  );
};

/** Secousse de caméra qui s'amortit après chaque impact */
export const shake = (frame: number, hits: number[], amp = 22) => {
  let x = 0, y = 0;
  for (const h of hits) {
    const t = frame - h;
    if (t >= 0 && t < 14) {
      const d = amp * Math.exp(-t / 4);
      x += Math.sin(t * 2.7 + h) * d;
      y += Math.cos(t * 3.1 + h) * d;
    }
  }
  return `translate(${x}px, ${y}px)`;
};

