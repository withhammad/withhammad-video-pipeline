import { Panel, Pop, C } from "./common";
export const CTA = () => (
  <Panel title="Your job-search kit.">
    <Pop>
      <div style={{ fontSize: 45, marginTop: 30 }}>Comment</div>
      <div
        style={{
          fontSize: 123,
          fontFamily: "JobInter",
          fontWeight: 800,
          color: C.accent,
          letterSpacing: -5,
          marginTop: 5,
        }}
      >
        JOBKIT
      </div>
    </Pop>
    <Pop delay={18}>
      <div style={{ fontSize: 43, lineHeight: 1.4, marginTop: 33 }}>
        Setup + prompt
        <br />
        Application review checklist
      </div>
    </Pop>
    <div style={{ marginTop: 43, fontSize: 35, color: C.muted }}>
      withhammad.com
    </div>
  </Panel>
);
