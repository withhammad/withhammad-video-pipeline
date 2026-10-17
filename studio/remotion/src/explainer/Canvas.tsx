import { AbsoluteFill, useCurrentFrame } from "remotion";
import { H, W } from "./theme";

const CELL = 80;

/** Our own soft shape (a rounded five-petal bloom), drawn huge and blurred like the reference's corner shapes. */
const Bloom: React.FC<{ size: number; x: number; y: number; rotate: number; opacity: number }> = ({ size, x, y, rotate, opacity }) => (
  <svg
    width={size}
    height={size}
    viewBox="-100 -100 200 200"
    style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `rotate(${rotate}deg)`, filter: "blur(14px)", opacity }}
  >
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx={0} cy={-46} rx={21} ry={52} fill="#6f6f74" transform={`rotate(${a})`} />
    ))}
    <circle r={26} fill="#6f6f74" />
  </svg>
);

/** The explainer canvas: white with a faint grid, "+" marks on the intersections, a soft centre light and two
 *  big blurred shapes bleeding off opposite corners. Motion is a slow drift derived from the frame number. */
export const Canvas: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const frame = useCurrentFrame();
  const spin = frame * 0.12;
  return (
    <AbsoluteFill style={{ background: "#f6f6f5", overflow: "hidden", ...style }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="xgrid" width={CELL} height={CELL} patternUnits="userSpaceOnUse" x={(W % CELL) / 2 - CELL / 2} y={-CELL / 2 + 8}>
            <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
            <path d="M -7 0 L 7 0 M 0 -7 L 0 7" stroke="rgba(0,0,0,0.16)" strokeWidth={1.4} />
            <path d={`M ${CELL - 7} ${CELL} L ${CELL + 7} ${CELL} M ${CELL} ${CELL - 7} L ${CELL} ${CELL + 7}`} stroke="rgba(0,0,0,0.16)" strokeWidth={1.4} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#xgrid)" />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(70% 46% at 50% 48%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 55%, rgba(225,225,225,0) 100%)" }} />
      <Bloom size={430} x={W - 40} y={70} rotate={18 + spin} opacity={0.5} />
      <Bloom size={470} x={30} y={H - 60} rotate={-24 - spin * 0.8} opacity={0.45} />
    </AbsoluteFill>
  );
};
