import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MetierProps } from "./data";
import { Mascot } from "./Mascot";
import { Background, BODY, Bubble, C, Emoji, Floaters, Logo, SceneTag, TITLE, useIn, Words } from "./ui";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ");

const nameSize = (s: string) => (s.length <= 9 ? 160 : s.length <= 13 ? 132 : s.length <= 18 ? 112 : 96);

const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ padding: "230px 70px 0 70px", fontFamily: BODY, color: C.white }}>{children}</AbsoluteFill>
);

const MascotSlot: React.FC<{ pose: React.ComponentProps<typeof Mascot>["pose"]; talking?: boolean; bubble: string; size?: number; delay?: number; seed?: number }> = ({
  pose,
  talking,
  bubble,
  size = 560,
  delay = 8,
  seed,
}) => {
  const p = useIn(delay, 13);
  const w = (size * 400) / 560;
  return (
    <>
      <div style={{ position: "absolute", left: 40, top: 1640 - size, transform: `translateY(${(1 - p) * 500}px)` }}>
        <Mascot pose={pose} talking={talking} size={size} seed={seed} lookX={0.6} />
      </div>
      <Bubble text={bubble} delay={delay + 14} style={{ left: 40 + w + 20, top: 1640 - size + 40, maxWidth: 480 }} />
    </>
  );
};

/* ---------- 1. Accroche ---------- */
export const Hook: React.FC<{ m: MetierProps }> = ({ m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badge = useIn(2, 12);
  const icon = spring({ frame: frame - 10, fps, config: { damping: 9, mass: 0.7 } });
  const name = spring({ frame: frame - 22, fps, config: { damping: 12 } });
  const mascot = useIn(40, 13);
  const zoom = interpolate(frame, [0, 150], [1.08, 1]);
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.pink} />
      <Floaters />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, alignItems: "center", paddingTop: 250, fontFamily: TITLE, color: C.white }}>
        <div
          style={{
            background: C.gold,
            color: C.navy,
            fontWeight: 800,
            fontSize: 40,
            padding: "14px 34px",
            borderRadius: 999,
            transform: `scale(${badge}) rotate(${(1 - badge) * -12}deg)`,
            letterSpacing: 1,
          }}
        >
          LE MÉTIER DU JOUR
        </div>
        <div style={{ position: "relative", marginTop: 60, width: 330, height: 330, display: "grid", placeItems: "center" }}>
          <svg width={330} height={330} style={{ position: "absolute", transform: `rotate(${frame * 1.2}deg)`, opacity: icon }}>
            <circle cx={165} cy={165} r={156} fill="none" stroke={C.gold} strokeWidth={6} strokeDasharray="18 22" strokeLinecap="round" />
          </svg>
          <div
            style={{
              width: 270,
              height: 270,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "3px solid rgba(255,255,255,0.18)",
              display: "grid",
              placeItems: "center",
              transform: `scale(${icon})`,
            }}
          >
            <Emoji name={m.key} size={170} style={{ transform: `rotate(${Math.sin(frame / 9) * 6}deg)` }} />
          </div>
        </div>
        <div
          style={{
            marginTop: 50,
            fontWeight: 800,
            fontSize: nameSize(m.nom),
            lineHeight: 1.02,
            textAlign: "center",
            padding: "0 50px",
            transform: `scale(${0.4 + 0.6 * name}) translateY(${(1 - name) * 80}px)`,
            opacity: name,
            textShadow: "0 12px 40px rgba(0,0,0,0.35)",
          }}
        >
          {m.nom}
        </div>
        <div style={{ marginTop: 26, height: 14, width: 260 * name, background: C.gold, borderRadius: 9 }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", right: 90, top: 1640 - 520, transform: `translateX(${(1 - mascot) * 600}px)` }}>
        <Mascot pose="wave" size={520} lookX={-0.6} talking={frame > 55 && frame < 100} />
      </div>
      <Bubble text="Tu connais ce métier ?" delay={52} tail="bottom" style={{ left: 120, top: 1300 }} />
    </AbsoluteFill>
  );
};

/* ---------- 2. Le but ---------- */
export const But: React.FC<{ m: MetierProps }> = ({ m }) => {
  const card = useIn(6, 15);
  return (
    <AbsoluteFill>
      <Background accent={C.pink} accent2={C.blue} />
      <Floaters color={C.pink} />
      <Page>
        <SceneTag icon="_but" label="Son but" color={C.pink} />
        <div
          style={{
            marginTop: 50,
            background: "rgba(255,255,255,0.07)",
            border: "2px solid rgba(255,255,255,0.13)",
            borderRadius: 44,
            padding: "56px 54px",
            transform: `translateY(${(1 - card) * 120}px)`,
            opacity: card,
          }}
        >
          <Words
            text={m.but}
            delay={14}
            per={3}
            style={{ fontFamily: TITLE, fontWeight: 700, fontSize: m.but.length > 110 ? 58 : 66, lineHeight: 1.22 }}
          />
        </div>
      </Page>
      <MascotSlot pose="point" talking bubble="Un métier qui a du sens !" delay={30} seed={1} />
    </AbsoluteFill>
  );
};

