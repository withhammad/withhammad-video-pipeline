// Post 2: the edit prompt as one code-window card with three phones playing Hammad's reels (4:5, 10 s loop).
// Same layout as the reference (charlie-hills, 23 Oct 2026); the prompt is our own, written from this repo's pipeline.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Video} from '@remotion/media';
import {BLUE, GridPaper, INK, MONO, MUTED, SANS} from './ui';

// Prompt text. Markup: <tag> blue, {{VAR}} blue bold, **bold**, ~~muted~~. Lines are hand-wrapped to the column.
const LEFT = [
  '<prompt>',
  '',
  '<goal>',
  'Edit {{RAW_TAKE}} into a finished {{SECONDS}}-second',
  'reel for {{AUDIENCE}}. One take in, one MP4 out. A',
  'plan or a storyboard alone is not done.',
  '</goal>',
  '',
  '<install>',
  '~~Check each tool first. Install only what is missing.~~',
  '- **Claude Code**: curl -fsSL https://claude.ai/',
  '  install.sh | bash',
  '- **Homebrew**: the one-line installer on brew.sh',
  '- **ffmpeg + Node**: brew install ffmpeg node',
  '- **Whisper**: pip3 install openai-whisper',
  '- **OpenCV**: pip3 install opencv-python',
  '- **Remotion**: npx create-video@latest',
  '- **Skill**: save this prompt as',
  '  .claude/skills/edit-reel/SKILL.md',
  '~~"command not found"? Open a new Terminal tab.~~',
  '</install>',
  '',
  '<folder>',
  '**my-reel/**',
  '  raw-take.mp4 ~~one take, slips are fine~~',
  '  refs/        ~~3-5 reels that beat your average~~',
  '  best.mp4     ~~the edit to beat~~',
  '  style.md     ~~fonts, colours, caption look~~',
  '  beats.md     ~~hooks, pace, layouts~~',
  '  rules.md     ~~every note, kept as a rule~~',
  'Read style.md, beats.md and rules.md first.',
  '</folder>',
  '',
  '<references>',
  '- Only reels that clearly beat your usual views.',
  '- Sample a frame a second and read the transcript.',
  '- Write down the hook, the pace and each layout.',
  '- Keep a move only if it shows up in **2+ reels**.',
  '  Add it to beats.md.',
  '</references>',
  '',
  '<workflow>',
  '1. Whisper with word timestamps on.',
  '2. Trim silences to **0.22 s** after a sentence and',
  '   **0.12 s** inside one. Never cut into a word.',
  '   Show me the cut list.',
  '3. Storyboard: one still per beat from beats.md.',
  '   **Wait for my OK** before any render.',
];
const RIGHT = [
  '4. Top half: a new graphic every 2-3 s. Bottom',
  '   half: my face. One object changes per beat.',
  '5. Each graphic lands on its word and eases out.',
  '6. Real logos and real screens only. If a page',
  '   needs my login, ask me.',
  '7. Open on a 2-line text hook from frame 0.',
  '8. Music bed **12 dB** under my voice to the end.',
  '</workflow>',
  '',
  '<checks>',
  '~~Run them. Do not just say they passed.~~',
  '- Contact sheet every **0.25 s**. Fix overlaps',
  '  and crops, then check again.',
  '- No text in the top 220 px, below y 1500, or',
  '  under the like and share buttons.',
  '- Count graphic changes against best.mp4. Fewer?',
  '  Add beats and render again.',
  '</checks>',
  '',
  '<notes>',
  'One note at a time. Each becomes a rule in rules.md.',
  '</notes>',
  '',
  '<export>',
  'H.264, 1080x1920, 30 fps, **-14 LUFS**, final.mp4.',
  '</export>',
  '',
  '<if_it_breaks>',
  '- pip3 missing: brew install python',
  '- Whisper too slow: use the "base" model',
  '- No Chrome for Remotion: npx remotion browser ensure',
  '</if_it_breaks>',
  '</prompt>',
];

const Line: React.FC<{text: string}> = ({text}) => {
  const parts: React.ReactNode[] = [];
  const re = /(<\/?[a-z_]+>|\{\{[A-Z_]+\}\}|\*\*[^*]+\*\*|~~[^~]+~~)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<span key={i++}>{text.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith('<')) parts.push(<span key={i++} style={{color: BLUE}}>{tok}</span>);
    else if (tok.startsWith('{{')) parts.push(<span key={i++} style={{color: BLUE, fontWeight: 700}}>{tok}</span>);
    else if (tok.startsWith('**')) parts.push(<span key={i++} style={{fontWeight: 700}}>{tok.slice(2, -2)}</span>);
    else parts.push(<span key={i++} style={{color: '#9aa0ab'}}>{tok.slice(2, -2)}</span>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<span key={i++}>{text.slice(last)}</span>);
  return <div style={{whiteSpace: 'pre', minHeight: 19.2}}>{parts}</div>;
};

const Col: React.FC<{lines: string[]; x: number}> = ({lines, x}) => (
  <div style={{position: 'absolute', left: x, top: 280, fontFamily: MONO, fontSize: 13.4, lineHeight: '19.2px', color: INK}}>
    {lines.map((l, i) => <Line key={i} text={l}/>)}
  </div>
);

const MiniPhone: React.FC<{src: string; label: string}> = ({src, label}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
    <div style={{width: 118, height: 206, borderRadius: 18, border: '3px solid #1b1d22', background: '#000', overflow: 'hidden',
      boxShadow: '0 8px 18px rgba(20,30,60,0.18)'}}>
      <Video src={staticFile(src)} muted loop style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
    </div>
    <div style={{fontFamily: SANS, fontSize: 13.5, fontWeight: 500, color: MUTED, textAlign: 'center', lineHeight: 1.25, width: 130}}>{label}</div>
  </div>
);

