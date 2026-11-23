import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type Pose = "idle" | "wave" | "point" | "think" | "cheer" | "talk";

const SKIN = "#F5C6A0";
const SKIN_D = "#E3A982";
const HAIR = "#3A2418";
const HOODIE = "#FFC93C";
const HOODIE_D = "#E8AE1C";
const NAVY = "#0E1630";
const PANTS = "#2B3B6E";

type Props = {
  pose?: Pose;
  talking?: boolean;
  size?: number; // hauteur en px
  lookX?: number; // -1..1
  style?: React.CSSProperties;
  seed?: number;
};

/** Mascotte trouvetavoie : un lycéen en sweat jaune, logo boussole sur la poitrine. */
export const Mascot: React.FC<Props> = ({ pose = "idle", talking = false, size = 600, lookX = 0, style, seed = 0 }) => {
  const frame = useCurrentFrame() + seed * 17;
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // respiration + rebond
  const breathe = Math.sin(t * 2.4) * 4;
  const hop = pose === "cheer" ? -Math.abs(Math.sin(t * 7)) * 34 : 0;

  // clignement toutes les ~3,2 s
  const cyc = frame % 96;
  const blink = cyc > 90 ? interpolate(cyc, [90, 93, 96], [1, 0.08, 1]) : 1;

  // bouche qui parle
  const mouthOpen = talking ? 0.35 + 0.65 * Math.abs(Math.sin(t * 13) * Math.sin(t * 5.3 + 1)) : 0;

  // bras (angle en degrés, 0 = vers le bas)
  let armR = 12 + Math.sin(t * 2.4) * 2;
  let armL = -12 - Math.sin(t * 2.4) * 2;
  let handR = 0;
  if (pose === "wave") {
    armR = 150 + Math.sin(t * 12) * 18;
    handR = Math.sin(t * 12) * 10;
  }
  if (pose === "point") armR = 95 + Math.sin(t * 3) * 4;
  if (pose === "think") armL = -150;
  if (pose === "cheer") {
    armR = 155 + Math.sin(t * 14) * 10;
    armL = -155 - Math.sin(t * 14) * 10;
  }
  if (pose === "talk") {
    armR = 40 + Math.sin(t * 4) * 14;
    armL = -25 - Math.sin(t * 3.3 + 1) * 8;
  }

  const brow = pose === "cheer" || pose === "wave" ? -8 : pose === "think" ? -4 : 0;
  const px = lookX * 7 + (pose === "think" ? 6 : 0);
  const py = pose === "think" ? -6 : 0;

  const arm = (side: "L" | "R", angle: number, hand = 0) => {
    const sx = side === "R" ? 282 : 118;
    return (
      <g transform={`rotate(${side === "R" ? -angle : -angle} ${sx} 318)`}>
        <rect x={sx - 23} y={312} width={46} height={118} rx={23} fill={HOODIE} stroke={HOODIE_D} strokeWidth={3} />
        <rect x={sx - 24} y={410} width={48} height={16} rx={8} fill={HOODIE_D} />
        <g transform={`rotate(${hand} ${sx} 442)`}>
          <circle cx={sx} cy={444} r={24} fill={SKIN} />
          {pose === "point" && side === "R" ? (
            <rect x={sx - 7} y={448} width={14} height={34} rx={7} fill={SKIN} />
          ) : null}
        </g>
      </g>
    );
  };

  return (
    <div style={{ width: (size * 400) / 560, height: size, ...style }}>
      <svg viewBox="0 0 400 560" width="100%" height="100%" style={{ overflow: "visible" }}>
        {/* ombre */}
        <ellipse cx={200} cy={548} rx={110 - hop * 0.8} ry={12} fill="rgba(0,0,0,0.22)" />
        <g transform={`translate(0 ${hop})`}>
          {/* jambes */}
          <rect x={150} y={420} width={42} height={110} rx={18} fill={PANTS} />
          <rect x={208} y={420} width={42} height={110} rx={18} fill={PANTS} />
          {/* chaussures */}
          <path d="M140 522 h56 a14 14 0 0 1 0 26 h-62 a10 10 0 0 1 6 -26z" fill="#FFFFFF" />
          <path d="M204 522 h56 a10 10 0 0 1 6 26 h-62 a14 14 0 0 1 0 -26z" fill="#FFFFFF" />
          <rect x={134} y={541} width={64} height={7} rx={3} fill={NAVY} opacity={0.85} />
          <rect x={202} y={541} width={64} height={7} rx={3} fill={NAVY} opacity={0.85} />

          <g transform={`translate(0 ${breathe * 0.4})`}>
            {/* sac à dos (derrière) */}
            <rect x={96} y={300} width={208} height={140} rx={40} fill={NAVY} />
            {/* sweat */}
            <path d="M120 318 Q200 286 280 318 L292 440 Q200 462 108 440 Z" fill={HOODIE} />
            <path d="M108 430 Q200 452 292 430 L294 448 Q200 470 106 448 Z" fill={HOODIE_D} />
            {/* poche kangourou */}
            <path d="M152 392 h96 l12 40 h-120z" fill={HOODIE_D} opacity={0.55} />
            {/* bretelles */}
            <path d="M138 318 L150 420" stroke={NAVY} strokeWidth={14} strokeLinecap="round" />
            <path d="M262 318 L250 420" stroke={NAVY} strokeWidth={14} strokeLinecap="round" />
            {/* logo boussole */}
            <circle cx={200} cy={360} r={24} fill={NAVY} />
            <circle cx={200} cy={360} r={15} fill="none" stroke={HOODIE} strokeWidth={4} />
            <polygon points="207,353 203,363 193,367 197,357" fill={HOODIE} transform={`rotate(${Math.sin(t * 2) * 25} 200 360)`} />
            {/* cordons */}
            <path d="M184 312 v28" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
            <path d="M216 312 v28" stroke="#fff" strokeWidth={4} strokeLinecap="round" />

            {arm("L", armL)}
            {arm("R", armR, handR)}

            {/* tête */}
            <g transform={`rotate(${Math.sin(t * 1.7) * 3 + (pose === "think" ? 6 : 0)} 200 290)`}>
              <rect x={180} y={268} width={40} height={36} rx={12} fill={SKIN_D} />
              {/* capuche */}
              <path d="M112 300 Q200 340 288 300 Q290 326 200 336 Q110 326 112 300z" fill={HOODIE_D} />
              <circle cx={98} cy={190} r={22} fill={SKIN} />
              <circle cx={302} cy={190} r={22} fill={SKIN} />
              <circle cx={200} cy={180} r={104} fill={SKIN} />
              {/* cheveux */}
              <path
                d="M98 178 Q92 74 196 70 Q296 66 304 170 Q290 128 252 120 Q262 140 248 150 Q232 116 178 118 Q186 134 172 142 Q150 120 122 136 Q104 150 98 178z"
                fill={HAIR}
              />
              <path d="M196 70 Q220 40 250 52 Q226 58 222 74z" fill={HAIR} />
              {/* sourcils */}
              <g transform={`translate(0 ${brow})`}>
                <path d="M138 146 Q160 134 182 144" stroke={HAIR} strokeWidth={8} strokeLinecap="round" fill="none" />
                <path d="M218 144 Q240 134 262 146" stroke={HAIR} strokeWidth={8} strokeLinecap="round" fill="none" />
              </g>
              {/* yeux */}
              {[160, 240].map((ex) => (
                <g key={ex} transform={`translate(${ex} 188) scale(1 ${blink}) translate(${-ex} -188)`}>
                  <ellipse cx={ex} cy={188} rx={22} ry={26} fill="#fff" />
                  <circle cx={ex + px} cy={192 + py} r={13} fill={NAVY} />
                  <circle cx={ex + px + 5} cy={186 + py} r={4.5} fill="#fff" />
                </g>
              ))}
              {/* joues */}
              <ellipse cx={130} cy={226} rx={17} ry={10} fill="#F08A8A" opacity={0.45} />
              <ellipse cx={270} cy={226} rx={17} ry={10} fill="#F08A8A" opacity={0.45} />
              {/* bouche */}
              {mouthOpen > 0.05 ? (
                <g>
                  <ellipse cx={200} cy={240} rx={22} ry={6 + 16 * mouthOpen} fill="#7A1F2B" />
                  <ellipse cx={200} cy={246 + 10 * mouthOpen} rx={12} ry={4 + 4 * mouthOpen} fill="#E8667A" />
                </g>
              ) : pose === "think" ? (
                <path d="M184 242 Q204 236 218 244" stroke="#7A1F2B" strokeWidth={6} strokeLinecap="round" fill="none" />
              ) : (
                <path d="M172 230 Q200 262 228 230 Z" fill="#7A1F2B" />
              )}
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};
