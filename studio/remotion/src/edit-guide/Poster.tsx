// Post 1: "How to Edit Videos with Claude Code" — 10 step cards round a phone playing one of Hammad's reels.
// Same layout and flow as the reference infographic (charlie-hills, 25 Oct 2026); every line is our own wording and
// describes the pipeline this repo actually runs (studio/app/tighten.py caps, video-sound levels, video-check).
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {BLUE, Burst, BRAND, GridPaper, INK, Logo, MONO, MUTED, SANS} from './ui';

const W = 1440;
const H = 1800;

type Tint = {solid: string; bg: string; line: string};
const tint = (solid: string, bg: string, line: string): Tint => ({solid, bg, line});
const C = {
  blue: tint('#1f6bff', '#f1f6ff', '#c9dbff'),
  indigo: tint('#5b5bd6', '#f5f5ff', '#d9d9f6'),
  purple: tint('#a347e8', '#fbf5ff', '#ead4fb'),
  pink: tint('#e5484d', '#fff6f6', '#f8d3d4'),
  red: tint('#ec3b2f', '#fff6f4', '#f8d1cc'),
  orange: tint('#f0731a', '#fff8f1', '#fadcbf'),
  green: tint('#16a34a', '#f3fbf5', '#c8ebd3'),
  teal: tint('#127fa3', '#f1f9fc', '#c4e4ef'),
  violet: tint('#5046e5', '#f5f5ff', '#d6d4fa'),
  coral: tint('#e2603f', '#fff7f3', '#f8d6c9'),
};

const Tag: React.FC<{n: number; label: string; t: Tint}> = ({n, label, t}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, background: t.solid, color: 'white',
    borderRadius: 12, padding: '7px 16px 7px 8px', fontFamily: SANS, fontWeight: 600, fontSize: 25,
    boxShadow: `0 4px 14px ${t.solid}40`}}>
    <span style={{background: 'rgba(255,255,255,0.25)', borderRadius: 7, padding: '1px 7px', fontFamily: MONO,
      fontSize: 18, fontWeight: 700}}>{String(n).padStart(2, '0')}</span>
    {label}
  </div>
);

const Why: React.FC<{t: Tint; children: React.ReactNode}> = ({t, children}) => (
  <div style={{display: 'flex', gap: 14, alignItems: 'flex-start', borderTop: `2px solid ${t.line}`, paddingTop: 12,
    marginTop: 'auto'}}>
    <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, color: t.solid, background: `${t.solid}14`,
      borderRadius: 6, padding: '4px 8px', letterSpacing: 1.5, marginTop: 2}}>WHY</span>
    <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 21, color: INK, lineHeight: 1.28}}>{children}</span>
  </div>
);

const Card: React.FC<{n: number; tag: string; t: Tint; x: number; y: number; w: number; h: number;
  tagSide?: 'left' | 'center' | 'right'; title: string; why: React.ReactNode; children: React.ReactNode}> =
  ({n, tag, t, x, y, w, h, tagSide = 'left', title, why, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${t.bg}, #ffffff 70%)`,
      border: `2px solid ${t.line}`, borderRadius: 26, boxShadow: '0 10px 30px rgba(20,30,60,0.06)',
      padding: '42px 24px 18px', display: 'flex', flexDirection: 'column', gap: 11, boxSizing: 'border-box'}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 28.5, color: INK, letterSpacing: -0.6, whiteSpace: 'nowrap'}}>{title}</div>
      {children}
      <Why t={t}>{why}</Why>
    </div>
    <div style={{position: 'absolute', top: -20,
      ...(tagSide === 'left' ? {left: 22} : tagSide === 'right' ? {right: 22} : {left: 0, right: 0, display: 'flex', justifyContent: 'center'})}}>
      <Tag n={n} label={tag} t={t}/>
    </div>
  </div>
);

const Body: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: SANS, fontWeight: 400, fontSize: 21, color: MUTED, lineHeight: 1.34}}>{children}</div>
);
const B: React.FC<{children: React.ReactNode}> = ({children}) => <b style={{color: INK, fontWeight: 600}}>{children}</b>;

const Chip: React.FC<{t: Tint; children: React.ReactNode; mono?: boolean}> = ({t, children, mono = true}) => (
  <span style={{display: 'inline-block', border: `2px solid ${t.line}`, background: `${t.solid}0d`, color: t.solid,
    borderRadius: 10, padding: '3px 10px', fontFamily: mono ? MONO : SANS, fontWeight: 500, fontSize: 17, whiteSpace: 'nowrap'}}>{children}</span>
);