/* ---------- 3. Le quotidien ---------- */
export const Quotidien: React.FC<{ m: MetierProps; per: number }> = ({ m, per }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = m.quotidien.length;
  const long = m.quotidien.some((x) => x.length > 48);
  const fs = long ? 40 : 46;
  const noteAt = 14 + n * per + 10;
  const note = spring({ frame: frame - noteAt, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      <Background accent={C.blue} accent2={C.mint} />
      <Floaters color={C.mint} />
      <Page>
        <SceneTag icon="_jour" label="Au quotidien" color={C.blue} />
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 22 }}>
          {m.quotidien.map((it, i) => {
            const p = spring({ frame: frame - 14 - i * per, fps, config: { damping: 14, mass: 0.7 } });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  background: C.white,
                  color: C.navy,
                  borderRadius: 30,
                  padding: "26px 32px",
                  transform: `translateX(${(1 - p) * 900}px) rotate(${(1 - p) * 4}deg)`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
                  marginRight: 60,
                }}
              >
                <div
                  style={{
                    flex: "none",
                    width: 66,
                    height: 66,
                    borderRadius: 20,
                    background: C.gold,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: TITLE,
                    fontWeight: 800,
                    fontSize: 36,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: fs, lineHeight: 1.18 }}>{it}</div>
              </div>
            );
          })}
        </div>
        {m.aSavoir ? (
          <div
            style={{
              marginTop: 30,
              marginRight: 60,
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
              border: `3px dashed ${C.gold}`,
              borderRadius: 28,
              padding: "22px 26px",
              opacity: note,
              transform: `scale(${0.85 + 0.15 * note})`,
            }}
          >
            <Emoji name="_spark" size={50} />
            <div style={{ fontSize: 34, lineHeight: 1.3, fontWeight: 500 }}>
              <b style={{ color: C.gold }}>Bon à savoir : </b>
              {m.aSavoir}
            </div>
          </div>
        ) : null}
      </Page>
      {m.aSavoir && m.aSavoir.length > 90 && n >= 4 ? null : <MascotSlot pose="think" bubble="Ça te tente ?" delay={noteAt + 6} size={500} seed={2} />}
    </AbsoluteFill>
  );
};

/* ---------- 4. Les qualités ---------- */
export const Qualites: React.FC<{ m: MetierProps }> = ({ m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = [C.gold, C.mint, C.pink];
  return (
    <AbsoluteFill>
      <Background accent={C.mint} accent2={C.pink} />
      <Floaters color={C.gold} />
      <Page>
        <SceneTag icon="_qual" label="Les qualités clés" color={C.green} />
        <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 34, alignItems: "flex-start" }}>
          {m.qualites.map((q, i) => {
            const p = spring({ frame: frame - 14 - i * 16, fps, config: { damping: 8, mass: 0.6 } });
            const rot = [-3, 2.5, -1.5][i];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  background: colors[i],
                  color: C.navy,
                  borderRadius: 999,
                  padding: "26px 44px 26px 26px",
                  fontFamily: TITLE,
                  fontWeight: 800,
                  fontSize: q.length > 22 ? 50 : 60,
                  transform: `scale(${p}) rotate(${rot * p}deg)`,
                  marginLeft: [0, 90, 30][i],
                  boxShadow: "0 18px 40px rgba(0,0,0,0.3)",
                }}
              >
                <Emoji name="_check" size={64} />
                {q}
              </div>
            );
          })}
        </div>
      </Page>
      <MascotSlot pose="cheer" bubble="Ça te ressemble ?" delay={60} seed={3} />
    </AbsoluteFill>
  );
};

