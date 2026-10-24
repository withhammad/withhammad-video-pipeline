import {staticFile} from 'remotion';
import type {ReelCoverProps} from './ReelCover';
import type {SlideData} from './Carousel';

// Sample props: the two locked covers re-created with <ReelCover>, and the SkillSpector carousel.
// Facts come from studio/.local/jobs/d61788123d13/lesson.json and demo/runs (real offline scans, v2.12.0, 24 Oct 2026).

export const kimiCover: ReelCoverProps = {
  variant: 'card',
  background: staticFile('kimi/cover_bg.png'),
  face: {cut: staticFile('kimi/cover_cut3.png'), full: staticFile('kimi/cover_face3.png'), scale: 0.78, top: 603},
  cardTop: 1020,
  line1: '2.78T AI MODEL',
  line2: 'ON 8 GB RAM',
  accent: 'orange',
};

export const skillCover: ReelCoverProps = {
  variant: 'dark',
  face: {cut: staticFile('skill/shh-cut1.png'), scale: 0.62, top: 360, srcWidth: 1072},
  line1: 'PROTECT CLAUDE',
  line2: 'FROM AI VIRUS',
  accent: 'red',
  logos: [
    {slot: 'top', src: staticFile('skill/nvidia-logo-white.svg'), width: 800, height: 148, y: 300},
    {slot: 'left', tile: {text: 'Ai'}},
    {slot: 'right', tile: {src: staticFile('skill/claude-tile.png')}},
  ],
};

const end = {kind: 'end' as const, headline: 'Want the setup guide?', keyword: 'SCAN',
  link: 'withhammad.com/resources/skillspector-scan-skills', face: staticFile('skill/shh-cut1.png')};

const body: SlideData[] = [
  {kind: 'cover', cover: skillCover, offset: 230},
  {kind: 'stat', kicker: 'Agent skills study', value: '26.1%', label: 'of marketplace skills had a *security flaw*',
    sub: '5.2% of 31,132 skills showed strong signs of malicious intent.', source: 'Liu et al. · arXiv 2601.10338 · Jan 2026'},
  {kind: 'logos', kicker: 'Free · Apache-2.0', title: 'NVIDIA built a *skill scanner*',
    logos: [{src: staticFile('skill/nvidia-logo-white.svg'), w: 270, label: 'SkillSpector'}, {tile: {src: staticFile('skill/claude-tile.png')}, label: 'Claude'},
      {src: staticFile('skill/claude-code-mascot.png'), w: 230, clip: 'inset(0 0 0 3%)', label: 'Claude Code'}],
    note: 'Scan a skill folder, GitHub link or zip before it reaches Claude Code. Claude Code or Codex can run it for you.'},
  {kind: 'step', n: 1, of: 3, title: 'Install it from *NVIDIA\'s GitHub*', body: 'It is not on PyPI, so install it only from the official repo.',
    code: 'uv tool install git+https://github.com/NVIDIA/skillspector.git'},
  {kind: 'step', n: 2, of: 3, title: 'Scan every skill, *offline*', body: '17 risk categories, like prompt injection, data exfiltration and tool misuse. --no-llm keeps your code on your machine.',
    code: 'skillspector scan ~/.claude/skills --recursive --no-llm'},
  {kind: 'terminal', title: 'What a *bad skill* looks like', cmd: 'skillspector scan ./malicious_skill --no-llm',
    lines: [{text: 'Skill: chef-assistant', tone: 'dim'}, {text: 'Score           100/100', tone: 'bad'}, {text: 'Severity        CRITICAL', tone: 'bad'},
      {text: 'Recommendation  DO NOT INSTALL', tone: 'bad'}, {text: 'Issues (7)', tone: 'plain'},
      {text: '  CRITICAL  P5 Harmful Content Injection', tone: 'bad'}, {text: '  HIGH      E2 Env Variable Harvesting', tone: 'warn'},
      {text: '  MEDIUM    E1 External Transmission', tone: 'warn'}],
    source: 'Real run, trimmed · v2.12.0 · its own test skill · 24 Oct 2026'},
  {kind: 'step', n: 3, of: 3, title: 'Read the *risk score*', body: '0 to 100, lower is safer.',
    chips: [{text: '0-20  LOW', tone: 'good'}, {text: '21-50  CAUTION', tone: 'warn'}, {text: 'OVER 50  DON\'T INSTALL', tone: 'bad'}]},
  {kind: 'compare', title: 'Our test: *0 vs 100*', before: {label: 'Clean', name: 'safe_skill', value: '0', verdict: 'SAFE', tone: 'good'},
    after: {label: 'Malicious', name: 'malicious_skill', value: '100', verdict: 'DO NOT INSTALL', tone: 'bad'},
    note: 'Both are SkillSpector\'s own test skills, scanned offline with --no-llm.'},
  {kind: 'quote', quote: 'A low score means no red flags found, not proven safe.',
    by: 'The honest caveat. Offline it missed the natural-language attack samples. It is a scanner, not a sandbox.'},
];

export const skillCarousel: Record<'instagram' | 'linkedin', SlideData[]> = {
  instagram: [...body, {...end, sub: 'I\'ll DM you the full setup guide.'}],
  linkedin: [...body, {...end, keyword: undefined, headline: 'Get the setup guide', sub: 'Link in the post. Install, scan and score bands, step by step.'}],
};