const Cmd: React.FC<{icon: string; children: React.ReactNode}> = ({icon, children}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 9, background: '#f4f5f8', border: '1.5px solid #e6e8ee',
    borderRadius: 9, padding: '5px 8px'}}>
    <Logo name={icon} color={BRAND[icon]} size={19}/>
    <span style={{fontFamily: MONO, fontSize: 14.6, color: INK, whiteSpace: 'nowrap'}}>{children}</span>
  </div>
);

const PromptBox: React.FC<{text: string; t: Tint}> = ({text, t}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid #e4e6ec',
    borderRadius: 40, padding: '10px 10px 10px 22px', background: 'white'}}>
    <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 23, color: INK}}>{text}</span>
    <span style={{width: 40, height: 40, borderRadius: 20, background: t.solid, color: 'white', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, fontFamily: SANS}}>↑</span>
  </div>
);

const FileIcon: React.FC<{t: Tint}> = ({t}) => (
  <span style={{display: 'inline-block', width: 22, height: 28, border: `2.5px solid ${t.solid}`, borderRadius: 5,
    position: 'relative', flexShrink: 0}}>
    <span style={{position: 'absolute', left: 4, right: 4, top: 8, height: 2.5, background: t.solid}}/>
    <span style={{position: 'absolute', left: 4, right: 7, top: 14, height: 2.5, background: t.solid}}/>
  </span>
);

// Folder tree for card 02.
const TREE: [string, string][] = [
  ['raw-take.mp4', 'one take, mistakes fine'],
  ['refs/', 'reels you rate'],
  ['best.mp4', 'the edit to beat'],
  ['style.md', 'fonts, colours, captions'],
  ['beats.md', 'hook, pace, layouts'],
  ['rules.md', 'every note you give'],
];

// An arrow drawn as a polyline with a head, plus a dot that travels along it once per loop.
const Arrow: React.FC<{pts: [number, number][]; color: string; dots?: number[]}> = ({pts, color, dots = []}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  const at = (d: number): [number, number] => {
    let rest = d;
    for (let i = 0; i < segs.length; i++) {
      if (rest <= segs[i]) {
        const k = rest / segs[i];
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
      }
      rest -= segs[i];
    }
    return pts[pts.length - 1];
  };
  const [ex, ey] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  const ang = Math.atan2(ey - py, ex - px);
  const hl = 16;
  const head = `${ex},${ey} ${ex - hl * Math.cos(ang - 0.45)},${ey - hl * Math.sin(ang - 0.45)} ${ex - hl * Math.cos(ang + 0.45)},${ey - hl * Math.sin(ang + 0.45)}`;
  const travel = at(((frame / durationInFrames) % 1) * total);
  return (
    <g>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={3.5}
        strokeLinejoin="round" strokeLinecap="round"/>
      <polygon points={head} fill={color}/>
      {dots.map((d) => {
        const [x, y] = at(d * total);
        return <circle key={d} cx={x} cy={y} r={6.5} fill={color}/>;
      })}
      <circle cx={travel[0]} cy={travel[1]} r={7} fill="white" stroke={color} strokeWidth={3.5}/>
    </g>
  );
};

// Heart, comment, share, save (outline icons, our own paths).
const IG_ICONS = [
  'M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z',
  'M20.5 11.5a8.5 8.5 0 1 1-3.4-6.8 8.5 8.5 0 0 1 3.4 6.8zM20.5 20.5l-2.6-2.4',
  'M21.5 3.5 10 13M21.5 3.5 14.5 21l-4.5-8-8-4.5z',
  'M18 21l-6-4.5L6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5z',
];

