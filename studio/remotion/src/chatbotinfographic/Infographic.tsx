import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';

// "How an AI chatbot gets built": our own 7-stage explainer in the WithHammad system (navy + #1F5EFF, Inter).
// A vertical pipeline: a blue pulse runs down the rail, each stage card lights up and plays its own small diagram,
// then the pulse rides the feedback loop back to stage 1, so the 7 s cycle loops with no cut.
// Facts on screen are the sourced ones (see the captions file); the small demo numbers are labelled as examples.
export const CYCLE = 210, FPS = 30;
export const NAVY = '#06122E', BLUE = '#1F5EFF', INK = '#0E1320', GREY = '#5A6275', SOFT = '#E8EFFF', LINE = '#C9D6F5', OK = '#12A150', BAD = '#E5484D';
const FONT = 'CbInter, Inter, Arial, sans-serif';
export const ROW0 = 236, PITCH = 143, CARD_H = 128, RAIL_X = 100, CARD_X = 150, CARD_W = 894;
export const START = (i: number) => 8 + i * 26;
const STAGE_LEN = 26;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const wrap = (f: number) => ((f % CYCLE) + CYCLE) % CYCLE;
// wrap-aware 0..1 progress through [a, b]; null outside
const prog = (f: number, a: number, b: number) => {
  for (const k of [-1, 0, 1]) { const s = a + k * CYCLE, e = b + k * CYCLE; if (f >= s && f <= e) return (f - s) / (e - s); }
  return null;
};
const ease = Easing.inOut(Easing.cubic);

type StageCopy = {key: string; title: string; desc: string[]};
export const STAGES: StageCopy[] = [
  {key: 'COLLECT', title: 'Gather the text', desc: ['Web pages, books and code.', 'Duplicates and spam get filtered out.']},
  {key: 'PRETRAIN', title: 'Predict the next word', desc: ['Over and over, on trillions of tokens.', 'Llama 3 trained on about 15 trillion.']},
  {key: 'FINE-TUNE (SFT)', title: 'Learn from examples', desc: ['People write ideal answers.', 'It learns to answer, not autocomplete.']},
  {key: 'ALIGN (RLHF / DPO)', title: 'Learn what people prefer', desc: ['Humans pick the better of two replies.', 'Those picks become training signal.']},
  {key: 'EVALUATE', title: 'Test it hard', desc: ['Benchmarks, human review and', 'red-teamers trying to break it.']},
  {key: 'DEPLOY', title: 'Ship it', desc: ['An API on GPU servers, with safety', 'filters checking prompts and replies.']},
  {key: 'MONITOR', title: 'Listen and loop', desc: ['Thumbs-down votes and reports', 'can feed the next version.']},
];

const T: React.FC<{x: number; y: number; size?: number; w?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; children: React.ReactNode}> =
  ({x, y, size = 13, w = 700, color = NAVY, anchor = 'start', children}) =>
  <text x={x} y={y} fontFamily={FONT} fontSize={size} fontWeight={w} fill={color} textAnchor={anchor}>{children}</text>;
