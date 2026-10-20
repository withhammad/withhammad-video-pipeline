import type React from "react";
import type { Caption } from "@remotion/captions";
import { Video } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Composition,
  Folder,
  Sequence,
  registerRoot,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C } from "./common";
import { Hook } from "./Hook";
import { Connect } from "./Connect";
import { Criteria } from "./Criteria";
import { Research } from "./Research";
import { Shortlist } from "./Shortlist";
import { Draft } from "./Draft";
import { Permission } from "./Permission";
import { Review } from "./Review";
import { CTA } from "./CTA";
loadFont({
  family: "JobInter",
  url: staticFile("fonts/inter-latin-600-normal.woff2"),
  weight: "600",
});
loadFont({
  family: "JobInter",
  url: staticFile("fonts/inter-latin-800-normal.woff2"),
  weight: "800",
});
loadFont({
  family: "JobSerif",
  url: staticFile("fonts/source-serif-4-latin-700-normal.woff2"),
  weight: "700",
});
type SecondsCaption = { start: number; end: number; text: string };
export type JobSearchProps = {
  avatar: string;
  duration: number;
  beats: number[];
  captions: (Caption | SecondsCaption)[];
  docsVideo: string;
  draftMode: boolean;
  avatarPosition: string;
};
const normaliseCaption = (c: Caption | SecondsCaption): Caption =>
  "startMs" in c
    ? c
    : {
        text: c.text,
        startMs: c.start * 1000,
        endMs: c.end * 1000,
        timestampMs: null,
        confidence: null,
      };
const asset = (path: string) =>
  /^https?:\/\//.test(path) ? path : staticFile(path);
