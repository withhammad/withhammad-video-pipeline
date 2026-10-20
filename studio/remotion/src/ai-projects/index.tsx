import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Still,
  OffthreadVideo,
  Sequence,
  registerRoot,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
loadFont({
  family: "Inter",
  url: staticFile("fonts/inter-latin-800-normal.woff2"),
  weight: "800",
});

type Caption = {
  start: number;
  end: number;
  text: string;
  words?: { text: string; start: number; end: number }[];
};
type Props = {
  avatar: string;
  duration: number;
  captions: Caption[];
  beats: number[];
  cuts?: number[];
  music?: string;
  draftMode: boolean;
};
const defaults: Props = {
  avatar: "",
  duration: 32,
  draftMode: true,
  captions: [],
  beats: [0, 4.5, 9, 16, 23, 27],
};
const accent = "#d6ff54";
const Pop: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: f - delay,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  return (
    <div
      style={{
        opacity: interpolate(f - delay, [0, 6], [0, 1], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        }),
        transform: `translateY(${(1 - p) * 44}px) scale(${0.96 + 0.04 * p})`,
      }}
    >
      {children}
    </div>
  );
};
const Board: React.FC<{ children: React.ReactNode; label: string }> = ({
  children,
  label,
}) => (
  <AbsoluteFill
    style={{
      height: 840,
      background: "#101b22",
      color: "#fff",
      padding: "110px 80px 50px",
      boxSizing: "border-box",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        fontSize: 25,
        letterSpacing: 4,
        color: "#91a4b1",
        marginBottom: 35,
      }}
    >
      {label}
    </div>
    {children}
  </AbsoluteFill>
);
const Hook = () => (
  <Board label="BUILD YOUR AI PORTFOLIO">
    <Pop>
      <div style={{ fontSize: 89, lineHeight: 1.08, letterSpacing: -4 }}>
        Learning AI.
        <br />
        What do you
        <br />
        <span style={{ color: accent }}>build next?</span>
      </div>
    </Pop>
    <Pop delay={12}>
      <div
        style={{
          display: "inline-block",
          fontSize: 29,
          background: "#23323c",
          padding: "20px 24px",
          borderRadius: 18,
          marginTop: 42,
        }}
      >
        A practical starting point ↓
      </div>
    </Pop>
  </Board>
);
const Catalog = () => (
  <AbsoluteFill style={{ height: 840, background: "#101b22" }}>
    <OffthreadVideo
      src={staticFile("ai-projects/catalog.mp4")}
      muted
      style={{ width: 1080, height: 840, objectFit: "cover" }}
    />
    <div
      style={{
        position: "absolute",
        left: 50,
        top: 34,
        background: accent,
        color: "#102025",
        padding: "16px 24px",
        borderRadius: 18,
        fontSize: 38,
      }}
    >
      85 project ideas
    </div>
  </AbsoluteFill>
);
const Themes = () => {
  const f = useCurrentFrame();
  const names = ["AI AGENTS", "RAG SYSTEMS", "FINE-TUNING", "LANGUAGE MODELS"];
  return (
    <Board label="BEGINNER → ADVANCED">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {names.map((name, i) => (
          <Pop key={name} delay={i * 18}>
            <div
              style={{
                fontSize: 49,
                padding: "23px 28px",
                borderRadius: 20,
                border: "2px solid #34434d",
                background:
                  f >= i * 18 && f < (i + 1) * 45 ? "#d6ff54" : "#1c2b34",
                color: f >= i * 18 && f < (i + 1) * 45 ? "#102025" : "white",
              }}
            >
              {name}
            </div>
          </Pop>
        ))}
      </div>
    </Board>
  );
};
const Project = () => (
  <AbsoluteFill style={{ height: 840, background: "#101b22" }}>
    <OffthreadVideo
      muted
      src={staticFile("ai-projects/project.mp4")}
      style={{ width: 1080, height: 840, objectFit: "cover" }}
    />
  </AbsoluteFill>
);
const Build = () => (
  <Board label="TURN AN IDEA INTO EVIDENCE">
    <Pop>
      <div style={{ fontSize: 82, lineHeight: 1.15, letterSpacing: -3 }}>
        Pick one.
        <br />
        Build it.
        <br />
        <span style={{ color: accent }}>Show the result.</span>
      </div>
    </Pop>
    <div style={{ fontSize: 32, color: "#b2c2ca", marginTop: 50 }}>
      A working demo + what you learned
    </div>
  </Board>
);
const CTA = () => (
  <Board label="THE REPO + MY BUILD CHECKLIST">
    <Pop>
      <div style={{ fontSize: 68, lineHeight: 1.15 }}>Comment</div>
      <div
        style={{
          fontSize: 99,
          letterSpacing: -4,
          color: accent,
          marginTop: 15,
        }}
      >
        PROJECTS
      </div>
    </Pop>
    <div style={{ marginTop: 48, fontSize: 34, color: "#bac9d0" }}>
      withhammad.com
    </div>
    <div style={{ marginTop: 18, fontSize: 25, color: "#91a4b1" }}>
      Save this for your next build.
    </div>
  </Board>
);
const Video: React.FC<Props> = ({
  avatar,
  duration,
  captions,
  beats,
  cuts = [],
  music,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const zoom = 1 + (cuts.filter((c) => t >= c).length % 2) * 0.025;
  const cap = captions.find((c) => t >= c.start && t < c.end);
  const b = beats.map((s) => Math.round(s * fps));
  const end = Math.ceil(duration * fps);
  return (
    <AbsoluteFill style={{ fontFamily: "Inter", background: "#101b22" }}>
      {avatar ? (
        <div
          style={{
            position: "absolute",
            left: 640,
            top: 1370,
            width: 360,
            height: 203,
            overflow: "hidden",
            borderRadius: 28,
            border: "2px solid #3b505e",
            boxShadow: "0 20px 70px #0006",
          }}
        >
          <OffthreadVideo
            src={staticFile(avatar)}
            style={{
              position: "absolute",
              width: 360,
              height: 203,
              objectFit: "contain",
              transform: `scale(${zoom})`,
              transformOrigin: "50% 28%",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: 640,
            top: 1370,
            width: 360,
            height: 203,
            background: "#273841",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b0c4ce",
            fontSize: 38,
          }}
        >
          Presenter render pending
        </div>
      )}
      <Sequence from={b[0]} durationInFrames={b[1] - b[0]}>
        <Hook />
      </Sequence>
      <Sequence from={b[1]} durationInFrames={b[2] - b[1]}>
        <Catalog />
      </Sequence>
      <Sequence from={b[2]} durationInFrames={b[3] - b[2]}>
        <Themes />
      </Sequence>
      <Sequence from={b[3]} durationInFrames={b[4] - b[3]}>
        <Project />
      </Sequence>
      <Sequence from={b[4]} durationInFrames={b[5] - b[4]}>
        <Build />
      </Sequence>
      <Sequence from={b[5]} durationInFrames={end - b[5]}>
        <CTA />
      </Sequence>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 1210,
          width: 520,
          color: "white",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 3, color: "#91a4b1" }}>
          YOUR NEXT STEP
        </div>
        <div
          style={{
            fontSize: 65,
            lineHeight: 1.15,
            letterSpacing: -2,
            marginTop: 30,
          }}
        >
          Build small.
          <br />
          <span style={{ color: accent }}>Show your work.</span>
        </div>
        <div style={{ fontSize: 30, color: "#b2c2ca", marginTop: 45 }}>
          Pick a project.
          <br />
          Test your demo.
          <br />
          Explain the tradeoffs.
        </div>
        <div style={{ fontSize: 25, marginTop: 65, color: "#b2c2ca" }}>
          withhammad.com
        </div>
      </div>
      {music && <Audio src={staticFile(music)} volume={0.055} />}
      <div
        style={{
          position: "absolute",
          top: 946,
          left: 80,
          height: 3,
          width: 920,
          background: accent,
        }}
      />
      {cap && (
        <div
          style={{
            position: "absolute",
            top: 993,
            left: 55,
            right: 55,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 49,
              fontWeight: 800,
              lineHeight: 1.25,
              background: "#071016",
              color: "white",
              boxDecorationBreak: "clone",
              padding: "12px 24px",
              borderRadius: 14,
              textShadow: "0 2px 4px #000",
            }}
          >
            {cap.words
              ? cap.words.map((w, i) => (
                  <span
                    key={i}
                    style={{
                      color: t >= w.start && t < w.end ? accent : "white",
                    }}
                  >
                    {i ? " " : ""}
                    {w.text}
                  </span>
                ))
              : cap.text}
          </span>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 675,
          top: 1600,
          fontSize: 22,
          color: "white",
          textShadow: "0 2px 6px #000",
        }}
      >
        HAMMAD YOUSUF
      </div>
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 1640,
          fontSize: 18,
          color: "white",
          textShadow: "0 2px 6px #000",
        }}
      >
        AI avatar
      </div>
    </AbsoluteFill>
  );
};
const Cover = () => (
  <AbsoluteFill
    style={{
      fontFamily: "Inter",
      background: "#101b22",
      color: "white",
      padding: 80,
    }}
  >
    <div
      style={{
        fontSize: 28,
        letterSpacing: 3,
        color: "#91a4b1",
        marginTop: 100,
      }}
    >
      YOUR AI PORTFOLIO
    </div>
    <div style={{ fontSize: 230, lineHeight: 1, color: accent, marginTop: 70 }}>
      85
    </div>
    <div
      style={{
        fontSize: 94,
        lineHeight: 1.1,
        letterSpacing: -4,
        marginTop: 20,
      }}
    >
      AI PROJECT
      <br />
      IDEAS
    </div>
    <div style={{ fontSize: 36, color: "#b2c2ca", marginTop: 45 }}>
      Beginner → Advanced
    </div>
    <div
      style={{
        position: "absolute",
        left: 80,
        top: 1240,
        fontSize: 66,
        lineHeight: 1.2,
      }}
    >
      Pick one.
      <br />
      Build it.
      <br />
      <span style={{ color: accent }}>Show it.</span>
    </div>

    <div style={{ position: "absolute", left: 80, bottom: 155, fontSize: 28 }}>
      withhammad.com
    </div>
    <div style={{ position: "absolute", left: 640, top: 1740, fontSize: 22 }}>
      HAMMAD YOUSUF
    </div>
  </AbsoluteFill>
);
const Root = () => (
  <>
    <Composition
      id="AIProjects"
      component={Video}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={960}
      defaultProps={defaults}
      calculateMetadata={({ props }) => {
        if (!props.draftMode && !props.avatar)
          throw new Error(
            "Final output requires an owner-approved replacement avatar.",
          );
        return { durationInFrames: Math.ceil(props.duration * 30) };
      }}
    />
    <Still id="AIProjectsCover" component={Cover} width={1080} height={1920} />
  </>
);
registerRoot(Root);
