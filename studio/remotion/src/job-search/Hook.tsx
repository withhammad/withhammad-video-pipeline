import { Panel, Pop, C } from "./common";
export const Hook = () => (
  <Panel
    title="Too many tabs.
No clear shortlist."
  >
    <Pop>
      <div
        style={{ fontSize: 47, lineHeight: 1.3, color: C.muted, marginTop: 32 }}
      >
        A five-step job-search
        <br />
        workflow with Claude.
      </div>
    </Pop>
    <Pop delay={20}>
      <div
        style={{
          marginTop: 58,
          padding: 32,
          background: C.green,
          color: "#fff9ec",
          borderRadius: 20,
          fontSize: 49,
          fontFamily: "JobSerif",
          fontWeight: 700,
        }}
      >
        Research → Match → Draft
      </div>
    </Pop>
    <Pop delay={36}>
      <div style={{ marginTop: 34, fontSize: 40 }}>
        You control the submission.
      </div>
    </Pop>
  </Panel>
);
