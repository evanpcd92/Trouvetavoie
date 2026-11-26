import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { cube } from "@remotion/transitions/cube";
import { iris } from "@remotion/transitions/iris";
import { pushCut } from "@remotion/transitions/push-cut";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { But, Hook, Outro, Quotidien, Qualites, SalaireScene } from "./scenes";
import { T, timeline, VoiceData } from "./timing";
import { Progress } from "./ui";

export type VideoProps = { metier: string; voice?: VoiceData | null };

const MUSIC = 0.3; // volume de la musique quand personne ne parle
const MUSIC_UNDER_VOICE = 0.09; // volume pendant la voix

export const MetierVideo: React.FC<VideoProps> = ({ metier, voice }) => {
  const { m, scenes, durs, starts, total, hasVoice } = timeline(metier, voice);

  // morceaux de voix placés sur la timeline globale
  const clips = scenes.flatMap((sv, i) => sv.segs.map((s, j) => ({ id: s.id, at: starts[i] + sv.cues[j], len: sv.lens[j] })));

  // musique : on baisse pendant la voix, avec des rampes douces
  const speech = new Float32Array(total + 1);
  for (const c of clips) for (let f = c.at - 6; f < c.at + c.len + 8; f++) if (f >= 0 && f <= total) speech[f] = 1;
  const smooth = new Float32Array(total + 1);
  let acc = 0;
  for (let f = 0; f <= total; f++) {
    acc += (speech[f] - acc) * 0.25;
    smooth[f] = acc;
  }
  const musicVol = (f: number) => {
    const base = hasVoice ? MUSIC - (MUSIC - MUSIC_UNDER_VOICE) * smooth[Math.min(total, Math.max(0, Math.round(f)))] : MUSIC;
    return f > total - 45 ? base * Math.max(0, (total - f) / 45) : base;
  };

  const s = scenes;
  const sfx: [string, number, number][] = [
    ["whoosh", 0, 0.35],
    ["pop", 2, 0.4],
    ["whoosh", starts[0] + s[0].cues[1] - 8, 0.35],
    ["boom", starts[0] + s[0].cues[1] - 1, 0.75],
    ["ding", starts[0] + s[0].cues[1] + 2, 0.4],
    ["pop", starts[0] + s[0].cues[1] + s[0].lens[1] + 4, 0.45],
    ["whoosh", starts[1] - 2, 0.5],
    ["whoosh", starts[1] + s[1].cues[1] - 14, 0.35],
    ["boom", starts[1] + s[1].cues[1] - 2, 0.45],
    ["whoosh", starts[2] - 2, 0.5],
    ...m.quotidien.map((_, i) => ["pop", starts[2] + s[2].cues[i + 1] - 3, 0.5] as [string, number, number]),
    ["whoosh", starts[3] - 2, 0.5],
    ...m.qualites.map((_, i) => ["ding", starts[3] + s[3].cues[i + 1] - 2, 0.22] as [string, number, number]),
    ...m.qualites.map((_, i) => ["pop", starts[3] + s[3].cues[i + 1] - 2, 0.4] as [string, number, number]),
    ...m.qualites.map((_, i) => ["boom", starts[3] + s[3].cues[i + 1] - 2, 0.25] as [string, number, number]),
    ["whoosh", starts[4] - 2, 0.5],
    ["whoosh", starts[4] + s[4].cues[0] + 2, 0.3],
    ["cash", starts[4] + s[4].cues[1] + Math.min(48, Math.max(26, s[4].lens[1] - 16)) + 6, 0.6],
    ["boom", starts[4] + s[4].cues[1] + Math.min(48, Math.max(26, s[4].lens[1] - 16)) + 8, 0.4],
    ["whoosh", starts[5] - 2, 0.5],
    ["whoosh", starts[5] + s[5].cues[1] - 10, 0.35],
    ["ding", starts[5] + s[5].cues[1] + 6, 0.45],
    ["boom", starts[5] + s[5].cues[1] + 6, 0.3],
    ["pop", starts[5] + s[5].cues[2] + 8, 0.4],
  ];

  return (
    <AbsoluteFill style={{ background: "#0E1630" }}>
      <Audio src={staticFile("audio/music.wav")} volume={musicVol} />
      {hasVoice && voice?.scenes
        ? voice.scenes.map((sc, i) => (
            <Sequence key={sc.file} from={starts[i] + scenes[i].cues[0]} durationInFrames={Math.ceil(sc.dur * 30) + 10} layout="none">
              <Audio src={staticFile(`voice/${sc.file}`)} volume={1} />
            </Sequence>
          ))
        : hasVoice
        ? clips.map((c) => (
            <Sequence key={c.id} from={c.at} durationInFrames={c.len + 10} layout="none">
              <Audio src={staticFile(`voice/${c.id}.wav`)} volume={1} />
            </Sequence>
          ))
        : null}
      {sfx.map(([name, at, vol], i) => (
        <Sequence key={i} from={Math.max(0, at)} durationInFrames={40} layout="none">
          <Audio src={staticFile(`audio/${name}.wav`)} volume={vol} />
        </Sequence>
      ))}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={durs[0]}>
          <Hook m={m} v={s[0]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={pushCut({ flashColor: "#FFC93C", flashOpacity: 0.9 })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[1]}>
          <But m={m} v={s[1]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={cube({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[2]}>
          <Quotidien m={m} v={s[2]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={iris({ width: 1080, height: 1920 })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[3]}>
          <Qualites m={m} v={s[3]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={cube({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[4]}>
          <SalaireScene m={m} v={s[4]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={clockWipe({ width: 1080, height: 1920 })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[5]}>
          <Outro m={m} v={s[5]} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Sequence from={starts[1]} durationInFrames={starts[5] - starts[1]}>
        <Progress starts={starts.slice(1, 5).map((x) => x - starts[1])} total={starts[5] - starts[1]} />
      </Sequence>
    </AbsoluteFill>
  );
};
