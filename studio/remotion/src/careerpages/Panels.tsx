// Floating UI windows for the career-pages reel. Search data = the real Google results captured 2026-11-07
// (job screens/google_results.json). Greenhouse uses site:greenhouse.io (boards. moved to job-boards.).
import React from 'react';
import {interpolate} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const pop = (t: number, from: number, to: number) => {
  const a = interpolate(t, [from, from + 0.28, to - 0.25, to], [0, 1, 1, 0], clamp);
  const s = interpolate(t, [from, from + 0.28], [0.9, 1], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  return {opacity: a, transform: `scale(${s})`};
};
const FONT = 'CpInter, -apple-system, Arial';
const Win: React.FC<{top: number; width?: number; children: React.ReactNode; style?: React.CSSProperties; url?: string}> = ({top, width = 920, children, style, url}) => (
  <div style={{position: 'absolute', top, left: (1080 - width) / 2, width, borderRadius: 22, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 80px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.08)', fontFamily: FONT, transformOrigin: '50% 0%', ...style}}>
    <div style={{height: 54, background: '#eceef2', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10}}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 15, height: 15, borderRadius: 8, background: c}} />)}
      {url && <div style={{marginLeft: 18, flex: 1, height: 34, borderRadius: 17, background: '#fff', fontSize: 19, color: '#5f6368', display: 'flex', alignItems: 'center', padding: '0 16px', whiteSpace: 'nowrap', overflow: 'hidden'}}>{url}</div>}
    </div>
    {children}
  </div>
);
const GLogo: React.FC<{size?: number}> = ({size = 40}) => (
  <span style={{fontFamily: 'Arial', fontWeight: 700, fontSize: size, letterSpacing: -1}}>
    <span style={{color: '#4285f4'}}>G</span><span style={{color: '#ea4335'}}>o</span><span style={{color: '#fbbc05'}}>o</span><span style={{color: '#4285f4'}}>g</span><span style={{color: '#34a853'}}>l</span><span style={{color: '#ea4335'}}>e</span>
  </span>
);
const PARTS: [string, number, string][] = [
  ['site:jobs.lever.co', 19.62, 'lever'], [' OR site:jobs.ashbyhq.com', 20.3, 'ashby'], [' OR site:greenhouse.io', 21.04, 'gh'],
  [' "frontend engineer"', 22.0, 'job'], [' remote', 22.84, 'remote'],
];
export const Google: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  if (t < from || t > to) return null;
  let q = '';
  for (const [s, at] of PARTS) { const n = Math.floor(interpolate(t, [at - 0.05, at + 0.38], [0, s.length], clamp)); q += s.slice(0, n); }
  const caret = Math.floor(t * 2.2) % 2 === 0;
  const pressed = t > 23.05;
  return (
    <Win top={500} url="google.com" style={pop(t, from, to)}>
      <div style={{padding: '30px 34px 34px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <GLogo />
          <div style={{flex: 1, minHeight: 62, borderRadius: 31, border: '1.5px solid #dfe1e5', boxShadow: pressed ? '0 1px 6px rgba(32,33,36,.28)' : 'none', display: 'flex', alignItems: 'center', padding: '10px 24px', fontSize: 25, color: '#202124', lineHeight: 1.35, wordBreak: 'break-word'}}>
            <span>{q}{caret && !pressed ? <span style={{borderLeft: '2px solid #202124', marginLeft: 1}}>&nbsp;</span> : null}</span>
          </div>
        </div>
        <div style={{display: 'flex', gap: 28, marginTop: 18, marginLeft: 118, fontSize: 19, color: '#5f6368'}}>
          <span style={{color: '#1a73e8', borderBottom: '3px solid #1a73e8', paddingBottom: 6}}>All</span><span>Images</span><span>News</span><span>Videos</span><span>Tools</span>
        </div>
      </div>
    </Win>
  );
};
const RES = [
  {src: 'Lever', c: '#4a8f6d', l: 'L', host: 'jobs.lever.co › jobgether', title: 'Sr Frontend Developer - Jobgether', snip: '3 days ago — experienced frontend engineer with strong React … Fully remote.'},
  {src: 'Greenhouse', c: '#24a47f', l: 'g', host: 'job-boards.greenhouse.io › tailscale', title: 'Front End Engineer at Tailscale', snip: '4 days ago — full-time Frontend Engineer … Remote first company.'},
  {src: 'Lever', c: '#4a8f6d', l: 'L', host: 'jobs.lever.co › cmgx', title: 'Senior Frontend Engineer (Analytics Product Lead)', snip: '7 hours ago — The working model for this role is fully remote.'},
  {src: 'Ashby', c: '#4f46e5', l: 'A', host: 'jobs.ashbyhq.com › lumbra', title: 'Frontend Engineer, Core Platform @ Lumbra', snip: '2 days ago — We want a frontend engineer to own that experience …'},
];
export const Results: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  if (t < from || t > to) return null;
  const cy = interpolate(t, [from + 0.5, to - 0.4], [150, 610], clamp);
  return (
    <Win top={470} url="google.com/search?q=site:jobs.lever.co OR site:jobs.ashbyhq.com …" style={pop(t, from, to)}>
      <div style={{padding: '22px 34px 26px', position: 'relative'}}>
        <div style={{fontSize: 18, color: '#70757a', marginBottom: 14}}>Past month · 39 postings at the source</div>
        {RES.map((r, i) => {
          const a = interpolate(t, [from + 0.12 + i * 0.12, from + 0.34 + i * 0.12], [0, 1], clamp);
          return (
            <div key={i} style={{marginBottom: 20, opacity: a, transform: `translateY(${(1 - a) * 12}px)`}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <div style={{width: 30, height: 30, borderRadius: 15, background: r.c, color: '#fff', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{r.l}</div>
                <div style={{lineHeight: 1.15}}><div style={{fontSize: 18, color: '#202124'}}>{r.src}</div><div style={{fontSize: 15, color: '#4d5156'}}>https://{r.host}</div></div>
              </div>
              <div style={{fontSize: 26, color: '#1a0dab', marginTop: 6}}>{r.title}</div>
              <div style={{fontSize: 18, color: '#4d5156', marginTop: 3}}>{r.snip}</div>
            </div>
          );
        })}
        <svg width="34" height="44" style={{position: 'absolute', left: 640, top: cy}} viewBox="0 0 17 22"><path d="M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L14 12 Z" fill="#111" stroke="#fff" strokeWidth="1.2" /></svg>
      </div>
    </Win>
  );
};
const Toggle: React.FC<{on: number}> = ({on}) => (
  <div style={{width: 64, height: 36, borderRadius: 18, background: on > 0.5 ? '#2fb862' : '#c9ccd1', position: 'relative', transition: 'none'}}>
    <div style={{position: 'absolute', top: 3, left: 3 + on * 28, width: 30, height: 30, borderRadius: 15, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.3)'}} />
  </div>
);
const Side: React.FC<{active: string}> = ({active}) => (
  <div style={{width: 220, background: '#f5f3ee', padding: '22px 14px', fontSize: 20, color: '#3d3929', display: 'flex', flexDirection: 'column', gap: 6}}>
    {['New task', 'Scheduled', 'Projects', 'Files'].map((x) => <div key={x} style={{padding: '9px 12px', borderRadius: 10, background: x === active ? '#e8e4da' : 'transparent', fontWeight: x === active ? 700 : 500}}>{x}</div>)}
  </div>
);
export const Schedule: React.FC<{t: number; from: number; to: number; toggleAt: number}> = ({t, from, to, toggleAt}) => {
  if (t < from || t > to) return null;
  const on = interpolate(t, [toggleAt, toggleAt + 0.18], [0, 1], clamp);
  return (
    <Win top={470} style={pop(t, from, to)}>
      <div style={{display: 'flex', background: '#faf9f5', height: 470}}>
        <Side active="Scheduled" />
        <div style={{flex: 1, padding: '26px 30px'}}>
          <div style={{fontSize: 17, color: '#8a8578', letterSpacing: 2, fontWeight: 700}}>SCHEDULED</div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10}}>
            <div style={{fontSize: 31, fontWeight: 800, color: '#1f1e1a'}}>Find jobs on career pages</div>
            <Toggle on={on} />
          </div>
          <div style={{display: 'flex', gap: 10, marginTop: 16}}>
            <span style={{fontSize: 19, background: '#efe9dc', padding: '6px 12px', borderRadius: 8}}>⏰ Daily · 8:00 AM</span>
            <span style={{fontSize: 19, background: '#efe9dc', padding: '6px 12px', borderRadius: 8}}>📎 my-cv.pdf</span>
          </div>
          <div style={{marginTop: 18, fontSize: 19, lineHeight: 1.45, color: '#4a463c', background: '#fff', border: '1px solid #e6e1d6', borderRadius: 12, padding: '14px 16px'}}>
            Search Lever, Ashby and Greenhouse boards for "frontend engineer" remote roles posted this week. Read my CV and keep only the ones I fit.
          </div>
          <div style={{marginTop: 14, fontSize: 16, color: '#8a8578'}}>Scheduled tasks need a paid Claude plan</div>
        </div>
      </div>
    </Win>
  );
};
const RUN = [
  {title: 'Sr Frontend Developer', co: 'Jobgether · Lever', m: 92, keep: true},
  {title: 'Front End Engineer', co: 'Tailscale · Greenhouse', m: 88, keep: true},
  {title: 'Staff Backend Engineer, Core DevOps', co: 'GitLab · Greenhouse', m: 41, keep: false},
  {title: 'Senior Frontend Engineer', co: 'CMGX · Lever', m: 85, keep: true},
  {title: 'Frontend Engineer, Core Platform', co: 'Lumbra · Ashby (on-site only)', m: 38, keep: false},
];
export const LatestRun: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  if (t < from || t > to) return null;
  const strikeAt = 29.0;
  return (
    <Win top={470} style={pop(t, from, to)}>
      <div style={{background: '#faf9f5', padding: '22px 30px 24px'}}>
        <div style={{fontSize: 17, color: '#8a8578', letterSpacing: 2, fontWeight: 700}}>LATEST RUN · TODAY, 8:00 AM</div>
        {RUN.map((r, i) => {
          const a = interpolate(t, [from + 0.15 + i * 0.22, from + 0.4 + i * 0.22], [0, 1], clamp);
          const st = r.keep ? 0 : interpolate(t, [strikeAt + i * 0.08, strikeAt + 0.3 + i * 0.08], [0, 1], clamp);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid #ebe6da', opacity: a * (1 - st * 0.55), transform: `translateX(${(1 - a) * 20}px)`}}>
              <div style={{position: 'relative'}}>
                <div style={{fontSize: 24, fontWeight: 700, color: '#1f1e1a'}}>{r.title}</div>
                <div style={{fontSize: 18, color: '#8a8578', marginTop: 2}}>{r.co}</div>
                <div style={{position: 'absolute', left: 0, top: 16, height: 3, width: `${st * 100}%`, background: '#c0392b'}} />
              </div>
              <div style={{fontSize: 19, fontWeight: 800, padding: '6px 12px', borderRadius: 8, background: r.keep ? '#dff3e6' : '#f6e0dc', color: r.keep ? '#1d7a43' : '#a33a2b'}}>{r.m}% match</div>
            </div>
          );
        })}
        <div style={{marginTop: 14, fontSize: 20, fontWeight: 700, color: '#1d7a43', opacity: interpolate(t, [29.4, 29.7], [0, 1], clamp)}}>Kept 3 that fit your CV</div>
      </div>
    </Win>
  );
};
export const Notice: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  if (t < from || t > to) return null;
  const y = interpolate(t, [from, from + 0.35], [-60, 0], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const a = interpolate(t, [from, from + 0.3, to - 0.2, to], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 520 + y, left: 70, right: 70, opacity: a, background: 'rgba(250,250,252,0.94)', borderRadius: 34, padding: '24px 28px', boxShadow: '0 20px 60px rgba(0,0,0,.25)', fontFamily: FONT, display: 'flex', gap: 20}}>
      <div style={{width: 64, height: 64, borderRadius: 16, background: '#2d5be3', color: '#fff', fontWeight: 800, fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>N</div>
      <div style={{flex: 1}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 20, color: '#6b6b70'}}><span style={{fontWeight: 700, color: '#1c1c1e'}}>Northwind Talent</span><span>now</span></div>
        <div style={{fontSize: 25, fontWeight: 800, color: '#1c1c1e', marginTop: 4}}>Thanks for applying!</div>
        <div style={{fontSize: 23, color: '#2c2c2e', marginTop: 2, lineHeight: 1.3}}>You're one of our first applicants. Free for a call Thursday?</div>
      </div>
    </div>
  );
};