/* ---------- 5. Le salaire ---------- */
export const SalaireScene: React.FC<{ m: MetierProps; countStart: number; countLen: number }> = ({ m, countStart, countLen }) => {
  const frame = useCurrentFrame();
  const s = m.salaire;
  const k = interpolate(frame, [countStart, countStart + countLen], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3) });
  const done = frame - (countStart + countLen);
  const punch = done >= 0 ? 1 + 0.12 * Math.exp(-done / 5) * Math.cos(done / 2) : 1;
  const card = useIn(8, 14);
  const detail = useIn(countStart + countLen + 8, 14);
  const big = s.high ? `${fmt(s.low * k)} – ${fmt(s.high * k)} €` : `${fmt(s.low * k)} €`;
  const bigSize = s.high ? 112 : 150;
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.green} />
      <Coins start={countStart + countLen} />
      <Page>
        <SceneTag icon="_sal" label="Le salaire" color={C.goldD} />
        <div
          style={{
            marginTop: 56,
            background: C.white,
            color: C.navy,
            borderRadius: 48,
            padding: "50px 40px 54px",
            textAlign: "center",
            transform: `translateY(${(1 - card) * 140}px) scale(${0.9 + 0.1 * card})`,
            opacity: card,
            boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 40, color: C.ink2 }}>{s.label} </div>
          <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: bigSize, lineHeight: 1.1, marginTop: 6, transform: `scale(${punch})`, whiteSpace: "nowrap" }}>
            {big}
          </div>
          <div style={{ display: "inline-block", marginTop: 18, background: C.gold, borderRadius: 999, padding: "10px 28px", fontFamily: TITLE, fontWeight: 700, fontSize: 40 }}>
            {s.unit || "par mois"}
          </div>
        </div>
        {s.detail ? (
          <div style={{ position: "relative", marginTop: 30, fontSize: 36, lineHeight: 1.35, fontWeight: 500, opacity: detail, transform: `translateY(${(1 - detail) * 30}px)`, background: "rgba(14,22,48,0.82)", border: "2px solid rgba(255,255,255,0.12)", borderRadius: 30, padding: "26px 32px" }}>
            {s.detail}
            {s.source ? <div style={{ marginTop: 12, fontSize: 28, color: C.mute }}>Source : {s.source}</div> : null}
          </div>
        ) : null}
      </Page>
      <MascotSlot pose="cheer" bubble="En début de carrière !" delay={countStart + countLen} size={440} seed={4} />
    </AbsoluteFill>
  );
};

const Coins: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const f = frame - start;
  if (f < 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const x = (i * 131) % 1000 + 40;
        const delay = (i * 7) % 20;
        const y = -120 + (f - delay) * (14 + (i % 5) * 3);
        if (f < delay) return null;
        return <Emoji key={i} name={i % 3 === 0 ? "_star" : "_sal"} size={60 + (i % 4) * 14} style={{ position: "absolute", left: x, top: y, transform: `rotate(${(f - delay) * (i % 2 ? 6 : -6)}deg)`, opacity: 0.55 }} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------- 6. Fin ---------- */
export const Outro: React.FC<{ m: MetierProps }> = ({ m }) => {
  const frame = useCurrentFrame();
  const logo = useIn(4, 11);
  const url = useIn(26, 12);
  const sub = useIn(44, 12);
  const pulse = 1 + Math.sin(frame / 5) * 0.025;
  return (
    <AbsoluteFill>
      <Background accent={C.gold} accent2={C.blue} />
      <Floaters />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300, fontFamily: TITLE, color: C.white, textAlign: "center" }}>
        <div style={{ transform: `scale(${logo})` }}>
          <Logo size={78} />
        </div>
        <Words
          text={`Comment devenir ${m.nom.toLowerCase()} ?`}
          delay={12}
          per={2}
          style={{ justifyContent: "center", fontWeight: 800, fontSize: m.nom.length > 16 ? 60 : 70, lineHeight: 1.15, marginTop: 60, padding: "0 70px" }}
          highlight={m.nom.toLowerCase().split(" ")}
        />
        <Words text="Toutes les étapes pour y arriver sur" delay={22} per={2} style={{ justifyContent: "center", fontWeight: 600, fontSize: 44, marginTop: 24, color: "#D7DCEB" }} />
        <div
          style={{
            marginTop: 50,
            background: C.gold,
            color: C.navy,
            fontWeight: 800,
            fontSize: 50,
            padding: "22px 46px",
            borderRadius: 999,
            transform: `scale(${url * pulse})`,
            boxShadow: "0 20px 50px rgba(255,201,60,0.35)",
          }}
        >
          trouvetavoie.pages.dev
        </div>
        <div style={{ marginTop: 40, fontSize: 40, fontWeight: 600, color: C.mute, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>
          Abonne-toi : un nouveau métier chaque jour
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: "50%", marginLeft: -(500 * 400) / 560 / 2, top: 1660 - 500 }}>
        <Mascot pose="wave" talking={frame > 50 && frame < 80} size={500} />
      </div>
      <Bubble text="À demain !" delay={50} tail="left" style={{ left: 540 + 190, top: 1210 }} />
    </AbsoluteFill>
  );
};
