import React from "react";
import { Composition } from "remotion";
import { FPS, MetierVideo, timeline, VideoProps } from "./Video";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MetierDuJour"
    component={MetierVideo}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={timeline("infirmier").total}
    defaultProps={{ metier: "infirmier" } as VideoProps}
    calculateMetadata={({ props }) => ({ durationInFrames: timeline(props.metier).total })}
  />
);
