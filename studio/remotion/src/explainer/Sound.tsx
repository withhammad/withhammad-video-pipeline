import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";
import { speechAmount, toFrame, toMs } from "./theme";
import type { Music, Sfx, Word } from "./types";

/** The bed ducks under EVERY spoken word (the unfiltered captions: a word shown as a display overlay is still
 *  spoken), holds the duck across gaps under holdGapMs, fades in over fadeInMs and out over fadeOutMs. */
export const MusicTrack: React.FC<{ music: Music; words: Word[]; durationMs: number }> = ({ music, words, durationMs }) => {
  const volume = music.volume ?? 0.12;
  const duckTo = music.duckTo ?? 0.07;
  const fadeOut = Math.max(1, music.fadeOutMs ?? 500);
  const fadeIn = Math.max(1, music.fadeInMs ?? 1);
  const hold = music.holdGapMs ?? 0;
  return (
    <Audio
      src={staticFile(music.src)}
      name="music"
      volume={(f) => {
        const ms = toMs(f);
        const g = volume + (duckTo - volume) * speechAmount(words, ms, 150, hold);
        const edge = Math.min(1, Math.max(0, (durationMs - ms) / fadeOut), Math.max(0, ms / fadeIn));
        return Math.max(0, Math.min(1, g * edge));
      }}
    />
  );
};

/** Every SFX in its own Sequence from its start. */
export const SfxTracks: React.FC<{ sfx: Sfx[] }> = ({ sfx }) => (
  <>
    {sfx.map((x, i) => (
      <Sequence key={`sfx${i}`} from={Math.max(0, toFrame(x.atMs))} layout="none" name={`sfx ${i}`}>
        <Audio src={staticFile(x.src)} volume={Math.min(1, Math.max(0, x.volume ?? 0.3))} />
      </Sequence>
    ))}
  </>
);
