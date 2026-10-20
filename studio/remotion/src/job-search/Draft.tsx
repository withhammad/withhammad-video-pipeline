import { useCurrentFrame, useVideoConfig } from "remotion";
import { Panel, Row, C } from "./common";
export const Draft = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = "My project used Python to build a small API.";
  return (
    <Panel step={5} title="Draft truthful answers." illustrative>
      <Row label="RESUME" value="Sample resume.pdf" />
      <div
        style={{
          border: "2px solid " + C.line,
          background: "#fffaf1",
          padding: 26,
          borderRadius: 18,
        }}
      >
        <div style={{ fontSize: 25, color: C.muted, marginBottom: 14 }}>
          RELEVANT EXPERIENCE
        </div>
        <div style={{ minHeight: 104, fontSize: 42, lineHeight: 1.22 }}>
          {text.slice(0, Math.max(0, Math.floor((f / fps - 0.5) * 17)))}
        </div>
      </div>
      <div style={{ fontSize: 40, color: C.accent, marginTop: 35 }}>
        Personalize. Never invent.
      </div>
    </Panel>
  );
};