// Phone frame showing a reel with the Instagram reel UI on top.
export const PhoneReel: React.FC<{x: number; y: number; w: number; src: string; handle: string; caption: string;
  scale?: number}> = ({x, y, w, src, handle, caption, scale = 1}) => {
  const h = (w * 16) / 9;
  const s = scale;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w + 16 * s, height: h + 16 * s, borderRadius: 54 * s,
      background: '#fdfdfe', border: `${2 * s}px solid #dfe2e8`, boxShadow: `0 ${24 * s}px ${60 * s}px rgba(20,30,60,0.18)`,
      padding: 8 * s, boxSizing: 'border-box'}}>
      <div style={{position: 'relative', width: w, height: h, borderRadius: 46 * s, overflow: 'hidden', background: '#000'}}>
        <Video src={staticFile(src)} muted loop style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
        {/* status bar */}
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 44 * s, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', padding: `0 ${30 * s}px`, color: 'white',
          fontFamily: SANS, fontWeight: 600, fontSize: 17 * s, textShadow: '0 1px 3px rgba(0,0,0,0.6)'}}>
          <span>9:41</span>
          <span style={{display: 'flex', gap: 5 * s, alignItems: 'flex-end'}}>
            {[6, 9, 12, 15].map((b) => <span key={b} style={{width: 3.5 * s, height: b * s * 0.8, background: 'white', borderRadius: 1}}/>)}
            <span style={{width: 26 * s, height: 12 * s, border: `${1.5 * s}px solid white`, borderRadius: 4 * s, marginLeft: 6 * s,
              display: 'inline-flex', padding: 1.5 * s, boxSizing: 'border-box'}}><span style={{flex: 0.8, background: 'white', borderRadius: 2}}/></span>
          </span>
        </div>
        {/* bottom scrim + reel UI */}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 * s,
          background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.6))'}}/>
        <div style={{position: 'absolute', left: 16 * s, right: 64 * s, bottom: 18 * s, color: 'white', fontFamily: SANS,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 9 * s}}>
            <Img src={staticFile('edit-guide/hammad_avatar.jpg')} style={{width: 30 * s, height: 30 * s, borderRadius: 15 * s,
              border: `${1.5 * s}px solid white`}}/>
            <span style={{fontWeight: 700, fontSize: 16 * s}}>{handle}</span>
            <span style={{border: `${1.5 * s}px solid rgba(255,255,255,0.9)`, borderRadius: 8 * s, padding: `${2 * s}px ${10 * s}px`,
              fontWeight: 600, fontSize: 14 * s}}>Follow</span>
          </div>
          <div style={{fontSize: 14.5 * s, marginTop: 8 * s, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{caption}</div>
          <div style={{fontSize: 13 * s, marginTop: 5 * s, opacity: 0.9}}>♫ {handle} · Original audio</div>
        </div>
        <div style={{position: 'absolute', right: 14 * s, bottom: 22 * s, display: 'flex', flexDirection: 'column',
          gap: 20 * s, alignItems: 'center'}}>
          {IG_ICONS.map((d, i) => (
            <svg key={i} width={26 * s} height={26 * s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}
              strokeLinejoin="round" strokeLinecap="round" style={{filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'}}>
              <path d={d}/>
            </svg>
          ))}
          <span style={{color: 'white', fontSize: 15 * s, fontFamily: SANS, fontWeight: 700, letterSpacing: 1}}>•••</span>
          <Img src={staticFile('edit-guide/hammad_avatar.jpg')} style={{width: 28 * s, height: 28 * s, borderRadius: 7 * s,
            border: `${1.5 * s}px solid white`}}/>
        </div>
      </div>
    </div>
  );
};

export const BOARD = {W, H};

// The whole infographic on its 1440x1800 board; Poster shows it at 0.75, Tour moves a camera over it.
export const Board: React.FC<{style?: React.CSSProperties}> = ({style}) => {
  return (
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', ...style}}>
        <GridPaper/>
        <Burst x={1150} y={-90} size={420} opacity={0.16}/>

        {/* header */}
        <div style={{position: 'absolute', top: 38, left: 0, right: 0, textAlign: 'center', fontFamily: SANS,
          fontWeight: 800, fontSize: 82, letterSpacing: -3.6, color: INK}}>
          How to <span style={{color: BLUE}}>Edit Videos</span> with Claude Code
        </div>
        <div style={{position: 'absolute', top: 152, left: 0, right: 0, display: 'flex', justifyContent: 'center',
          alignItems: 'center', gap: 18, fontFamily: SANS, fontSize: 31}}>
          <span style={{color: INK, fontWeight: 600}}>Record one take, post a finished reel.</span>
          <span style={{color: MUTED}}>10 steps + what to type.</span>
          <Img src={staticFile('edit-guide/hammad_avatar.jpg')} style={{width: 54, height: 54, borderRadius: 27,
            border: '3px solid white', boxShadow: '0 3px 10px rgba(0,0,0,0.15)'}}/>
          <span style={{color: INK, fontWeight: 600}}>Hammad Yousuf</span>
        </div>

        {/* arrows into the phone */}
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Arrow pts={[[720, 622], [720, 668]]} color={C.indigo.solid}/>
          <Arrow pts={[[430, 455], [440, 455], [440, 770], [508, 770]]} color={C.blue.solid} dots={[0.05]}/>
          <Arrow pts={[[1012, 445], [998, 445], [998, 770], [930, 770]]} color={C.purple.solid} dots={[0.04]}/>
          <Arrow pts={[[428, 858], [508, 858]]} color={C.pink.solid}/>
          <Arrow pts={[[1012, 826], [930, 826]]} color={C.red.solid}/>
          <Arrow pts={[[428, 1210], [508, 1210]]} color={C.orange.solid}/>
          <Arrow pts={[[1012, 1202], [930, 1202]]} color={C.green.solid}/>
          <Arrow pts={[[428, 1590], [440, 1590], [440, 1292], [508, 1292]]} color={C.teal.solid} dots={[0.04]}/>
          <Arrow pts={[[1012, 1590], [998, 1590], [998, 1292], [930, 1292]]} color={C.violet.solid} dots={[0.04]}/>
          <Arrow pts={[[720, 1462], [720, 1400]]} color={C.coral.solid}/>
        </svg>

        <PhoneReel x={512} y={676} w={400} src="edit-guide/kimi-10s.mp4" handle="with.hammad"
          caption="Kimi K3 on 8 GB RAM, no GPU. Edited in Claude Code"/>

        <Card n={1} tag="Install" t={C.blue} x={26} y={268} w={400} h={404} title="Set up the toolkit once"
          why={<>Install once, reuse it.</>}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
            <Cmd icon="si-claude">curl -fsSL claude.ai/install.sh | bash</Cmd>
            <Cmd icon="si-homebrew">brew install ffmpeg node</Cmd>
            <Cmd icon="si-openai">pip install openai-whisper</Cmd>
            <Cmd icon="si-opencv">pip install opencv-python</Cmd>
            <Cmd icon="si-npm">npx create-video@latest</Cmd>
          </div>
          <Body>Or <B>paste the prompt</B> and Claude installs what's missing.</Body>
        </Card>

        <Card n={2} tag="Your folder" t={C.indigo} x={474} y={268} w={492} h={346} tagSide="center"
          title="One folder per video" why={<>Claude reads it before any cut.</>}>
          <div style={{background: '#f4f5f8', borderRadius: 14, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 3}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 18}}>
              <span style={{color: C.indigo.solid, fontWeight: 700}}>▰ my-reel/</span>
              <span style={{fontFamily: SANS, color: MUTED, fontSize: 16.5}}>(read first, every time)</span>
            </div>
            {TREE.map(([f, d], i) => (
              <div key={f} style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 17.5, color: INK}}>
                <span><span style={{color: '#b5bac6'}}>{i === TREE.length - 1 ? '└ ' : '├ '}</span>{f}</span>
                <span style={{fontFamily: SANS, color: MUTED, fontSize: 16.5}}>{d}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card n={3} tag="Style" t={C.purple} x={1014} y={268} w={400} h={346} tagSide="right"
          title="Show it reels you rate" why={<>Every edit starts from a look you chose.</>}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 21, color: INK}}>
            <FileIcon t={C.purple}/>refs/
          </div>
          <div style={{display: 'flex', gap: 8}}>
            <Chip t={C.purple}>hook</Chip><Chip t={C.purple}>pace</Chip><Chip t={C.purple}>layouts</Chip>
          </div>
          <Body>Add 2-3 reels you like. Claude logs their <B>hook, pace and layouts</B> in beats.md.</Body>
        </Card>

        <Card n={4} tag="Cut" t={C.pink} x={26} y={706} w={400} h={304} title="It trims the dead air"
          why={<>Snappy pace, no clipped words.</>}>
          <div><Chip t={C.pink} mono={false}>Pauses ≤ 0.22 s</Chip></div>
          <Body>Whisper stamps every word. <B>Silences and retakes get cut</B>, never a word.</Body>
        </Card>

        <Card n={5} tag="Frame" t={C.red} x={1014} y={652} w={400} h={350} tagSide="right"
          title="It keeps you in frame" why={<>No head cut off in the 9:16 crop.</>}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #e6e8ee', borderRadius: 10,
            padding: '6px 12px', alignSelf: 'flex-start', background: 'white'}}>
            <Logo name="si-opencv" color={BRAND['si-opencv']} size={22}/>
            <span style={{fontFamily: MONO, fontSize: 19, color: INK}}>OpenCV</span>
          </div>
          <Body>OpenCV finds your face in each frame and <B>reframes round it</B>. No jumps, no drift.</Body>
        </Card>

        <Card n={6} tag="Storyboard" t={C.orange} x={26} y={1040} w={400} h={330}
          title="Sign off a storyboard" why={<>Fix the plan, not a full render.</>}>
          <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
            {['#bcd2ff', '#dcc8fb', '#ffd7a8', '#bfe8cc'].map((c) => (
              <div key={c} style={{width: 34, height: 52, borderRadius: 8, border: '1.5px solid #dfe2e8', background: '#f4f5f8',
                position: 'relative', overflow: 'hidden'}}>
                <div style={{position: 'absolute', left: 4, right: 4, top: 4, height: 16, borderRadius: 3, background: c}}/>
                <div style={{position: 'absolute', left: 9, width: 16, height: 16, borderRadius: 8, bottom: 9, background: '#9aa1ae'}}/>
                <div style={{position: 'absolute', left: 5, right: 5, height: 10, borderRadius: '8px 8px 0 0', bottom: 0, background: '#9aa1ae'}}/>
              </div>
            ))}
            <span style={{marginLeft: 6, background: C.orange.solid, color: 'white', borderRadius: 18, padding: '6px 14px',
              fontFamily: SANS, fontWeight: 700, fontSize: 19}}>Approve ✓</span>
          </div>
          <Body>One still per beat. <B>Nothing renders until you say go.</B></Body>
        </Card>

        <Card n={7} tag="Graphics" t={C.green} x={1014} y={1036} w={400} h={334} tagSide="right"
          title="Motion on every word" why={<>New visuals before attention drops.</>}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #e6e8ee', borderRadius: 10,
            padding: '6px 12px', alignSelf: 'flex-start', background: 'white'}}>
            <Img src={staticFile('edit-guide/remotion.png')} style={{width: 22, height: 22}}/>
            <span style={{fontFamily: MONO, fontSize: 19, color: INK}}>npx remotion render</span>
          </div>
          <Body>A fresh graphic every 2-3 s, <B>built in React and timed to the exact word</B>.</Body>
        </Card>

        <Card n={8} tag="Captions + music" t={C.teal} x={26} y={1404} w={400} h={374}
          title="Captions, then music" why={<>Reads on mute, voice stays clear.</>}>
          <div style={{display: 'flex', gap: 8}}>
            <Chip t={C.teal}>1-3 words</Chip><Chip t={C.teal}>-12 dB bed</Chip><Chip t={C.teal}>-14 LUFS</Chip>
          </div>
          <Body>Short caption chunks <B>above your chin, never on it</B>. Music sits 12 dB under the voice.</Body>
        </Card>

        <Card n={10} tag="Skill" t={C.coral} x={474} y={1482} w={492} h={296} tagSide="center"
          title="Your notes become a skill" why={<>Every video needs fewer notes.</>}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <FileIcon t={C.coral}/>
            <span style={{fontFamily: MONO, fontSize: 21, color: INK, fontWeight: 700}}>rules.md</span>
            <span style={{fontFamily: SANS, fontSize: 19, color: MUTED}}>turns into</span>
            <span style={{background: C.coral.solid, color: 'white', borderRadius: 9, padding: '4px 12px',
              fontFamily: MONO, fontSize: 18, fontWeight: 700}}>SKILL.md</span>
          </div>
          <Body>Each note lands in rules.md. After edit one, type <B>"Save this workflow as a skill."</B></Body>
        </Card>

        <Card n={9} tag="Checking" t={C.violet} x={1014} y={1404} w={400} h={374} tagSide="right"
          title="It grades its own cut" why={<>You only watch a cut that passed.</>}>
          <PromptBox text={'"Check every frame."'} t={C.violet}/>
          <Body>A still every 0.25 s, then <B>safe-zone and loudness checks</B>. Anything off gets re-rendered.</Body>
        </Card>
      </div>
  );
};

export const Poster: React.FC = () => (
  <AbsoluteFill style={{background: '#f7f8fb'}}>
    <Board style={{scale: '0.75'}}/>
  </AbsoluteFill>
);
