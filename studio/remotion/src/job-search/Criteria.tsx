import { Panel, Row } from "./common";
export const Criteria = () => (
  <Panel step={2} title="Make the search specific." illustrative>
    <Row label="ATTACH" value="Sample resume.pdf" />
    <Row label="ROLE + LOCATION" value="Junior developer · Dubai" delay={12} />
    <Row label="POSTING WINDOW" value="Past 7 days · verify dates" delay={24} />
  </Panel>
);
