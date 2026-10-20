import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
export const C = {
  ink: "#292a23",
  paper: "#f6eedf",
  muted: "#706e60",
  accent: "#b64e2c",
  green: "#375e4c",
  line: "#d9ccb5",
};
export const Pop: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        opacity: interpolate(f - delay, [0, 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: `0 ${30 * (1 - spring({ frame: f - delay, fps, config: { damping: 22 } }))}px`,
      }}
    >
      {children}
    </div>
  );
};
export const Panel: React.FC<{
  children: React.ReactNode;
  step?: number;
  title: string;
  illustrative?: boolean;
}> = ({ children, step, title, illustrative = false }) => (
  <AbsoluteFill
    style={{
      height: 1280,
      padding: "100px 80px 70px",
      boxSizing: "border-box",
      background: C.paper,
      color: C.ink,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 36,
      }}
    >
      <div
        style={{
          fontFamily: "JobInter",
          fontWeight: 800,
          fontSize: 25,
          letterSpacing: 2,
          color: C.accent,
        }}
      >
        {step ? `STEP ${step} / 5` : "WITH HAMMAD"}
      </div>
      <div style={{ display: "flex", gap: 9 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            style={{
              width: 45,
              height: 7,
              borderRadius: 4,
              background: step && n <= step ? C.accent : C.line,
            }}
          />
        ))}
      </div>
    </div>
    <div
      style={{
        fontFamily: "JobSerif",
        fontWeight: 700,
        fontSize: 84,
        lineHeight: 1.06,
        letterSpacing: -2,
        marginBottom: 30,
        whiteSpace: "pre-line",
      }}
    >
      {title}
    </div>
    {illustrative && (
      <div
        style={{
          fontFamily: "JobInter",
          fontSize: 25,
          fontWeight: 800,
          color: C.muted,
          marginBottom: 25,
        }}
      >
        ILLUSTRATIVE EXAMPLE
      </div>
    )}
    {children}
  </AbsoluteFill>
);
export const Row: React.FC<{
  label: string;
  value: string;
  delay?: number;
}> = ({ label, value, delay = 0 }) => (
  <Pop delay={delay}>
    <div
      style={{
        padding: "22px 24px",
        border: "2px solid " + C.line,
        borderRadius: 15,
        marginBottom: 16,
        background: "#fffaf1",
      }}
    >
      <div
        style={{
          fontFamily: "JobInter",
          fontSize: 24,
          color: C.muted,
          marginBottom: 7,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "JobInter",
          fontSize: 39,
          fontWeight: 800,
          lineHeight: 1.16,
        }}
      >
        {value}
      </div>
    </div>
  </Pop>
);
