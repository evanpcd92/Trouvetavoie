import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { buildMetier } from "./data";
import { But, Hook, Outro, Quotidien, Qualites, SalaireScene } from "./scenes";
import { Progress } from "./ui";

export const FPS = 30;
export const T = 14; // durée des transitions (images)
const QUOT_PER = 34; // délai entre deux lignes « au quotidien »
const COUNT_START = 26;
const COUNT_LEN = 45;

export const timeline = (metier: string) => {
  const m = buildMetier(metier);
  const quot = Math.max(240, 14 + m.quotidien.length * QUOT_PER + (m.aSavoir ? 150 : 90));
  const durs = [140, 200, quot, 170, 200, 150];
  const starts: number[] = [];
  let acc = 0;
  durs.forEach((d, i) => {
    starts.push(acc);
    acc += d - (i < durs.length - 1 ? T : 0);
  });
  return { m, durs, starts, total: acc };
};

export type VideoProps = { metier: string };

export const MetierVideo: React.FC<VideoProps> = ({ metier }) => {
  const { m, durs, starts, total } = timeline(metier);
  const sfx: [string, number, number][] = [
    ["boom", 22, 0.7],
    ["pop", 52, 0.6],
    ["whoosh", starts[1] - 4, 0.5],
    ["whoosh", starts[2] - 4, 0.5],
    ...m.quotidien.map((_, i) => ["pop", starts[2] + 16 + i * QUOT_PER, 0.45] as [string, number, number]),
    ["whoosh", starts[3] - 4, 0.5],
    ...[0, 1, 2].map((i) => ["pop", starts[3] + 16 + i * 16, 0.55] as [string, number, number]),
    ["whoosh", starts[4] - 4, 0.5],
    ["cash", starts[4] + COUNT_START + COUNT_LEN - 2, 0.6],
    ["whoosh", starts[5] - 4, 0.5],
    ["ding", starts[5] + 26, 0.5],
  ];
  return (
    <AbsoluteFill style={{ background: "#0E1630" }}>
      <Audio src={staticFile("audio/music.wav")} volume={(f) => (f > total - 45 ? 0.32 * Math.max(0, (total - f) / 45) : 0.32)} />
      {sfx.map(([name, at, vol], i) => (
        <Sequence key={i} from={Math.max(0, at)} durationInFrames={40} layout="none">
          <Audio src={staticFile(`audio/${name}.wav`)} volume={vol} />
        </Sequence>
      ))}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={durs[0]}>
          <Hook m={m} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[1]}>
          <But m={m} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[2]}>
          <Quotidien m={m} per={QUOT_PER} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[3]}>
          <Qualites m={m} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[4]}>
          <SalaireScene m={m} countStart={COUNT_START} countLen={COUNT_LEN} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={durs[5]}>
          <Outro m={m} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Sequence from={starts[1]} durationInFrames={starts[5] - starts[1]}>
        <Progress starts={starts.slice(1, 5).map((s) => s - starts[1])} total={starts[5] - starts[1]} />
      </Sequence>
    </AbsoluteFill>
  );
};
