import React from "react";
import { Composition, staticFile } from "remotion";
import { MetierVideo, VideoProps } from "./Video";
import { FPS, timeline, VoiceData } from "./timing";
import { histoireTimeline, HistoireProps, HVoice, MonHistoire } from "./Histoire";
import { MiniHistoire, Miniature, MiniatureProps } from "./Miniature";

/** charge la voix générée par scripts/make_voice.py (public/voice/voice.json) si elle correspond au métier */
async function loadVoice(metier: string): Promise<VoiceData | null> {
  try {
    const r = await fetch(staticFile("voice/voice.json"));
    if (!r.ok) return null;
    const v = (await r.json()) as VoiceData;
    return v.key === metier ? v : null;
  } catch {
    return null;
  }
}

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="MetierDuJour"
    component={MetierVideo}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={timeline("infirmier").total}
    defaultProps={{ metier: "infirmier", voice: null } as VideoProps}
    calculateMetadata={async ({ props }) => {
      const voice = props.voice ?? (await loadVoice(props.metier));
      return { durationInFrames: timeline(props.metier, voice).total, props: { ...props, voice } };
    }}
  />
  <Composition
    id="MonHistoire"
    component={MonHistoire}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={histoireTimeline(null).total}
    defaultProps={{ voice: null } as HistoireProps}
    calculateMetadata={async ({ props }) => {
      let voice: HVoice | null = (props.voice as HVoice | null) ?? null;
      if (!voice) {
        try {
          const r = await fetch(staticFile("voice-histoire/voice.json"));
          if (r.ok) voice = (await r.json()) as HVoice;
        } catch {
          voice = null;
        }
      }
      return { durationInFrames: histoireTimeline(voice).total, props: { ...props, voice } };
    }}
  />
  <Composition id="Miniature" component={Miniature} width={1080} height={1920} fps={FPS} durationInFrames={1} defaultProps={{ metier: "infirmier" } as MiniatureProps} />
  <Composition id="MiniHistoire" component={MiniHistoire} width={1080} height={1920} fps={FPS} durationInFrames={1} />
  </>
);
