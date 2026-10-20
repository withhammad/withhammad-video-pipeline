import { Panel, Pop, C } from "./common";
export const Review = () => (
  <Panel title="Stop. Check. Then decide." illustrative>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {["Resume", "Dates", "Eligibility", "Every answer"].map((v, i) => (
        <Pop key={v} delay={i * 12}>
          <div
            style={{
              padding: "23px 29px",
              border: "2px solid " + C.line,
              borderRadius: 16,
              background: "#fffaf1",
              fontSize: 42,
            }}
          >
            {v}
          </div>
        </Pop>
      ))}
    </div>
    <Pop delay={40}>
      <div
        style={{
          marginTop: 44,
          padding: 30,
          background: C.accent,
          color: "#fff9ec",
          fontSize: 46,
          borderRadius: 18,
        }}
      >
        STOPPED · Review required
      </div>
    </Pop>
    <div style={{ fontSize: 42, color: C.green, marginTop: 35 }}>
      You press Submit.
    </div>
  </Panel>
);