export const PromptCard: React.FC = () => (
  <AbsoluteFill style={{background: '#f7f8fb'}}>
    <GridPaper step={30}/>
    <div style={{position: 'absolute', left: 38, top: 38, width: 1004, height: 1274, background: 'white', borderRadius: 28,
      border: '1.5px solid #e3e6ec', boxShadow: '0 18px 50px rgba(20,30,60,0.10)'}}/>
    {/* window chrome */}
    {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
      <div key={c} style={{position: 'absolute', left: 60 + i * 22, top: 64, width: 14, height: 14, borderRadius: 7, background: c}}/>
    ))}
    <div style={{position: 'absolute', right: 60, top: 56, display: 'flex', alignItems: 'center', gap: 9, border: '1.5px solid #e1e4ea',
      borderRadius: 10, padding: '7px 14px', fontFamily: SANS, fontWeight: 600, fontSize: 15, color: INK,
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)'}}>
      <span style={{position: 'relative', width: 13, height: 15}}>
        <span style={{position: 'absolute', left: 3, top: 0, width: 9, height: 11, border: '1.8px solid #16181d', borderRadius: 2.5}}/>
        <span style={{position: 'absolute', left: 0, top: 3, width: 9, height: 11, border: '1.8px solid #16181d', borderRadius: 2.5, background: 'white'}}/>
      </span>
      Copy prompt
    </div>
    <div style={{position: 'absolute', left: 71, top: 98, fontFamily: MONO, fontSize: 13, letterSpacing: 2.6, color: '#7a808c'}}>
      THE EDIT PROMPT I USE · CLAUDE CODE · ZERO EDITING APPS
    </div>
    {/* title block */}
    <Img src={staticFile('edit-guide/hammad_avatar.jpg')} style={{position: 'absolute', left: 68, top: 128, width: 110, height: 110,
      borderRadius: 55, border: '4px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.18)'}}/>
    <div style={{position: 'absolute', left: 198, top: 140, fontFamily: SANS, fontWeight: 800, fontSize: 43, letterSpacing: -1.9, color: INK}}>
      How to <span style={{color: BLUE}}>Edit Videos</span> with Claude Code
    </div>
    <div style={{position: 'absolute', left: 200, top: 202, fontFamily: MONO, fontSize: 17, color: MUTED}}>
      <span style={{color: BLUE, fontWeight: 700}}>Hammad Yousuf</span> · 7 installs, then paste this once
    </div>
    <div style={{position: 'absolute', left: 38, right: 38, top: 254, height: 1.5, background: '#eceef2'}}/>
    <div style={{position: 'absolute', left: 540, top: 256, width: 1.5, height: 966, background: '#eceef2'}}/>

    <Col lines={LEFT} x={70}/>
    <Col lines={RIGHT} x={562}/>

    {/* reels card */}
    <div style={{position: 'absolute', left: 560, top: 916, width: 450, height: 286, borderRadius: 18, border: '1.5px solid #e3e6ec',
      background: '#fbfbfd', boxShadow: '0 6px 18px rgba(20,30,60,0.06)'}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 17.5, color: INK, padding: '14px 18px 10px', letterSpacing: -0.3}}>
        3 reels I edited end to end in Claude Code
      </div>
      <div style={{display: 'flex', justifyContent: 'space-around', padding: '0 10px'}}>
        <MiniPhone src="edit-guide/duet-small.mp4" label="Claude Duet"/>
        <MiniPhone src="edit-guide/kimi-small.mp4" label="Kimi K3 on 8 GB"/>
        <MiniPhone src="edit-guide/leads-small.mp4" label="Free daily leads"/>
      </div>
    </div>

    {/* footer */}
    <div style={{position: 'absolute', left: 38, right: 38, top: 1224, height: 1.5, background: '#eceef2'}}/>
    <Img src={staticFile('edit-guide/hammad_avatar.jpg')} style={{position: 'absolute', left: 70, top: 1243, width: 50, height: 50,
      borderRadius: 25, border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.18)'}}/>
    <div style={{position: 'absolute', left: 134, top: 1254, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontSize: 20}}>
      <span style={{fontWeight: 700, color: INK}}>Hammad Yousuf</span>
      <span style={{color: '#c9ccd3'}}>|</span>
      <span style={{color: MUTED}}>AI workflows, one a day</span>
    </div>
    <div style={{position: 'absolute', right: 70, top: 1255, fontFamily: MONO, fontWeight: 700, fontSize: 19, color: BLUE}}>
      withhammad.com ↗
    </div>
    {/* Claude Code mascot tile, top right of the title */}
    <div style={{position: 'absolute', right: 66, top: 136, width: 84, height: 84, borderRadius: 20, background: '#f6f1ec',
      border: '1.5px solid #ece4dc', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg width={60} height={44} viewBox="0 0 86 57" shapeRendering="crispEdges">
        <g fill="#E0704F">
          <rect x={11} y={0} width={64} height={45}/><rect x={0} y={23} width={86} height={11}/>
          <rect x={15} y={45} width={6} height={12}/><rect x={26} y={45} width={6} height={12}/>
          <rect x={54} y={45} width={6} height={12}/><rect x={65} y={45} width={6} height={12}/>
        </g>
        <rect x={21} y={11} width={6} height={12} fill="#f6f1ec"/><rect x={59} y={11} width={6} height={12} fill="#f6f1ec"/>
      </svg>
    </div>
  </AbsoluteFill>
);
