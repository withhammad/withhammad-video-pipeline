// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "The sea split in two",
// Quran ash-Shu'ara 26:63, rebuilt in knitted yarn from the reference Dc5FJDboAsg (@m_theaicreator, 13.83 s, one AI shot).
// Same flow as the reference: a calm sea, the strike at the shore on the reference's boom (1.00 s), a split racing to the
// horizon, two walls rising to full height on its second hit (7.00 s), a path to a light at the far end, a glint (13.0 s) and
// the light flooding the frame. The picture is the Blender plate (studio/blender/seaknit/build.py): one knitted blanket of a sea
// that unzips at the seam and folds up into knitted walls "like a great towering mountain", a dry knitted path, pompom spray,
// felt fish appliqued on the walls, a knitted dawn sky and a crocheted sun rising at the end of the path.
// NO PROPHET IS SHOWN in any form: the staff alone comes down from above the frame (its upper end never in shot), no hand,
// figure, silhouette or shadow; no people at all.
// Text (texts.json, checked by text.py): Quran 26:63 in two parts split at its waqf mark, quran.com text_uthmani = Tanzil
// letter for letter, in plain Amiri Quran (no COLR/CPAL), never through a filter; Sahih International English (the reference's
// caption had put the Bible's Exodus 14:16 under the ayah; corrected here). Her handle on screen all the way.
// The render is silent; finish.py lays the reference's own stereo track (wordless music, no recitation) under it.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import TX from './texts.json';
import GEOM from './geom.json';

export const FPS = 30, FRAMES = 416;          // 13.867 s (the reference track is 13.861 s)
export const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
const T_STRIKE = 1.0, T_TOWER = 7.0, T_GLINT = 13.0, T_SWAP = 3.75;
const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const pulse = (x: number, w: number) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));
const G = GEOM as {tip: number[][]; sun: number[][]; vp: number[][]};
const at = (arr: number[][], f: number) => arr[Math.max(0, Math.min(arr.length - 1, f))];

const hx = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
export const shadowFor = (d = 0) => `0 2px 3px #0B0620${hx(230 * (1 - d))}, 0 4px 14px #0B0620${hx(176 * (1 - d))}, 0 0 30px #0B0620${hx(102 * (1 - d))}`;
export const SHADOW = shadowFor(0);
const INK = '#3A1F3E';                       // the text colour once the light floods the frame (dark plum on cream)
const GOLD = '#FFD978';

export const Handle: React.FC<{top: number; scale?: number; dark?: number}> = ({top, scale = 1, dark = 0}) => (
  <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', zIndex: 6}}>
    <span style={{display: 'inline-block', fontFamily: SERIF, fontStyle: 'italic', fontSize: 34 * scale, color: mixHex('#FFF1DA', INK, dark), letterSpacing: 1,
      paddingBottom: 5 * scale, borderBottom: `${3 * scale}px dashed ${mixHex('#E9B755', '#B07A22', dark)}`, textShadow: shadowFor(dark)}}>@heal.ingthroughquran</span>
  </div>
);

// one Arabic line: words in spans (colour only, never a filter); the waqf mark stays in the span of the word before it
const ArLine: React.FC<{text: string; size: number; gold: (k: number) => number; end?: string; dark?: number}> = ({text, size, gold, end, dark = 0}) => {
  const raw = text.split(' ');
  const words: string[] = [];
  raw.forEach((w) => { if (w === 'ۖ' && words.length) words[words.length - 1] += ' ' + w; else words.push(w); });
  const base = mixHex('#FFF8EA', INK, dark), sh = shadowFor(dark);
  return <div dir="rtl" style={{fontFamily: AR, fontSize: size, lineHeight: 1.95, textAlign: 'center', color: base, textShadow: sh}}>
    {words.map((w, k) => {
      const g = gold(k) * (1 - dark);
      return <React.Fragment key={k}>
        <span style={{whiteSpace: 'nowrap', color: g > 0 ? mixHex(base, GOLD, g) : base, textShadow: g > 0 ? `${sh}, 0 0 ${22 * g}px #FFC24Acc` : sh}}>{w}</span>
        {k < words.length - 1 ? ' ' : null}
      </React.Fragment>;
    })}
    {end ? <span style={{whiteSpace: 'nowrap', fontSize: size * 0.92, marginRight: size * 0.22, color: mixHex('#FFE7B0', '#8A5A1A', dark)}}>{' ' + end}</span> : null}
  </div>;
};

const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [A, B] = [p(a), p(b)];
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * c01(t)).toString(16).padStart(2, '0')).join('');
};

export const AYAH_TOP = 292, REF_TOP = 1420;
const Ayah: React.FC<{t: number; dark: number}> = ({t, dark}) => {
  const out1 = ease((t - T_SWAP) / 0.35), in2 = ease((t - T_SWAP - 0.2) / 0.45);
  const strike = pulse(t - T_STRIKE + 0.05, 1.3);
  const tower = ease((t - T_TOWER + 0.15) / 0.6);
  const enc = mixHex('#FFF3E0', INK, dark);
  const en: React.CSSProperties = {fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, lineHeight: 1.18, color: enc, textShadow: shadowFor(dark),
    textAlign: 'center', padding: '0 70px', marginTop: 6};
  return <div style={{position: 'absolute', top: AYAH_TOP, left: 0, right: 0}}>
    {out1 < 1 ? <div style={{position: 'absolute', left: 40, right: 40, opacity: 1 - out1, transform: `translateY(${-14 * out1}px)`}}>
      <ArLine text={TX.ar1} size={62} gold={(k) => (k >= 4 ? strike : 0)} dark={dark}/>
      <div style={en}>{TX.en1}</div>
    </div> : null}
    {in2 > 0 ? <div style={{position: 'absolute', left: 40, right: 40, opacity: in2, transform: `translateY(${12 * (1 - in2)}px)`}}>
      <ArLine text={TX.ar2} size={62} gold={(k) => (k >= 4 ? tower : 0)} end={TX.end} dark={dark}/>
      <div style={en}>
        {TX.en2.split('like a great towering mountain')[0]}
        <span style={{color: mixHex(enc, dark > 0 ? '#9A5E12' : GOLD, tower), textShadow: tower > 0 && dark < 1 ? `${shadowFor(dark)}, 0 0 ${18 * tower * (1 - dark)}px #FFC24A99` : shadowFor(dark)}}>like a great towering mountain</span>
        {TX.en2.split('like a great towering mountain')[1]}
      </div>
    </div> : null}
  </div>;
};

