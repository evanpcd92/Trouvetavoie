import React from "react";
import { Composition, staticFile } from "remotion";
import { MetierVideo, VideoProps } from "./Video";
import { FPS, timeline, VoiceData } from "./timing";
import { histoireTimeline, HistoireProps, HVoice, MonHistoire } from "./Histoire";
import { MiniReorientation, ReoProps, ReorientationVideo, reoTimeline, RVoice } from "./Reorientation";
import { MiniParents, ParentsProps, ParentsVideo, parentsTimeline, PVoice } from "./Parents";
import { MiniHistoire, Miniature, MiniatureProps, OgImage } from "./Miniature";
import { H2Props, H2Voice, Histoire2Video, histoire2Timeline, MiniHistoire2 } from "./Histoire2";
import { MiniPresentation, PresentationVideo, PresProps, presTimeline, PVoice as PresVoice } from "./Presentation";

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
  <Composition
    id="Parents"
    component={ParentsVideo}
    width={1080}
    height={1350}
    fps={FPS}
    durationInFrames={parentsTimeline(null).total}
    defaultProps={{ voice: null } as ParentsProps}
    calculateMetadata={async ({ props }) => {
      let voice: PVoice | null = (props.voice as PVoice | null) ?? null;
      if (!voice) {
        try {
          const r = await fetch(staticFile("voice-parents/voice.json"));
          if (r.ok) voice = (await r.json()) as PVoice;
        } catch {
          voice = null;
        }
      }
      return { durationInFrames: parentsTimeline(voice).total, props: { ...props, voice } };
    }}
  />
  <Composition
    id="Reorientation"
    component={ReorientationVideo}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={reoTimeline(null).total}
    defaultProps={{ voice: null } as ReoProps}
    calculateMetadata={async ({ props }) => {
      let voice: RVoice | null = (props.voice as RVoice | null) ?? null;
      if (!voice) {
        try {
          const r = await fetch(staticFile("voice-reorientation/voice.json"));
          if (r.ok) voice = (await r.json()) as RVoice;
        } catch {
          voice = null;
        }
      }
      return { durationInFrames: reoTimeline(voice).total, props: { ...props, voice } };
    }}
  />
  <Composition
    id="Presentation"
    component={PresentationVideo}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={presTimeline(null).total}
    defaultProps={{ voice: null } as PresProps}
    calculateMetadata={async ({ props }) => {
      let voice: PresVoice | null = (props.voice as PresVoice | null) ?? null;
      if (!voice) {
        try {
          const r = await fetch(staticFile("voice-presentation/voice.json"));
          if (r.ok) voice = (await r.json()) as PresVoice;
        } catch {
          voice = null;
        }
      }
      return { durationInFrames: presTimeline(voice).total, props: { ...props, voice } };
    }}
  />
  <Composition id="MiniPresentation" component={MiniPresentation} width={1080} height={1920} fps={FPS} durationInFrames={1} />
  <Composition
    id="Histoire2"
    component={Histoire2Video}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={histoire2Timeline(null).total}
    defaultProps={{ voice: null } as H2Props}
    calculateMetadata={async ({ props }) => {
      let voice: H2Voice | null = (props.voice as H2Voice | null) ?? null;
      if (!voice) {
        try {
          const r = await fetch(staticFile("voice-histoire2/voice.json"));
          if (r.ok) voice = (await r.json()) as H2Voice;
        } catch {
          voice = null;
        }
      }
      return { durationInFrames: histoire2Timeline(voice).total, props: { ...props, voice } };
    }}
  />
  <Composition id="MiniHistoire2" component={MiniHistoire2} width={1080} height={1920} fps={FPS} durationInFrames={1} />
  <Composition id="MiniReorientation" component={MiniReorientation} width={1080} height={1920} fps={FPS} durationInFrames={1} />
  <Composition id="MiniParents" component={MiniParents} width={1080} height={1350} fps={FPS} durationInFrames={1} />
  <Composition id="Miniature" component={Miniature} width={1080} height={1920} fps={FPS} durationInFrames={1} defaultProps={{ metier: "infirmier" } as MiniatureProps} />
  <Composition id="MiniHistoire" component={MiniHistoire} width={1080} height={1920} fps={FPS} durationInFrames={1} />
  <Composition id="OgImage" component={OgImage} width={1200} height={630} fps={FPS} durationInFrames={1} />
  </>
);
