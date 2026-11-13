// LinkedIn infographic (1080x1350): "Scan a skill before you install it", NVIDIA SkillSpector in 5 steps.
// Layout follows the Charlie Hills reference (lnkd.in/p/dDUXHdt3) with Hammad's name and our own checked facts:
// 25.7k stars (GitHub API 13 Nov 2026); 71 patterns / 17 categories, commands, risk rules and the 26.1% / 5.2% study from
// NVIDIA's README; External Transmission is MEDIUM (+10), so the example report is scored by the README rules (35/100).
// The reference's personal "151 skills I tested" and its "78/100 README example" are not used (not ours / not in the README).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

const SANS = '-apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';
const MONO = '"SF Mono", Menlo, Consolas, monospace';
const C = {ink: '#16181d', sub: '#5b6170', line: '#e3e6ec', blue: '#2f6bff', purple: '#8b5cf6', orange: '#f97316', red: '#ef4444', green: '#16a34a', amber: '#d97706'};

const Badge: React.FC<{n: string; label: string; color: string}> = ({n, label, color}) =>
  <div style={{position: 'absolute', top: -14, left: 14, display: 'flex', borderRadius: 8, overflow: 'hidden', fontSize: 15, fontWeight: 600, color: '#fff', boxShadow: `0 2px 6px ${color}55`}}>
    <span style={{background: color, padding: '3px 8px', filter: 'brightness(0.85)'}}>{n}</span><span style={{background: color, padding: '3px 10px 3px 4px'}}>{label}</span>
  </div>;

const Card: React.FC<{top: number; height: number; color: string; n: string; label: string; title: string; why: string; width?: number; children?: React.ReactNode}> =
  ({top, height, color, n, label, title, why, width = 472, children}) =>
  <div style={{position: 'absolute', left: 38, top, width, height, background: '#fff', borderRadius: 18, border: `2px solid ${color}55`,
    boxShadow: `0 10px 30px -12px ${color}55, 0 1px 0 #fff inset`, padding: '24px 16px 0'}}>
    <Badge n={n} label={label} color={color}/>
    <div style={{fontFamily: SANS, fontSize: 22, fontWeight: 650, color: C.ink, letterSpacing: -0.3, marginBottom: 8}}>{title}</div>
    {children}
    <div style={{position: 'absolute', left: 16, right: 16, bottom: 12, borderTop: `1px solid ${C.line}`, paddingTop: 9, display: 'flex', gap: 10, alignItems: 'center',
      fontFamily: SANS, fontSize: 14.5, color: C.ink, fontWeight: 600}}>
      <span style={{fontSize: 11, letterSpacing: 1, color, background: `${color}14`, padding: '2px 6px', borderRadius: 5, fontWeight: 700}}>WHY</span>{why}
    </div>
  </div>;

const Cmd: React.FC<{text: string; icon?: string}> = ({text, icon = '›'}) =>
  <div style={{display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${C.line}`, borderRadius: 10, padding: '7px 10px', marginBottom: 7, background: '#fbfcfe'}}>
    <span style={{color: icon === '✦' ? C.blue : C.orange, fontSize: 16, width: 12}}>{icon}</span>
    <span style={{flex: 1, minWidth: 0, fontFamily: icon === '✦' ? SANS : MONO, fontSize: icon === '✦' ? 14 : 11.5, color: C.ink, lineHeight: 1.4, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap'}}>{text}</span>
    <span style={{width: 26, height: 26, borderRadius: 13, background: C.blue, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0}}>↑</span>
  </div>;

const Chip: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) =>
  <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${color ? color + '66' : C.line}`, background: color ? `${color}10` : '#fff',
    color: color ?? C.ink, borderRadius: 7, padding: '3px 9px', fontSize: 14, fontWeight: 600, fontFamily: SANS}}>{children}</span>;