export const Scrim: React.FC<{k?: number}> = ({k = 1}) => <AbsoluteFill style={{
  background: `linear-gradient(180deg, #170C2E00 0px, #170C2E${Math.round(150 * k).toString(16).padStart(2, '0')} 230px, `
    + `#170C2E${Math.round(120 * k).toString(16).padStart(2, '0')} 560px, #170C2E00 820px)`}}/>;

// the light at the end of the path: a four-point glint and a warm bloom that floods the frame (the reference whites out)
const Light: React.FC<{f: number; t: number}> = ({f, t}) => {
  const [sx, sy] = at(G.sun, f);
  const [vx, vy] = at(G.vp, f);
  const x = (sx + vx) / 2, y = Math.min(sy, vy + 6);
  const glow = ease((t - 11.6) / 1.4);
  const glint = pulse(t - T_GLINT + 0.12, 0.75);
  const flood = Math.pow(c01((t - 13.08) / 0.78), 1.6);
  if (glow <= 0) return null;
  return <>
    <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(circle at ${x}px ${y}px, #FFE6B0${Math.round(230 * glow).toString(16).padStart(2, '0')} 0px, #FFC98A${Math.round(120 * glow).toString(16).padStart(2, '0')} ${40 + 60 * glow}px, #FFB07000 ${260 + 140 * glow}px)`}}/>
    {glint > 0 ? <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id="gl"><stop offset="0" stopColor="#FFFFFF"/><stop offset="0.35" stopColor="#FFF2CC" stopOpacity="0.9"/><stop offset="1" stopColor="#FFD58A" stopOpacity="0"/></radialGradient>
        <linearGradient id="rayh" x1="0" x2="1"><stop offset="0" stopColor="#FFF4D6" stopOpacity="0"/><stop offset="0.5" stopColor="#FFFFFF"/><stop offset="1" stopColor="#FFF4D6" stopOpacity="0"/></linearGradient>
        <linearGradient id="rayv" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#FFF4D6" stopOpacity="0"/><stop offset="0.5" stopColor="#FFFFFF"/><stop offset="1" stopColor="#FFF4D6" stopOpacity="0"/></linearGradient>
      </defs>
      <g opacity={glint} transform={`translate(${x} ${y}) rotate(${8 * (t - T_GLINT)})`}>
        <circle r={70 * (0.6 + 0.4 * glint)} fill="url(#gl)"/>
        <rect x={-420 * glint} y={-3} width={840 * glint} height={6} fill="url(#rayh)"/>
        <rect x={-3} y={-260 * glint} width={6} height={520 * glint} fill="url(#rayv)"/>
        <g transform="rotate(45)" opacity={0.55}>
          <rect x={-150 * glint} y={-2} width={300 * glint} height={4} fill="url(#rayh)"/>
          <rect x={-2} y={-150 * glint} width={4} height={300 * glint} fill="url(#rayv)"/>
        </g>
      </g>
    </svg> : null}
    {flood > 0 ? <AbsoluteFill style={{background: `radial-gradient(circle at ${x}px ${y}px, #FFF8EC${Math.round(255 * Math.min(1, flood * 1.1)).toString(16).padStart(2, '0')} 0px, #FFF3E2${Math.round(235 * flood).toString(16).padStart(2, '0')} ${300 + 900 * flood}px, #FFEFDC${Math.round(200 * flood).toString(16).padStart(2, '0')} 1500px)`}}/> : null}
  </>;
};

// the strike: a flash where the staff meets the water, on the boom
const Strike: React.FC<{f: number; t: number}> = ({f, t}) => {
  const p = pulse(t - T_STRIKE + 0.02, 0.6);
  if (p <= 0) return null;
  const [x, y] = at(G.tip, Math.round(T_STRIKE * FPS));
  return <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(ellipse ${260 + 220 * p}px ${120 + 90 * p}px at ${x}px ${y}px, #FFF6DD${Math.round(220 * p).toString(16).padStart(2, '0')} 0%, #BFF3EE${Math.round(90 * p).toString(16).padStart(2, '0')} 45%, #BFF3EE00 100%)`}}/>;
};

export const SeaKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const flood = Math.pow(c01((t - 13.08) / 0.78), 1.6);
  const dark = c01((flood - 0.04) / 0.22);
  return <AbsoluteFill style={{background: '#1A1030', overflow: 'hidden'}}>
    <Img src={staticFile(`blender/f${String(f).padStart(4, '0')}.jpg`)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    <Strike f={f} t={t}/>
    <Light f={f} t={t}/>
    <Scrim k={1 - flood}/>
    <Handle top={232} dark={dark}/>
    <Ayah t={t} dark={dark}/>
    <div style={{position: 'absolute', top: REF_TOP, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 30,
      color: mixHex('#FFF1DA', INK, dark), textShadow: shadowFor(dark), letterSpacing: 0.6}}>{TX.ref}</div>
  </AbsoluteFill>;
};
