// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Say it 10 times"
// (reference DfOTKmjIIU2 by @sabbih.ar, 51.23 s, job bbf1e88c3f85) rebuilt as real 3D knitwork. Same flow on the reference
// clock, measured frame by frame: the dhikr on top, a bead string that slides one bead per count (the counter steps on frames
// 58 + 150 k), the counted bead changes colour, a ring counter fills to 10, «taqabbal Allah» at 10, an end card.
// The picture is a Blender plate (studio/blender/tahlilknit/build.py, EEVEE): a knitted wall that knits itself in, a felted
// plaque, a three-ply cord with felted beads that are dyed one colour per count, an embroidery hoop whose rim is wrapped in a new
// colour of yarn on every count, pompoms pulled into the hoop at the start and bursting out of it at 10, and a knitted heart in
// the hoop for the end card. This layer adds only text (HarfBuzz-shaped in Chrome; Arabic never drawn in Blender): every Arabic
// string comes from texts.json (cut out of sunnah.com Sahih Muslim 2693 and checked by text.py). Each text group follows the
// plate's camera through geom.json (per-frame screen anchors exported by build.py). The render is silent; voice.py lays the
// soundtrack (the reference's blackbird song + the Lamia dhikr when its take exists).
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import TX from './texts.json';
import G from './geom.json';

export const FPS = 30, FRAMES = 1537;
export const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
export const ROUND = '"Arial Rounded MT Bold", "Helvetica Rounded", sans-serif';     // chunky numerals that read as couched yarn
export const STEPS: number[] = G.steps;
export const END: number = G.end;
const S10 = STEPS[9];
const REF = G.plaque[60][2];            // px per world unit on the plaque in the settled framing
const HREF = G.hoop[60][2];
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const springy = (x: number, k = 1) => (x <= 0 ? 0 : x * k > 1.2 ? 1 : 1 - Math.exp(-x * k * 7) * Math.cos(x * k * 11));
const pulse = (x: number, w = 0.25) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));
export const countAt = (f: number) => STEPS.filter((s) => f >= s).length;

export const PLUM = '#3B1A55', PLUM2 = '#5B2E7A', CREAM = '#FFF6E6';
export const BEAD_COLS = ['#D92E4A', '#F2A516', '#1FA36E', '#22B7B2', '#3263C9', '#9341A0', '#F26B4E', '#C9A51C', '#EC6E9A', '#5546B8'];
// thread-on-felt: the yarnAr grain and light without displacement, so every Arabic mark stays where the font puts it
export const AR_THREAD = 'url(#yarnAr) drop-shadow(0 1.5px 0 #FFFFFFAA) drop-shadow(0 3px 4px #3B1A5540)';

