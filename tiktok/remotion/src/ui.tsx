import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

export const C = {
  navy: "#0E1630",
  navy2: "#18224A",
  gold: "#FFC93C",
  goldD: "#8A6200",
  pink: "#E8436A",
  blue: "#2F5BEA",
  green: "#14804A",
  mint: "#3DDC97",
  white: "#FFFFFF",
  mute: "#AAB3CF",
  ink2: "#3E4766",
};

export const TITLE = "Poppins, sans-serif";
export const BODY = "Inter, sans-serif";

for (const [w, f] of [["600", "poppins-latin-600-normal.woff2"], ["700", "poppins-latin-700-normal.woff2"], ["800", "poppins-latin-800-normal.woff2"]]) {
  loadFont({ family: "Poppins", url: staticFile(`fonts/${f}`), weight: w });
}
for (const [w, f] of [["500", "Inter-Medium.otf"], ["600", "Inter-SemiBold.otf"], ["700", "Inter-Bold.otf"]]) {
  loadFont({ family: "Inter", url: staticFile(`fonts/${f}`), weight: w });
}

/** ressort 0→1 démarrant à `delay` images */
export const useIn = (delay = 0, damping = 14, mass = 0.8) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass } });
};

export const Emoji: React.FC<{ name: string; size: number; style?: React.CSSProperties }> = ({ name, size, style }) => (
  <Img src={staticFile(`emoji/${name}.svg`)} style={{ width: size, height: size, ...style }} />
);

/** Fond animé : dégradé navy + halos colorés qui dérivent + grille légère */
export const Background: React.FC<{ accent?: string; accent2?: string }> = ({ accent = C.gold, accent2 = C.blue }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const b1x = 200 + Math.sin(t * 0.6) * 160;
  const b1y = 420 + Math.cos(t * 0.5) * 140;
  const b2x = 880 + Math.cos(t * 0.45) * 160;
  const b2y = 1480 + Math.sin(t * 0.55) * 160;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.navy2} 0%, ${C.navy} 55%, #0A1026 100%)` }}>
      <div style={{ position: "absolute", left: b1x - 450, top: b1y - 450, width: 900, height: 900, borderRadius: "50%", background: accent, opacity: 0.2, filter: "blur(140px)" }} />
      <div style={{ position: "absolute", left: b2x - 450, top: b2y - 450, width: 900, height: 900, borderRadius: "50%", background: accent2, opacity: 0.28, filter: "blur(160px)" }} />
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 2px, transparent 2px)",
          backgroundSize: "54px 54px",
          backgroundPosition: `0px ${(frame * 0.6) % 54}px`,
          maskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Formes décoratives qui flottent */
