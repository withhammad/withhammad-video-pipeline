import React from "react";
import { Video } from "@remotion/media";
import { staticFile, useVideoConfig, useCurrentFrame } from "remotion";
import { Panel, Pop, C } from "./common";
export const Connect: React.FC<{ docsVideo?: string }> = ({
  docsVideo = "",
}) => {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();
  return (
    <Panel step={1} title="Connect the browser.">
      <div style={{ fontSize: 40, marginBottom: 26 }}>
        Claude + Microsoft Playwright
      </div>
      {docsVideo ? (
        <div
          style={{
            height: 550,
            overflow: "hidden",
            border: "2px solid " + C.line,
            borderRadius: 16,
            position: "relative",
          }}
        >
          <Video
            src={staticFile(docsVideo)}
            muted
            premountFor={fps}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        </div>
      ) : (
        <Pop>
          <div
            style={{
              background: "#fffaf1",
              padding: 34,
              borderRadius: 20,
              border: "2px solid " + C.line,
              fontSize: 43,
              lineHeight: 1.4,
            }}
          >
            Official MCP package
            <br />
            <span style={{ color: C.green }}>
              Browser navigation + form tools
            </span>
          </div>
        </Pop>
      )}
      <div style={{ fontSize: 25, color: C.muted, marginTop: 14 }}>
        Official documentation · github.com/microsoft
      </div>
      <div
        style={{
          marginTop: 26,
          fontSize: 34,
          color: f > fps * 3 ? C.accent : C.ink,
        }}
      >
        Open-source tool. Claude usage is separate.
      </div>
    </Panel>
  );
};
