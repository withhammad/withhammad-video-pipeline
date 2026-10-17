import { interpolate, spring, useCurrentFrame } from "remotion";
import { Box, clamp, FPS, SANS, toFrame, toMs } from "./theme";
import type { Item } from "./types";

const ORANGE = "#d9775a";

/** Our own simple line icons, picked by index. */
const ICONS = [
  "M5 4h10l4 4v12H5z M15 4v4h4", // doc
  "M4 6h16v12H4z M4 15l5-5 4 4 3-3 4 4", // image
  "M6 6l12 12 M18 6L6 18 M4 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0", // cut
  "M4 5h16v10H9l-5 4z", // comment
  "M4 6h16v14H4z M4 10h16 M9 3v5 M15 3v5", // calendar
  "M4 20V10 M10 20V4 M16 20v-7 M22 20H2", // bars
  "M3 12h4l3-7 4 14 3-7h4", // pulse
  "M8 3h8v18H8z M11 18h2", // phone
  "M10 4a6 6 0 1 0 0 12a6 6 0 1 0 0-12 M15 15l5 5", // search
  "M5 6h14 M5 12h14 M5 18h9", // list
  "M4 12l5 5L20 6", // check
];

/** Light card on the canvas: tiles pop in one by one (up to 120 ms stagger, all in by ~35% of the scene so the full
 *  grid is up long enough to read), then the card flushes pale pink. */
export const TextCard: React.FC<{ box: Box; items: Item[]; durMs: number }> = ({ box, items, durMs }) => {
  const frame = useCurrentFrame();
  const ms = toMs(frame);
  const enter = interpolate(ms, [-40, 300], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  // 120 ms stagger like the reference, tightened so every tile is in by ~35% of a short scene.
  const first = 80;
  const stagger = Math.min(120, Math.max(30, (durMs * 0.35 - first) / Math.max(1, items.length)));
  const doneMs = first + items.length * stagger + 300;
  const flushAt = Math.max(doneMs, durMs * 0.62);
  const flush = interpolate(ms, [flushAt, flushAt + 420], [0, 1], clamp);
  const bg = `rgb(${Math.round(241 + (251 - 241) * flush)},${Math.round(239 + (218 - 239) * flush)},${Math.round(236 + (222 - 236) * flush)})`;
  const cols = 3;
  const rows = Math.ceil(items.length / cols);
  const pad = 26;
  const cellW = (box.width - pad * 2) / cols;
  const cellH = Math.min(150, (box.height - pad * 2) / Math.max(1, rows));
  const gridTop = (box.height - cellH * rows) / 2;
  return (
    <div
      style={{
        position: "absolute", left: box.left, top: box.top, width: box.width, height: box.height, borderRadius: 24, background: bg,
        boxShadow: "0 30px 60px rgba(30,30,40,0.16), 0 4px 14px rgba(30,30,40,0.08)",
        transform: `scale(${0.88 + 0.12 * enter})`, opacity: interpolate(ms, [-40, 80], [0, 1], clamp),
      }}
    >
      {items.map((it, i) => {
        const f = toFrame(ms - (first + i * stagger));
        const sp = f >= 0 ? spring({ frame: f, fps: FPS, config: { damping: 12, stiffness: 220, mass: 0.5 } }) : 0;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const inLastRow = row === rows - 1 ? items.length - row * cols : cols;
        const offset = ((cols - inLastRow) * cellW) / 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: pad + offset + col * cellW, top: gridTop + row * cellH, width: cellW, height: cellH,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              opacity: f >= 0 ? interpolate(f, [0, 2], [0, 1], clamp) : 0, transform: `scale(${0.5 + 0.5 * sp})`,
            }}
          >
            <svg width={40} height={40} viewBox="0 0 24 24">
              <path d={ICONS[i % ICONS.length]} fill="none" stroke={ORANGE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 20, color: "#2b2b2b", letterSpacing: -0.2 }}>{it.label}</div>
            {it.sub ? <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: "#4d4d4d", textAlign: "center", lineHeight: 1.12 }}>{it.sub}</div> : null}
          </div>
        );
      })}
    </div>
  );
};
