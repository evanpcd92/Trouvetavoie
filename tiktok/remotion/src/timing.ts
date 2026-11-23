// Minutage de la vidéo, calculé à partir de la durée réelle de chaque morceau de voix.
import { buildMetier, MetierProps } from "./data";
import { Seg, voiceScript } from "./script";

export const FPS = 30;
export const T = 14; // durée des transitions (images)

export type VoiceData = { key: string; segs: Record<string, { dur: number; env: number[] }> };

/** voix d'une scène : début (image locale), durée et enveloppe de chaque morceau */
export type SceneVoice = { segs: Seg[]; cues: number[]; lens: number[]; env: (number[] | null)[] };

const LEAD = [8, T + 4, T + 4, T + 4, T + 4, T + 4];
const GAP = [4, 5, 8, 7, 6, 6];
const TAIL = [42, 26, 34, 40, 56, 50];
const MIN = [100, 90, 120, 100, 130, 120];

export function mouthAt(v: SceneVoice, f: number): number {
  for (let i = 0; i < v.cues.length; i++) {
    const k = f - v.cues[i];
    if (k >= 0 && k < v.lens[i]) {
      const e = v.env[i];
      if (e) return e[Math.min(e.length - 1, k)] ?? 0;
      return 0.5 + 0.5 * Math.abs(Math.sin(k * 0.9)); // sans voix (aperçu) : bouche approximative
    }
  }
  return 0;
}

export function timeline(metier: string, voice?: VoiceData | null) {
  const m: MetierProps = buildMetier(metier);
  const script = voiceScript(m);
  const useVoice = voice && voice.key === metier ? voice : null;
  const scenes: SceneVoice[] = script.map((segs, i) => {
    let f = LEAD[i];
    const cues: number[] = [], lens: number[] = [], env: (number[] | null)[] = [];
    segs.forEach((s, j) => {
      const v = useVoice?.segs[s.id];
      const dur = v ? v.dur : Math.max(0.6, s.text.split(" ").length * 0.32);
      const len = Math.ceil(dur * FPS);
      cues.push(f);
      lens.push(len);
      env.push(v ? v.env : null);
      f += len + (j === 0 && i === 0 ? 2 : GAP[i]);
    });
    return { segs, cues, lens, env };
  });
  const durs = scenes.map((s, i) => {
    const last = s.cues.length - 1;
    const endOfSpeech = s.cues[last] + s.lens[last];
    const extra = i === 2 && m.aSavoir ? 60 : 0; // le temps de lire « Bon à savoir »
    return Math.max(MIN[i], endOfSpeech + TAIL[i] + extra);
  });
  const starts: number[] = [];
  let acc = 0;
  durs.forEach((d, i) => {
    starts.push(acc);
    acc += d - (i < durs.length - 1 ? T : 0);
  });
  return { m, scenes, durs, starts, total: acc, hasVoice: !!useVoice };
}