/** a group pinned to a point of the 3D plate: (x, y) px in the settled framing, moved and scaled with the camera */
const Pinned: React.FC<{f: number; anchor: 'plaque' | 'hoop'; cx: number; cy: number; children: React.ReactNode; style?: React.CSSProperties}> =
  ({f, anchor, cx, cy, children, style}) => {
    const a = (anchor === 'plaque' ? G.plaque : G.hoop)[Math.min(FRAMES - 1, f)];
    const s = a[2] / (anchor === 'plaque' ? REF : HREF), roll = -G.cam_roll[Math.min(FRAMES - 1, f)];
    return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${cx}px ${cy}px`,
      transform: `translate(${a[0] - cx}px, ${a[1] - cy}px) rotate(${roll}deg) scale(${s})`, ...style}}>{children}</div>;
  };

const Center: React.FC<{y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({y, children, style}) =>
  <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', ...style}}>{children}</div>;

/** the stitched divider: a running stitch with a small eight-pointed star */
const Divider: React.FC<{y: number; w?: number; col?: string}> = ({y, w = 250, col = PLUM2}) =>
  <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
    <span style={{width: w, borderTop: `3px dashed ${col}`, opacity: 0.75}}/>
    <svg width={26} height={26} viewBox="-13 -13 26 26"><rect x={-7} y={-7} width={14} height={14} fill="#E9A93B"/>
      <rect x={-7} y={-7} width={14} height={14} fill="#E9A93B" transform="rotate(45)"/><circle r={3} fill="#C4475F"/></svg>
    <span style={{width: w, borderTop: `3px dashed ${col}`, opacity: 0.75}}/>
  </div>;

/** everything printed on the felted plaque while counting: the hook (with the hadith's reward and source), the dhikr in three lines,
 * the transliteration; laid out so no glyph enters the top 220 px even at the end of the slow camera push */
const PlaqueText: React.FC<{f: number}> = ({f}) => {
  const out = 1 - c01((f - (END - 6)) / 8);
  if (out <= 0) return null;
  const last = STEPS.filter((s) => f >= s).pop() ?? -99, beat = pulse((f - last) / FPS, 0.7);
  const col = countAt(f) > 0 ? BEAD_COLS[countAt(f) - 1] : '#E9A93B';
  const glow = `drop-shadow(0 0 ${10 * beat}px ${col}${beat > 0.05 ? 'cc' : '00'})`;
  const ten = pulse((f - S10) / FPS, 1.2);
  // the opening: the hook alone, big in the middle of the plaque (clear of the top band while the camera is still close), then it
  // settles into its line as the dhikr is stitched in right to left
  const hk = ease((f - 16) / 26), body = c01((f - 30) / 12), rv = (k: number) => ease((f - 30 - 5 * k) / 14);
  return <Pinned f={f} anchor="plaque" cx={540} cy={489.65} style={{opacity: out}}>
    {/* the hook, readable from frame 0 */}
    <Center y={256 + 140 * (1 - hk)} style={{opacity: 1 - c01((f - S10 - 4) / 8), transform: `scale(${1 + 0.4 * (1 - hk)})`, transformOrigin: '50% 0'}}>
      <div style={{fontFamily: SERIF, fontSize: 72, lineHeight: 1, ...gold(f / FPS, 0.25), WebkitTextStroke: '1.5px #B8801F',
        filter: 'url(#yarn) drop-shadow(0 2px 0 #FFFFFFAA) drop-shadow(0 4px 5px #6A3A1066)'}}>Say it 10 times</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 31, lineHeight: 1.2, marginTop: 6, color: PLUM2}}>
        like freeing four souls <span style={{color: '#B8801F'}}>✦</span> Sahih Muslim 2693</div>
    </Center>
    {f >= S10 + 6 ? <Center y={250} style={{opacity: c01(springy((f - S10 - 8) / FPS, 1.4) * 3),
      transform: `translateY(${(1 - springy((f - S10 - 8) / FPS, 1.4)) * 20}px)`}}>
      <div dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: 56, lineHeight: 1.4, color: '#8A5A12', filter: AR_THREAD}}>{TX.taqabbal}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 28, lineHeight: 1.1, color: PLUM2}}>May Allah accept it from us and from you</div>
    </Center> : null}
    <div style={{filter: `${glow}`, opacity: body}}>
      {[TX.line1, TX.line2, TX.line3].map((l, k) => <Center key={k} y={360 + k * 90}>
        <span dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: 64, lineHeight: 1.45, color: PLUM, filter: AR_THREAD,
          display: 'inline-block', transform: `scale(${1 + 0.025 * beat + 0.03 * ten})`,
          clipPath: rv(k) >= 1 ? undefined : `inset(-40% 0 -40% ${100 - 100 * rv(k)}%)`}}>{l}</span>
      </Center>)}
    </div>
    <div style={{opacity: c01((f - 44) / 12)}}>
    <Divider y={636}/>
    <Center y={664}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 29, lineHeight: 1.25, color: PLUM2, margin: '0 120px'}}>
        Lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamd, wa huwa ʿalā kulli shayʾin qadīr</div>
    </Center>
    </div>
  </Pinned>;
};

/** the counter in the hoop: the count and "/ 10" stitched on the knitted cloth */
const Counter: React.FC<{f: number}> = ({f}) => {
  const n = countAt(f), last = STEPS.filter((s) => f >= s).pop() ?? -99;
  const inn = c01((f - 22) / 10), out = 1 - c01((f - END) / 8);
  if (inn <= 0 || out <= 0) return null;
  const pop = 1 + 0.22 * pulse((f - last) / FPS, 0.32) + 0.12 * pulse((f - S10) / FPS, 0.9);
  const col = n > 0 ? BEAD_COLS[n - 1] : PLUM2;
  return <Pinned f={f} anchor="hoop" cx={540} cy={1338.76} style={{opacity: inn * out}}>
    <div style={{position: 'absolute', left: 340, width: 400, top: 1338.76 - 112, textAlign: 'center'}}>
      <div style={{fontFamily: ROUND, fontSize: 150, lineHeight: 1.05, color: PLUM, WebkitTextStroke: `3px ${PLUM}`, display: 'inline-block',
        transform: `scale(${pop})`, filter: `url(#yarn) drop-shadow(0 2px 0 #FFFFFFB0) drop-shadow(0 0 ${14 * pulse((f - last) / FPS, 0.5)}px ${col})`}}>{n}</div>
      <div style={{fontFamily: ROUND, fontSize: 34, lineHeight: 1, marginTop: 0, color: PLUM2}}>/ 10</div>
    </div>
  </Pinned>;
};

/** the handle on a felt tag just under the plaque (inside every safe zone), in from frame 0, out for the end card */
const Under: React.FC<{f: number}> = ({f}) => {
  const h = c01((f - 4) / 8) * (1 - c01((f - (END - 6)) / 8));
  if (h <= 0) return null;
  return <Pinned f={f} anchor="plaque" cx={540} cy={489.65} style={{opacity: h}}>
    <Center y={808}>
      <span style={{display: 'inline-block', padding: '5px 26px 8px', borderRadius: 34, background: '#FFF4E2F0', border: `2.5px dashed ${PLUM2}`,
        fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: PLUM, boxShadow: '0 6px 14px #3B1A5555'}}>@heal.ingthroughquran</span>
    </Center>
  </Pinned>;
};

/** the end card, printed on the plaque as the camera settles on the knitted heart */
const EndCard: React.FC<{f: number}> = ({f}) => {
  const i = c01((f - END) / 10);
  if (i <= 0) return null;
  const r = (k: number) => springy((f - END - 4 * k) / FPS, 1.5);
  return <Pinned f={f} anchor="plaque" cx={540} cy={489.65} style={{opacity: i}}>
    <Center y={346} style={{transform: `translateY(${(1 - r(0)) * 24}px)`}}>
      <div style={{fontFamily: SERIF, fontSize: 64, lineHeight: 1.05, ...gold(f / FPS, 0.3), WebkitTextStroke: '1.5px #B8801F',
        filter: 'url(#yarn) drop-shadow(0 2px 0 #FFFFFFAA) drop-shadow(0 4px 5px #6A3A1066)'}}>Don't forget us</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, lineHeight: 1.15, color: PLUM}}>in your duʿā 🤍</div>
    </Center>
    <Center y={476} style={{transform: `translateY(${(1 - r(1)) * 24}px)`, opacity: c01(r(1) * 2)}}>
      <span dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: 56, lineHeight: 1.5, color: PLUM, filter: AR_THREAD}}>{TX.dua_ask}</span>
    </Center>
    <Divider y={566} w={170}/>
    <Center y={594} style={{transform: `translateY(${(1 - r(2)) * 24}px)`, opacity: c01(r(2) * 2)}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: PLUM, borderBottom: `3px dashed #B8801F`, display: 'inline-block', paddingBottom: 4}}>
        @heal.ingthroughquran</div>
      <div style={{fontFamily: SERIF, fontSize: 28, marginTop: 10, color: PLUM2}}>Save it and say it every day</div>
    </Center>
  </Pinned>;
};

/** the burst pompoms and yarn snippets fly towards the lens, in front of the plaque: their own transparent Blender pass (fgpass) goes
 * over the text from S10 - 2 to S10 + 112 */
const Foreground: React.FC<{f: number}> = ({f}) => f >= S10 - 2 && f <= S10 + 112 ?
  <Img src={staticFile(`fg/f${String(f).padStart(4, '0')}.png`)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/> : null;

export const TahlilKnit: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#2A1840', overflow: 'hidden'}}>
    <YarnDefs/>
    <ArDefs/>
    <OffthreadVideo src={staticFile('plate.mp4')} muted style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    <PlaqueText f={f}/>
    <Counter f={f}/>
    <Under f={f}/>
    <EndCard f={f}/>
    <Foreground f={f}/>
  </AbsoluteFill>;
};
