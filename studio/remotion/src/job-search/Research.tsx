import { Panel, Row, C, Pop } from "./common";
export const Research = () => (
  <Panel step={3} title="Check the source." illustrative>
    <Row label="EMPLOYER CAREER PAGE" value="Role + requirements" />
    <Row
      label="DATE ON THE LISTING"
      value="Missing? Mark UNKNOWN."
      delay={18}
    />
    <Pop delay={30}>
      <div
        style={{
          fontSize: 44,
          color: C.green,
          marginTop: 32,
          lineHeight: 1.25,
        }}
      >
        Keep the direct URL.
        <br />
        Confirm the role is still open.
      </div>
    </Pop>
  </Panel>
);
