import { Panel, C, Pop } from "./common";
export const Shortlist = () => (
  <Panel step={4} title="Show the evidence." illustrative>
    <Pop>
      <div
        style={{
          border: "2px solid " + C.line,
          borderRadius: 20,
          overflow: "hidden",
          background: "#fffaf1",
        }}
      >
        <div
          style={{
            fontSize: 31,
            padding: 24,
            background: C.green,
            color: "#fff",
          }}
        >
          SAMPLE SHORTLIST ROW
        </div>
        <div style={{ padding: 26 }}>
          <div style={{ fontSize: 26, color: C.muted, marginBottom: 10 }}>
            ROLE REQUIREMENT
          </div>
          <div style={{ fontSize: 43, fontWeight: 800 }}>Python APIs</div>
          <div style={{ height: 2, background: C.line, margin: "25px 0" }} />
          <div style={{ fontSize: 26, color: C.muted, marginBottom: 10 }}>
            RESUME EVIDENCE
          </div>
          <div style={{ fontSize: 39 }}>FastAPI project</div>
          <div style={{ fontSize: 31, color: C.accent, marginTop: 27 }}>
            Gap: production experience
          </div>
        </div>
      </div>
    </Pop>
    <Pop delay={30}>
      <div style={{ fontSize: 42, marginTop: 30 }}>
        Up to 10 matches. Include the gaps.
      </div>
    </Pop>
  </Panel>
);