const Tag: React.FC<{x: number; y: number; title: string; sub: string; icon: React.ReactNode; dotX: number}> = ({x, y, title, sub, icon, dotX}) => <>
  <div style={{position: 'absolute', left: dotX, top: y + 26, width: x - dotX, height: 1, background: '#9aa1ad'}}/>
  <div style={{position: 'absolute', left: dotX - 4, top: y + 22, width: 9, height: 9, borderRadius: 5, background: '#2a2f38'}}/>
  <div style={{position: 'absolute', left: x, top: y, display: 'flex', gap: 10, alignItems: 'center', background: '#fff', borderRadius: 12, padding: '8px 12px',
    boxShadow: '0 6px 18px -6px #0002', border: `1px solid ${C.line}`}}>
    {icon}
    <div style={{fontFamily: SANS, whiteSpace: 'nowrap'}}><div style={{fontSize: 15, fontWeight: 650, color: C.ink}}>{title}</div><div style={{fontSize: 12.5, color: C.sub}}>{sub}</div></div>
  </div>
</>;

const GitHubMark = () => <svg width="30" height="30" viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#111"/>
  <path transform="translate(2.2 2.2) scale(0.725)" fill="#fff" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>;

const Gauge: React.FC<{score: number}> = ({score}) => {
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [80 + 62 * Math.cos(Math.PI * (1 - a)), 80 - 62 * Math.sin(Math.PI * (1 - a))];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M ${x0} ${y0} A 62 62 0 0 1 ${x1} ${y1}`;
  };
  const a = score / 100, nx = 80 + 50 * Math.cos(Math.PI * (1 - a)), ny = 80 - 50 * Math.sin(Math.PI * (1 - a));
  return <svg width="160" height="96" viewBox="0 0 160 96">
    <path d={arc(0, 0.2)} stroke={C.green} strokeWidth="13" fill="none"/>
    <path d={arc(0.21, 0.5)} stroke="#f59e0b" strokeWidth="13" fill="none"/>
    <path d={arc(0.51, 1)} stroke={C.red} strokeWidth="13" fill="none"/>
    <line x1="80" y1="80" x2={nx} y2={ny} stroke="#1f2430" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="80" cy="80" r="6" fill="#1f2430"/>
  </svg>;
};

export type InfographicProps = {score: number};

export const SkillSpectorInfographic: React.FC<InfographicProps> = ({score = 35}) => <AbsoluteFill style={{
  background: '#f6f7fa', fontFamily: SANS,
  backgroundImage: 'linear-gradient(#e9ecf2 1px, transparent 1px), linear-gradient(90deg, #e9ecf2 1px, transparent 1px)', backgroundSize: '36px 36px'}}>
  {/* header */}
  <div style={{position: 'absolute', left: 36, top: 24, width: 118, height: 118, borderRadius: 30, background: '#0d0f12', display: 'grid', placeItems: 'center',
    boxShadow: '0 0 40px 6px #76b90044, 0 10px 24px -8px #000a'}}>
    <Img src={staticFile('nvidia.png')} style={{width: 86, height: 86, borderRadius: 18}}/>
  </div>
  <div style={{position: 'absolute', left: 178, top: 22, fontSize: 60, fontWeight: 700, letterSpacing: -2, color: C.ink, whiteSpace: 'nowrap'}}>
    Scan a skill <span style={{background: 'linear-gradient(90deg, #2f6bff, #6d5cff)', WebkitBackgroundClip: 'text', color: 'transparent'}}>before you install it</span>
  </div>
  <div style={{position: 'absolute', left: 180, top: 100, display: 'flex', alignItems: 'center', gap: 12, fontSize: 20, color: C.sub}}>
    <span><b style={{color: C.ink, fontWeight: 650}}>SkillSpector</b> by NVIDIA. Free, open source, 25.7k stars.</span>
    <span style={{color: '#b8bdc8'}}>•</span>
    <Img src={staticFile('avatar.jpg')} style={{width: 38, height: 38, borderRadius: 19, objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 6px #0003'}}/>
    <b style={{color: C.ink, fontWeight: 650}}>Hammad Yousuf</b>
  </div>

  {/* 01 */}
  <Card top={166} height={196} color={C.blue} n="01" label="Install" title="Install it once" why="Free. NVIDIA scans its own skills with it before publishing.">
    <Cmd text={"uv tool install 'skillspector[mcp] @\ngit+https://github.com/NVIDIA/skillspector.git'"}/>
    <div style={{display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: C.sub}}>Works with <Chip>Claude Code</Chip><Chip>Codex</Chip><Chip>Gemini CLI</Chip></div>
  </Card>
  {/* 02 */}
  <Card top={378} height={192} color={C.purple} n="02" label="Claude Code" title="Plug it into Claude Code as a tool" why="Claude runs the scan for you.">
    <Cmd text="claude mcp add skillspector -- skillspector mcp"/>
    <Cmd icon="✦" text="Scan this skill with SkillSpector before I install it."/>
  </Card>
  {/* 03 */}
  <Card top={588} height={244} color={C.orange} n="03" label="Scan" title="Scan before you install" why="You see the risk before it touches your files.">
    <Cmd text="skillspector scan https://github.com/user/my-skill"/>
    <div style={{display: 'flex', gap: 6, marginBottom: 8}}>{['Repo', 'Folder', '.zip', 'SKILL.md'].map((t) => <Chip key={t} color={C.orange}>{t}</Chip>)}</div>
    <div style={{fontSize: 14.5, color: C.ink, lineHeight: 1.6}}>
      <div><span style={{color: C.green}}>●</span> It reads the skill. It never runs it.</div>
      <div><span style={{color: C.green}}>●</span> It checks 71 risk patterns, like stolen keys.</div>
    </div>
  </Card>
  {/* 04 */}
  <Card top={850} height={348} color={C.red} n="04" label="Score" title="Read the score" why="21-50: read the flags. Over 50: do not install yet.">
    <div style={{display: 'flex', gap: 12}}>
      <div style={{position: 'relative', width: 160}}>
        <Gauge score={score}/>
        <div style={{position: 'absolute', left: 0, right: 0, top: 88, textAlign: 'center', fontSize: 26, fontWeight: 700, color: C.ink}}>{score}<span style={{fontSize: 14, color: C.sub}}>/100</span></div>
      </div>
      <div style={{flex: 1}}>
        <div style={{fontSize: 14, color: C.sub, marginBottom: 6}}>Each finding adds</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6}}>
          {[['+50', 'Critical', C.red], ['+25', 'High', C.orange], ['+10', 'Medium', C.amber], ['+5', 'Low', '#6b7280']].map(([p, l, c]) =>
            <div key={l} style={{border: `1px solid ${c}55`, background: `${c}10`, borderRadius: 8, padding: '5px 8px', fontSize: 14, color: C.ink}}>
              <b style={{color: c, fontSize: 16}}>{p}</b> {l}</div>)}
        </div>
      </div>
    </div>
    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, margin: '18px 2px 7px'}}>
      <span style={{color: C.green}}>● Safe 0-20</span><span style={{color: C.amber}}>● Caution 21-50</span><span style={{color: C.red}}>● Do not install 51-100</span>
    </div>
    <div style={{border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden', fontSize: 14}}>
      <div style={{background: '#f3f4f7', padding: '5px 10px', color: C.sub, fontSize: 12.5}}>
        <span style={{color: '#ff5f57'}}>●</span><span style={{color: '#febc2e'}}> ●</span><span style={{color: '#28c840'}}> ●</span> SkillSpector report · example, scored by the README rules</div>
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: `1px solid ${C.line}`}}>
        <span style={{fontFamily: MONO}}>my-skill</span><span><b style={{color: C.amber}}>{score}/100</b> <span style={{fontSize: 11.5, fontWeight: 700, color: C.amber, background: '#fef3c7', padding: '2px 6px', borderRadius: 4}}>CAUTION</span></span>
      </div>
      {[['HIGH', C.orange, 'Env Variable Harvesting', 'collects your API keys', '+25'], ['MEDIUM', C.amber, 'External Transmission', 'sends data out', '+10']].map(([sev, col, name, what, pts]) =>
        <div key={name} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px'}}>
          <span style={{fontSize: 11, fontWeight: 700, color: col, background: `${col}18`, padding: '1px 5px', borderRadius: 4}}>{sev}</span>
          <span style={{fontWeight: 600, flex: 1}}>{name}</span><span style={{color: C.sub, fontSize: 13}}>{what} · {pts}</span>
        </div>)}
    </div>
  </Card>
  {/* 05 */}
  <div style={{position: 'absolute', left: 38, top: 1208, width: 1004, height: 132, background: '#fff', borderRadius: 18, border: `2px solid ${C.purple}44`,
    boxShadow: `0 10px 30px -12px ${C.purple}44`, padding: '22px 18px 0'}}>
    <Badge n="05" label="What the research says" color="#6d5cff"/>
    <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
      <div style={{fontSize: 22, fontWeight: 650, color: C.ink, width: 290, letterSpacing: -0.3, lineHeight: 1.15}}>Most skills pass. Some need a look.</div>
      {[['26.1%', 'of 31,132 skills had a security hole', C.red], ['5.2%', 'showed signs of malicious intent', C.orange], ['2.12×', 'more likely when a skill ships scripts', C.amber]].map(([n, t, c]) =>
        <div key={n} style={{width: 200}}><div style={{fontSize: 30, fontWeight: 750, color: c, letterSpacing: -1}}>{n}</div><div style={{fontSize: 14, color: C.sub, lineHeight: 1.25}}>{t}</div></div>)}
    </div>
    <div style={{position: 'absolute', left: 18, right: 18, bottom: 10, borderTop: `1px solid ${C.line}`, paddingTop: 7, display: 'flex', justifyContent: 'space-between', fontSize: 14.5, fontWeight: 600, color: C.ink}}>
      <span><span style={{fontSize: 11, letterSpacing: 1, color: '#6d5cff', background: '#6d5cff14', padding: '2px 6px', borderRadius: 5, fontWeight: 700, marginRight: 10}}>WHY</span>
        A flag means read it, not panic. The score tells you where to look.</span>
      <span style={{color: C.sub, fontWeight: 500, fontSize: 12.5}}>Source: "Agent Skills in the Wild", arXiv 2601.10338, Jan 2026</span>
    </div>
  </div>

  {/* right side: tap → sorter → bins */}
  <Img src={staticFile('props/tap.png')} style={{position: 'absolute', left: 536, top: 128, width: 350}}/>
  <Tag x={866} y={300} dotX={826} title="Real skill repos" sub="Straight from GitHub" icon={<GitHubMark/>}/>
  <Img src={staticFile('props/sorter.png')} style={{position: 'absolute', left: 690, top: 548, width: 230}}/>
  <div style={{position: 'absolute', left: 712, top: 752, width: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: SANS, fontSize: 15, fontWeight: 700, color: '#e8eaee'}}>
    <Img src={staticFile('nvidia.png')} style={{width: 20, height: 20, borderRadius: 4}}/>SkillSpector</div>
  <Tag x={902} y={598} dotX={888} title="SkillSpector" sub="Scores each skill" icon={<Img src={staticFile('nvidia.png')} style={{width: 30, height: 30, borderRadius: 7}}/>}/>
  <svg width="1080" height="1350" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <path d="M 510 724 C 560 724, 540 640, 610 640 L 686 640" stroke={C.orange} strokeWidth="2.5" fill="none"/>
    <path d="M 676 632 L 690 640 L 676 648" stroke={C.orange} strokeWidth="2.5" fill="none"/>
    <circle cx="510" cy="724" r="4" fill={C.orange}/>
    <path d="M 510 1032 C 545 1032, 535 1052, 562 1052" stroke="#e85d75" strokeWidth="2.5" fill="none"/>
    <path d="M 550 1044 L 562 1052 L 550 1060" stroke="#e85d75" strokeWidth="2.5" fill="none"/>
    <circle cx="510" cy="1032" r="4" fill="#e85d75"/>
  </svg>
  <Img src={staticFile('props/bins.png')} style={{position: 'absolute', left: 580, top: 975, width: 462}}/>
  {[['Safe', '0-20 → install it', C.green, 652], ['Examine', '21-50 → read the flags', C.amber, 806], ['Flagged', '51+ → check first', C.red, 958]].map(([t, s, c, x]) =>
    <div key={t as string} style={{position: 'absolute', left: (x as number) - 80, top: 1138, width: 160, textAlign: 'center'}}>
      <div style={{fontSize: 20, fontWeight: 750, color: c as string}}>{t}</div><div style={{fontSize: 12.5, color: C.sub}}>{s}</div>
    </div>)}
</AbsoluteFill>;
