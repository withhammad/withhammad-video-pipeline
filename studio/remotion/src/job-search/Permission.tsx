import { Panel, C, Pop } from "./common";
export const Permission = () => (
  <Panel title="Check before filling.">
    <Pop>
      <div style={{ fontSize: 49, lineHeight: 1.35, marginTop: 25 }}>
        Site permission.
        <br />
        Your approval.
        <br />
        Compatible form.
      </div>
    </Pop>
    <Pop delay={18}>
      <div
        style={{
          marginTop: 45,
          padding: 28,
          borderRadius: 18,
          background: "#eadccb",
          fontSize: 41,
          lineHeight: 1.25,
        }}
      >
        Form entry can send data
        <br />
        before Submit.
      </div>
    </Pop>
    <div style={{ fontSize: 34, color: C.muted, marginTop: 26 }}>
      The workflow will not work everywhere.
    </div>
  </Panel>
);