const Captions: React.FC<{ captions: (Caption | SecondsCaption)[] }> = ({
  captions,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const current = captions
    .map(normaliseCaption)
    .filter((c) => ms >= c.startMs && ms < c.endMs);
  if (!current.length) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 1375,
        left: 80,
        width: 530,
        zIndex: 20,
        fontFamily: "JobSerif",
        fontWeight: 700,
        fontSize: 49,
        lineHeight: 1.22,
        color: C.ink,
      }}
    >
      {current
        .map((c) => c.text)
        .join(" ")
        .trim()}
    </div>
  );
};
export const JobSearch: React.FC<JobSearchProps> = ({
  avatar,
  duration,
  beats,
  captions,
  docsVideo,
  draftMode,
  avatarPosition,
}) => {
  const { fps } = useVideoConfig();
  const b = beats.map((t) => Math.round(t * fps));
  return (
    <AbsoluteFill
      style={{ fontFamily: "JobInter", fontWeight: 600, background: C.paper }}
    >
      <Sequence
        name="Hook"
        from={b[0]}
        durationInFrames={b[1] - b[0]}
        premountFor={fps}
      >
        <Hook />
      </Sequence>
      <Sequence
        name="1 Connect"
        from={b[1]}
        durationInFrames={b[2] - b[1]}
        premountFor={fps}
      >
        <Connect docsVideo={docsVideo} />
      </Sequence>
      <Sequence
        name="2 Criteria"
        from={b[2]}
        durationInFrames={b[3] - b[2]}
        premountFor={fps}
      >
        <Criteria />
      </Sequence>
      <Sequence
        name="3 Research"
        from={b[3]}
        durationInFrames={b[4] - b[3]}
        premountFor={fps}
      >
        <Research />
      </Sequence>
      <Sequence
        name="4 Shortlist"
        from={b[4]}
        durationInFrames={b[5] - b[4]}
        premountFor={fps}
      >
        <Shortlist />
      </Sequence>
      <Sequence
        name="5 Draft"
        from={b[5]}
        durationInFrames={b[6] - b[5]}
        premountFor={fps}
      >
        <Draft />
      </Sequence>
      <Sequence
        name="Permissions"
        from={b[6]}
        durationInFrames={b[7] - b[6]}
        premountFor={fps}
      >
        <Permission />
      </Sequence>
      <Sequence
        name="Human review"
        from={b[7]}
        durationInFrames={b[8] - b[7]}
        premountFor={fps}
      >
        <Review />
      </Sequence>
      <Sequence
        name="JOBKIT CTA"
        from={b[8]}
        durationInFrames={Math.ceil(duration * fps) - b[8]}
        premountFor={fps}
      >
        <CTA />
      </Sequence>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 1265,
          width: 920,
          height: 2,
          background: C.line,
        }}
      />
      <Sequence
        name="Small continuous Hammad PIP + synchronized captions"
        durationInFrames={Math.ceil(duration * fps)}
        premountFor={fps}
      >
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: 120,
            width: 330,
            height: 587,
            borderRadius: 28,
            overflow: "hidden",
            background: "#34392f",
            boxShadow: "0 12px 35px #30241925",
            border: "2px solid #c9bba2",
          }}
        >
          {avatar ? (
            <Video
              src={asset(avatar)}
              premountFor={fps}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: avatarPosition,
              }}
            />
          ) : (
            <div
              style={{
                padding: 30,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxSizing: "border-box",
                color: "#eee4d0",
              }}
            >
              <div style={{ fontSize: 21, letterSpacing: 2 }}>SCENE DRAFT</div>
              <div
                style={{ fontFamily: "JobSerif", fontSize: 39, marginTop: 20 }}
              >
                Hammad’s clip
                <br />
                pending
              </div>
              <div style={{ fontSize: 21, marginTop: 20 }}>330 × 587 PIP</div>
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: 18,
              bottom: 14,
              fontSize: 18,
              color: "#fff",
              textShadow: "0 2px 3px #000",
            }}
          >
            {avatar
              ? "AI avatar of Hammad"
              : draftMode
                ? "Not a final video"
                : ""}
          </div>
        </div>
        <Captions captions={captions} />
      </Sequence>
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 126,
          color: C.muted,
          fontSize: 25,
        }}
      >
        HAMMAD YOUSUF
        <br />
        <span style={{ fontSize: 23 }}>withhammad.com</span>
      </div>
    </AbsoluteFill>
  );
};
const Root = () => (
  <>
    <Composition
      id="JobSearch"
      component={JobSearch}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={2070}
      defaultProps={{
        avatar: "",
        duration: 69,
        beats: [0, 12, 21, 27, 36, 45, 52, 57, 64],
        captions: [],
        docsVideo: "job-search/playwright-docs.mp4",
        draftMode: true,
        avatarPosition: "center",
      }}
      calculateMetadata={({ props }) => {
        if (!props.draftMode && !props.avatar)
          throw new Error(
            "Final output requires Hammad’s completed avatar clip.",
          );
        if (!Number.isFinite(props.duration) || props.duration <= 0)
          throw new Error("duration must be positive seconds");
        if (
          props.beats.length !== 9 ||
          props.beats[0] !== 0 ||
          props.beats.some(
            (v, i) =>
              !Number.isFinite(v) ||
              v < 0 ||
              (i > 0 && v <= props.beats[i - 1]),
          ) ||
          props.beats[8] >= props.duration
        )
          throw new Error(
            "beats must contain nine increasing scene starts in seconds, starting at zero and ending before duration",
          );
        return { durationInFrames: Math.ceil(props.duration * 30) };
      }}
    />
    <Folder name="JobSearch-Scenes">
      <Composition
        id="JobHook"
        component={Hook}
        width={1080}
        height={1280}
        fps={30}
        durationInFrames={360}
      />
      <Composition
        id="JobConnect"
        component={Connect}
        width={1080}
        height={1280}
        fps={30}
        durationInFrames={270}
        defaultProps={{ docsVideo: "job-search/playwright-docs.mp4" }}
      />
      <Composition
        id="JobCriteria"
        component={Criteria}
        width={1080}
        height={1280}
        fps={30}
        durationInFrames={180}
      />
      <Composition
        id="JobResearch"
        component={Research}
        width={1080}
        height={1280}
        fps={30}
        durationInFrames={270}
      />
      <Composition
        id="JobShortlist"
        component={Shortlist}
        width={1080}
        height={1280}
        fps={30}
        durationInFrames={270}
      />
      <Composition
        id="JobDraft"
        component={Draft}
        width={1080}
        height={1280}
        fps={30}
        durationInFrames={210}
      />
      <Composition
        id="JobPermission"
        component={Permission}
        width={1080}
        height={1280}
        fps={30}
        durationInFrames={150}
      />
      <Composition
        id="JobReview"
        component={Review}
        width={1080}
        height={1280}
        fps={30}
        durationInFrames={210}
      />
      <Composition
        id="JobCTA"
        component={CTA}
        width={1080}
        height={1280}
        fps={30}
        durationInFrames={150}
      />
    </Folder>
  </>
);
registerRoot(Root);