export const Floaters: React.FC<{ color?: string }> = ({ color = C.gold }) => {
  const frame = useCurrentFrame();
  const items = [
    { x: 90, y: 300, s: 26, k: 0 },
    { x: 960, y: 420, s: 18, k: 1 },
    { x: 150, y: 1180, s: 14, k: 2 },
    { x: 930, y: 1050, s: 30, k: 3 },
    { x: 540, y: 220, s: 12, k: 4 },
  ];
  return (
    <AbsoluteFill>
      {items.map((it) => {
        const t = frame / 30 + it.k * 1.3;
        const ring = it.k % 2 === 0;
        return (
          <div
            key={it.k}
            style={{
              position: "absolute",
              left: it.x + Math.sin(t * 0.9) * 22,
              top: it.y + Math.cos(t * 0.7) * 26,
              width: it.s,
              height: it.s,
              borderRadius: it.k === 3 ? 8 : "50%",
              border: ring ? `4px solid ${color}` : undefined,
              background: ring ? undefined : color,
              opacity: 0.55,
              transform: `rotate(${t * 40}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Texte qui apparaît mot par mot (montée + fondu) */
export const Words: React.FC<{
  text: string;
  delay?: number;
  per?: number;
  style?: React.CSSProperties;
  highlight?: string[];
  hlColor?: string;
}> = ({ text, delay = 0, per = 3, style, highlight = [], hlColor = C.gold }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: "0.27em", ...style }}>
      {words.map((w, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: { damping: 16, mass: 0.6 } });
        const hl = highlight.some((h) => w.toLowerCase().includes(h.toLowerCase()));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 40}px)`,
              color: hl ? hlColor : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** En-tête de scène : pastille icône + étiquette */
export const SceneTag: React.FC<{ icon: string; label: string; color: string; delay?: number }> = ({ icon, label, color, delay = 0 }) => {
  const p = useIn(delay, 12);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 18,
        background: "rgba(255,255,255,0.08)",
        border: "2px solid rgba(255,255,255,0.14)",
        borderRadius: 999,
        padding: "14px 30px 14px 16px",
        transform: `scale(${0.6 + 0.4 * p}) translateX(${(1 - p) * -80}px)`,
        opacity: p,
        transformOrigin: "left center",
      }}
    >
      <div style={{ width: 70, height: 70, borderRadius: "50%", background: color, display: "grid", placeItems: "center" }}>
        <Emoji name={icon} size={42} />
      </div>
      <span style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 40, color: C.white, letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
};

/** Bulle de dialogue de la mascotte */
export const Bubble: React.FC<{ text: string; delay?: number; style?: React.CSSProperties; tail?: "left" | "bottom" }> = ({ text, delay = 0, style, tail = "left" }) => {
  const p = useIn(delay, 11);
  return (
    <div
      style={{
        position: "absolute",
        background: C.white,
        color: C.navy,
        fontFamily: TITLE,
        fontWeight: 700,
        fontSize: 38,
        lineHeight: 1.2,
        padding: "22px 30px",
        borderRadius: 32,
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        transform: `scale(${p})`,
        transformOrigin: tail === "left" ? "left bottom" : "center bottom",
        opacity: Math.min(1, p * 2),
        ...style,
      }}
    >
      {text}
      <div
        style={
          tail === "left"
            ? { position: "absolute", left: -18, bottom: 34, width: 0, height: 0, borderTop: "16px solid transparent", borderBottom: "16px solid transparent", borderRight: `24px solid ${C.white}` }
            : { position: "absolute", left: "50%", bottom: -22, marginLeft: -16, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: `24px solid ${C.white}` }
        }
      />
    </div>
  );
};

/** Logo trouvetavoie */
export const Logo: React.FC<{ size?: number; dark?: boolean }> = ({ size = 44, dark = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
    <div style={{ width: size * 1.25, height: size * 1.25, borderRadius: size * 0.34, background: dark ? C.navy : C.gold, display: "grid", placeItems: "center" }}>
      <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none" stroke={dark ? C.gold : C.navy} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polygon points="15.5,8.5 13.5,13.5 8.5,15.5 10.5,10.5" fill={dark ? C.gold : C.navy} />
      </svg>
    </div>
    <span style={{ fontFamily: TITLE, fontWeight: 700, fontSize: size, color: dark ? C.navy : C.white }}>
      trouve<span style={{ color: C.gold }}>tavoie</span>
    </span>
  </div>
);

/** Barre de progression des 5 étapes en haut de l'écran */
export const Progress: React.FC<{ starts: number[]; total: number }> = ({ starts, total }) => {
  const frame = useCurrentFrame();
  const segs = starts.map((s, i) => [s, starts[i + 1] ?? total]);
  return (
    <div style={{ position: "absolute", top: 150, left: 70, right: 70, display: "flex", gap: 12 }}>
      {segs.map(([a, b], i) => {
        const p = interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{ flex: 1, height: 10, borderRadius: 9, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
            <div style={{ width: `${p * 100}%`, height: "100%", background: C.gold, borderRadius: 9 }} />
          </div>
        );
      })}
    </div>
  );
};