const Check: React.FC<{x: number; y: number; r?: number; s?: number}> = ({x, y, r = 9, s = 1}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><circle r={r} fill={OK}/><path d={`M${-r * 0.45} 0l${r * 0.3} ${r * 0.3} ${r * 0.55}-${r * 0.6}`} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/></g>;
const ThumbIcon: React.FC<{x: number; y: number; s?: number; down?: boolean; color: string}> = ({x, y, s = 1, down, color}) =>
  <g transform={`translate(${x} ${y}) scale(${s} ${down ? -s : s})`}>
    <path d="M-9 -1h4v11h-4z M-3 -1l5-9c2 0 3 1.5 2.6 3.5L4 -2h6c1.8 0 3 1.6 2.6 3.3l-2 7.5c-.3 1.2-1.4 2-2.6 2H-3z" fill={color}/></g>;

type VP = {p: number; live: boolean};
// --- the seven small diagrams (330 x 112 local box). p = 0..1 while the stage is live, 1 when resting ---
const V1: React.FC<VP> = ({p, live}) => <>
  {['WEB', 'BOOKS', 'CODE'].map((t, i) => <g key={t}><rect x={0} y={8 + i * 33} width={74} height={26} rx={13} fill={SOFT} stroke={LINE}/>
    <T x={37} y={25.5 + i * 33} anchor="middle" size={12.5}>{t}</T></g>)}
  <path d="M128 18h70l-24 34v28l-22 12V52z" fill="#fff" stroke={NAVY} strokeWidth={2.4} strokeLinejoin="round"/>
  <T x={163} y={108} anchor="middle" size={11} w={600} color={GREY}>filter</T>
  <g transform="translate(250 18)"><rect width={56} height={68} rx={8} fill="#fff" stroke={BLUE} strokeWidth={2.4}/>
    {[16, 28, 40, 52].map((y, i) => <rect key={y} x={11} y={y} width={i === 3 ? 22 : 34} height={5} rx={2.5} fill={BLUE} opacity={0.75}/>)}</g>
  <T x={278} y={108} anchor="middle" size={11} w={600} color={GREY}>clean text</T>
  {live ? Array.from({length: 7}).map((_, k) => {
    const t = clamp(p * 1.9 - k * 0.13), bad = k % 3 === 1, src = k % 3;
    if (t <= 0 || t >= 1) return null;
    const x0 = 78, y0 = 21 + src * 33;
    const x = t < 0.5 ? interpolate(t, [0, 0.5], [x0, 163]) : bad ? 163 + (t - 0.5) * 30 : interpolate(t, [0.5, 1], [163, 270]);
    const y = t < 0.5 ? interpolate(t, [0, 0.5], [y0, 46]) : bad ? 46 + (t - 0.5) * 140 : interpolate(t, [0.5, 1], [60, 52]);
    return <circle key={k} cx={x} cy={y} r={5} fill={bad ? BAD : BLUE} opacity={bad && t > 0.8 ? (1 - t) * 5 : 1}/>;
  }) : null}
</>;

const V2: React.FC<VP> = ({p}) => {
  const fill = clamp((p - 0.6) * 6), g = interpolate(p, [0.05, 0.55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return <>
    <T x={0} y={22} size={17} w={600} color={INK}>The sky is</T>
    <rect x={92} y={5} width={70} height={24} rx={6} fill={fill > 0.5 ? BLUE : '#fff'} stroke={BLUE} strokeWidth={2} strokeDasharray={fill > 0.5 ? undefined : '5 4'}/>
    <T x={127} y={22} anchor="middle" size={15} w={800} color={fill > 0.5 ? '#fff' : BLUE}>{fill > 0.5 ? 'blue' : '?'}</T>
    {([['blue', 0.82], ['clear', 0.09], ['dark', 0.04]] as const).map(([w, v], i) => <g key={w}>
      <T x={0} y={56 + i * 21} size={12.5} w={600} color={GREY}>{w}</T>
      <rect x={44} y={45 + i * 21} width={170 * v * g} height={14} rx={4} fill={i ? '#9DB6F7' : BLUE}/>
      <T x={50 + 170 * v * g} y={56 + i * 21} size={12} w={700} color={NAVY}>{v.toFixed(2)}</T></g>)}
    <rect x={238} y={4} width={88} height={46} rx={10} fill={NAVY}/>
    <T x={282} y={24} anchor="middle" size={15} w={800} color="#fff">~15T</T>
    <T x={282} y={41} anchor="middle" size={10.5} w={600} color="#B9C8F2">tokens, Llama 3</T>
    <T x={238} y={106} size={10.5} w={500} color={GREY}>example odds</T>
  </>;
};

const V3: React.FC<VP> = ({p}) => {
  const ans = 'Sure! The 3 key points are…', n = Math.round(clamp((p - 0.25) / 0.6) * ans.length);
  return <>
    <rect x={0} y={4} width={196} height={34} rx={14} fill={SOFT}/><T x={14} y={26} size={14} w={600} color={INK}>Summarise this email</T>
    <rect x={64} y={48} width={262} height={34} rx={14} fill={BLUE}/><T x={78} y={70} size={14} w={600} color="#fff">{ans.slice(0, n)}{p < 0.85 && p > 0.2 ? '|' : ''}</T>
    <g transform="translate(70 92)"><path d="M0 12l3-9 8-8 6 6-8 8z" fill="#fff" stroke={NAVY} strokeWidth={1.8} strokeLinejoin="round"/></g>
    <T x={94} y={105} size={11.5} w={600} color={GREY}>answer written by a person</T>
  </>;
};

const V4: React.FC<VP> = ({p}) => {
  const pick = clamp((p - 0.45) * 5), hand = interpolate(p, [0.1, 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  return <>
    {(['A', 'B'] as const).map((l, i) => {
      const chosen = i === 0, sel = chosen && pick > 0.5;
      return <g key={l} transform={`translate(${i * 150} 4)`} opacity={!chosen ? 1 - 0.45 * pick : 1}>
        <rect width={132} height={80} rx={12} fill="#fff" stroke={sel ? BLUE : LINE} strokeWidth={sel ? 3 : 2}/>
        <rect x={10} y={10} width={26} height={22} rx={6} fill={sel ? BLUE : SOFT}/>
        <T x={23} y={26} anchor="middle" size={13} w={800} color={sel ? '#fff' : NAVY}>{l}</T>
        {[42, 54, 66].map((y, k) => <rect key={y} x={10} y={y} width={k === 2 ? 60 : 108} height={6} rx={3} fill="#D5DCEB"/>)}
        {chosen && pick > 0 ? <Check x={122} y={8} s={pick}/> : null}
      </g>;
    })}
    <g transform={`translate(${interpolate(hand, [0, 1], [290, 92])} ${interpolate(hand, [0, 1], [96, 60])})`}>
      <path d="M0 0l14 34 5-13 13-5z" fill="#fff" stroke={NAVY} strokeWidth={2} strokeLinejoin="round"/></g>
    <T x={0} y={106} size={11.5} w={600} color={GREY}>a person picks the better reply</T>
  </>;
};

const V5: React.FC<VP> = ({p}) => <>
  {['Benchmarks', 'Red-team attacks', 'Human review'].map((t, i) => {
    const on = clamp((p - 0.15 - i * 0.22) * 6);
    return <g key={t} transform={`translate(0 ${6 + i * 33})`}>
      <rect width={250} height={27} rx={8} fill={on > 0.5 ? '#EAF7EF' : '#F3F5FA'} stroke={on > 0.5 ? '#B7E2C6' : LINE}/>
      <T x={12} y={18.5} size={14} w={600} color={INK}>{t}</T>
      <circle cx={232} cy={13.5} r={9} fill="#fff" stroke={LINE} strokeWidth={1.5}/>
      {on > 0 ? <Check x={232} y={13.5} s={on}/> : null}
    </g>;
  })}
  <g opacity={clamp((p - 0.8) * 8)}><rect x={262} y={36} width={64} height={26} rx={13} fill={OK}/><T x={294} y={53.5} anchor="middle" size={12} w={800} color="#fff">READY</T></g>
</>;

const V6: React.FC<VP> = ({p, live}) => <>
  <rect x={0} y={24} width={72} height={46} rx={10} fill={NAVY}/><T x={36} y={52} anchor="middle" size={15} w={800} color="#fff">API</T>
  <T x={36} y={94} anchor="middle" size={11} w={600} color={GREY}>GPU servers</T>
  <path d="M150 22l24 8v15c0 14-10 22-24 27-14-5-24-13-24-27V30z" fill={SOFT} stroke={BLUE} strokeWidth={2.4} strokeLinejoin="round"/>
  <Check x={150} y={46} r={9}/>
  <T x={150} y={94} anchor="middle" size={11} w={600} color={GREY}>safety filter</T>
  <g transform="translate(234 14)"><rect width={40} height={66} rx={8} fill="#fff" stroke={NAVY} strokeWidth={2.4}/><rect x={6} y={9} width={28} height={40} rx={3} fill={SOFT}/>
    <rect x={10} y={16} width={18} height={6} rx={3} fill={BLUE}/><rect x={10} y={27} width={14} height={6} rx={3} fill="#9DB6F7"/></g>
  <g transform="translate(282 30)"><rect width={42} height={30} rx={4} fill="#fff" stroke={NAVY} strokeWidth={2.2}/><path d="M-4 34h50" stroke={NAVY} strokeWidth={2.6} strokeLinecap="round"/></g>
  <T x={279} y={94} anchor="middle" size={11} w={600} color={GREY}>apps & users</T>
  <path d="M76 47h46M178 47h52" stroke={LINE} strokeWidth={2.4} strokeDasharray="4 5"/>
  {live ? [0, 1, 2].map(k => { const t = p * 2.2 - k * 0.33; const u = t - Math.floor(t);
    return t > 0 ? <circle key={k} cx={interpolate(u, [0, 1], [76, 230])} cy={47} r={5} fill={BLUE}/> : null; }) : null}
</>;

const V7: React.FC<VP> = ({p, live}) => {
  const fly = interpolate(p, [0.2, 0.75], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const bz = (t: number, a: number, b: number, c: number, d: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
  return <>
    <rect x={0} y={8} width={104} height={34} rx={17} fill="#EAF7EF"/><ThumbIcon x={22} y={26} s={1.15} color={OK}/><T x={40} y={30} size={13.5} w={700} color={INK}>helpful</T>
    <rect x={0} y={52} width={104} height={34} rx={17} fill="#FDEEEE"/><ThumbIcon x={22} y={68} s={1.15} down color={BAD}/><T x={40} y={74} size={13.5} w={700} color={INK}>wrong</T>
    <path d="M108 69C170 69 190 40 236 40" fill="none" stroke={LINE} strokeWidth={2.4} strokeDasharray="4 5"/>
    {live && fly > 0 && fly < 1 ? <circle cx={bz(fly, 108, 170, 190, 236)} cy={bz(fly, 69, 69, 40, 40)} r={6} fill={BAD}/> : null}
    <g transform="translate(244 12)">{[0, 1, 2].map(i => <path key={i} d="M0 12l36-12 36 12-36 12z" transform={`translate(0 ${44 - i * 14})`}
      fill={i === 2 ? BLUE : i === 1 ? '#7FA2FA' : SOFT} stroke={NAVY} strokeWidth={1.8} strokeLinejoin="round"/>)}</g>
    <T x={280} y={100} anchor="middle" size={11} w={600} color={GREY}>next training data</T>
  </>;
};
const VIS = [V1, V2, V3, V4, V5, V6, V7];

export const Infographic: React.FC<{frame?: number; all?: boolean; bare?: boolean}> = ({frame, all = false, bare = false}) => {
  const cur = useCurrentFrame();
  const f = wrap(frame ?? cur);
  const nodeY = (i: number) => ROW0 + i * PITCH + CARD_H / 2;
  // the pulse: down the rail stage by stage, then round the feedback loop (frames 190 -> 218, wrapping into the next cycle)
  const back = all ? null : prog(f, 190, 218);
  const LOOP_X = RAIL_X - 50;
  let px = RAIL_X, py = nodeY(0);
  if (back !== null) {
    const yA = nodeY(6), yB = nodeY(0), seg1 = RAIL_X - LOOP_X, seg2 = yA - yB, total = seg1 * 2 + seg2, d = ease(back) * total;
    if (d < seg1) { px = RAIL_X - d; py = yA; } else if (d < seg1 + seg2) { px = LOOP_X; py = yA - (d - seg1); } else { px = LOOP_X + (d - seg1 - seg2); py = yB; }
  } else {
    for (let i = 1; i < 7; i++) { const s = START(i);
      if (f >= s && f < s + STAGE_LEN) py = interpolate(ease(clamp((f - s) / 7)), [0, 1], [nodeY(i - 1), nodeY(i)]);
      if (f >= s + STAGE_LEN && i === 6) py = nodeY(6); }
  }
  const act = (i: number) => (all ? 1 : clamp(Math.min((f - START(i) + 1) / 4, (START(i) + STAGE_LEN - f + 4) / 5)));
  const done = (i: number) => all || (back === null && f >= START(i));
  const loopGlow = back !== null ? Math.sin(Math.PI * back) : 0;
  const fillTo = all ? nodeY(6) : back !== null ? interpolate(back, [0, 0.4], [nodeY(6), nodeY(0)], {extrapolateRight: 'clamp'}) : py;

  return <AbsoluteFill style={{background: bare ? 'transparent' : '#F5F7FC', fontFamily: FONT}}>
    <svg width={1080} height={1350} style={{position: 'absolute', inset: 0}}>
      <defs><pattern id="cbgrid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="rgba(6,18,46,.045)" strokeWidth={1.2}/></pattern></defs>
      <rect width={1080} height={1350} fill="url(#cbgrid)"/></svg>

    {/* header */}
    <div style={{position: 'absolute', top: 44, left: 0, right: 0, textAlign: 'center', display: bare ? 'none' : 'block'}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, border: `2px solid ${NAVY}`, padding: '5px 12px', background: '#fff'}}>
        <div style={{width: 22, height: 22, background: BLUE, color: '#fff', fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>W</div>
        <div style={{fontSize: 18, fontWeight: 900, color: NAVY, letterSpacing: 1.5}}>WITHHAMMAD</div></div>
      <div style={{fontSize: 60, fontWeight: 900, color: NAVY, letterSpacing: -1.8, marginTop: 18, lineHeight: 1}}>
        How an AI chatbot <span style={{color: BLUE}}>gets built</span></div>
      <div style={{fontSize: 24, fontWeight: 600, color: GREY, marginTop: 14}}>7 stages, from raw web text to the assistant you chat with</div>
    </div>

    {/* rail + feedback loop */}
    <svg width={1080} height={1350} style={{position: 'absolute', inset: 0}}>
      <line x1={RAIL_X} y1={nodeY(0)} x2={RAIL_X} y2={nodeY(6)} stroke={LINE} strokeWidth={4}/>
      {back !== null && back > 0.4 ? null : <line x1={RAIL_X} y1={back !== null ? fillTo : nodeY(0)} x2={RAIL_X} y2={back !== null ? nodeY(6) : fillTo} stroke={BLUE} strokeWidth={4}/>}
      <path d={`M${RAIL_X} ${nodeY(6)}H${LOOP_X}V${nodeY(0)}H${RAIL_X}`} fill="none" stroke={BLUE} strokeWidth={2.5} strokeDasharray="6 7" opacity={0.45 + 0.55 * loopGlow}/>
    </svg>
    <div style={{position: 'absolute', left: LOOP_X - 12, top: (nodeY(0) + nodeY(6)) / 2 - 95, width: 24, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F5F7FC'}}>
      <div style={{transform: 'rotate(-90deg)', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800, letterSpacing: 2.5, color: BLUE, opacity: 0.6 + 0.4 * loopGlow}}>FEEDBACK LOOP</div></div>

    {STAGES.map((s, i) => {
      const a = act(i), top = ROW0 + i * PITCH, s0 = START(i);
      const live = !all && prog(f, s0, s0 + STAGE_LEN) !== null;
      const pr = live ? (prog(f, s0, s0 + STAGE_LEN) as number) : 1;
      const V = VIS[i];
      const lit = a > 0.5 || done(i);
      return <React.Fragment key={s.key}>
        <div style={{position: 'absolute', left: CARD_X, top, width: CARD_W, height: CARD_H, background: '#fff', borderRadius: 18, boxSizing: 'border-box',
          border: `${2 + a}px solid ${a > 0.02 ? BLUE : '#DCE3F2'}`, boxShadow: `0 ${6 + 8 * a}px ${16 + 18 * a}px rgba(31,94,255,${(0.08 + 0.2 * a).toFixed(3)})`,
          transform: `translateX(${8 * a}px)`}}>
          <div style={{position: 'absolute', left: 30, top: 16, fontSize: 13, fontWeight: 800, letterSpacing: 2, color: BLUE}}>STAGE {i + 1} · {s.key}</div>
          <div style={{position: 'absolute', left: 30, top: 37, fontSize: 31, fontWeight: 800, color: NAVY, letterSpacing: -0.6}}>{s.title}</div>
          <div style={{position: 'absolute', left: 30, top: 77, fontSize: 17.5, fontWeight: 500, color: GREY, lineHeight: 1.24}}>{s.desc.map(l => <div key={l}>{l}</div>)}</div>
          <svg width={330} height={112} viewBox="0 0 330 112" style={{position: 'absolute', left: CARD_W - 356, top: 8, overflow: 'visible'}}>
            <V p={pr} live={live}/></svg>
        </div>
        <div style={{position: 'absolute', left: RAIL_X - 27, top: nodeY(i) - 27, width: 54, height: 54, borderRadius: 27, boxSizing: 'border-box',
          background: lit ? BLUE : '#fff', border: `3px solid ${lit ? BLUE : LINE}`, color: lit ? '#fff' : NAVY, fontSize: 24, fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.12 * a})`,
          boxShadow: a > 0.02 ? `0 0 ${22 * a}px rgba(31,94,255,.55)` : 'none'}}>{i + 1}</div>
      </React.Fragment>;
    })}

    {back !== null ? <div style={{position: 'absolute', left: px - 10, top: py - 10, width: 20, height: 20, borderRadius: 10, background: '#fff', border: `5px solid ${BLUE}`,
      boxShadow: '0 0 18px rgba(31,94,255,.85)', boxSizing: 'border-box'}}/> : null}

    {/* footer */}
    <div style={{position: 'absolute', left: 40, right: 40, top: 1250, height: 72, display: bare ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <Img src={staticFile('guides/how-ai-chatbot-is-made/hammad.jpg')} style={{width: 54, height: 54, borderRadius: 27, border: `3px solid ${BLUE}`}}/>
        <div style={{lineHeight: 1.1}}><div style={{fontSize: 21, fontWeight: 800, color: NAVY}}>Hammad</div>
          <div style={{fontSize: 16, fontWeight: 600, color: GREY}}>@with.hammad</div></div>
      </div>
      <div style={{background: NAVY, borderRadius: 40, padding: '14px 26px', display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{fontSize: 20, fontWeight: 600, color: '#B9C8F2'}}>The result:</span>
        <span style={{fontSize: 22, fontWeight: 800, color: '#fff'}}>a helpful AI assistant</span>
        <svg width={22} height={22} viewBox="0 0 24 24"><path d="M4 12h15M13 5l7 7-7 7" stroke={BLUE} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </div>
  </AbsoluteFill>;
};
