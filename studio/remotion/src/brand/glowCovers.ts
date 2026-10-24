import {staticFile} from 'remotion';
import type {GlowCoverProps, GlowLogo} from './GlowCover';
import {GLOW} from './tokens';

// The glow-template cover for every published or queued reel (newest first, as on the profile grid).
// Hooks: line 1 <= 14 chars, line 2 <= 16 chars, each checked against the job's lesson.json / published.json facts.
// Logos are the official marks (simple-icons, the vendors' own repos, or files already vendored by earlier covers).

const g = (f: string) => staticFile(`glow/${f}`);
const DARK = 'linear-gradient(160deg, #161D31 0%, #070B16 100%)';
const WHITE = 'linear-gradient(160deg, #FFFFFF 0%, #E9EEF6 100%)';

export const LOGO = {
  claude: {mask: g('si-claude.svg'), color: '#FFFFFF', bg: 'linear-gradient(160deg, #E0845F 0%, #C9623D 100%)', glow: '#FF8A5B', fit: 0.62},
  nvidia: {mask: g('si-nvidia.svg'), color: '#76B900', bg: DARK, glow: '#76B900', fit: 0.66},
  kimi: {src: g('kimi-mark.png'), bg: WHITE, glow: '#1783FF', fit: 0.52},
  huggingface: {mask: g('si-huggingface.svg'), color: '#FFD21E', bg: DARK, glow: '#FFD21E', fit: 0.66},
  chatgpt: {mask: g('si-openai.svg'), color: '#FFFFFF', bg: DARK, glow: GLOW.electric, fit: 0.6},
  googleAnalytics: {mask: g('si-googleanalytics.svg'), color: '#F9AB00', bg: DARK, glow: '#F9AB00', fit: 0.58},
  playwright: {src: g('playwright.svg'), bg: DARK, glow: '#45BA4B', fit: 0.72},
  github: {mask: g('si-github.svg'), color: '#FFFFFF', bg: DARK, glow: GLOW.electric, fit: 0.6},
  claudeDuet: {src: g('claude-duet-icon.svg'), bg: '#FAFAF8', glow: '#FF8A5B', fit: 1},
  gmail: {src: g('gmail.svg'), bg: WHITE, glow: '#EA4335', fit: 0.6},
  youtube: {mask: g('si-youtube.svg'), color: '#FF0000', bg: WHITE, glow: '#FF2D2D', fit: 0.64},
  remotion: {src: g('remotion.png'), bg: DARK, glow: '#0B84F3', fit: 0.64},
  scrapegraph: {src: g('scrapegraphai.svg'), bg: WHITE, glow: '#AC6DFF', fit: 0.64},
  aiText: {text: 'AI', color: '#FFFFFF', bg: `linear-gradient(160deg, ${GLOW.pillTop} 0%, #0B3FB0 100%)`, glow: GLOW.electric},
  champ: {src: g('champ-mark.png'), bg: WHITE, glow: '#B44FD0', fit: 0.66},
  dubaiChamber: {src: g('dubai-chamber-digital-white.png'), bg: 'linear-gradient(160deg, #13235C 0%, #0A1230 100%)', glow: GLOW.electric, fit: 0.72},
  typeText: {text: 'Aa', color: '#FFFFFF', bg: DARK, glow: '#A78BFA'},
} satisfies Record<string, GlowLogo>;

export type GlowJob = {job: string; date: string; title: string; cover: GlowCoverProps};
const c = (line1: string, line2: string, leftLogo: GlowLogo, rightLogo: GlowLogo): GlowCoverProps => ({variant: 'glow', line1, line2, leftLogo, rightLogo});

export const glowJobs: GlowJob[] = [
  {job: 'd24ed130c3d9', date: 'queued', title: 'Dubai AI Agents Championship', cover: c('$150,000', 'For 1 AI Agent', LOGO.champ, LOGO.dubaiChamber)},
  {job: 'd61788123d13', date: '2026-10-27', title: 'NVIDIA SkillSpector', cover: c('NVIDIA Scanner', 'For Bad Skills', LOGO.nvidia, LOGO.claude)},
  {job: 'c6e60a58849b', date: '2026-10-26 12:00', title: 'Kimi K3 on 8 GB RAM', cover: c('2.78T AI Model', 'On 8 GB RAM', LOGO.kimi, LOGO.huggingface)},
  {job: 'b55491077ab1', date: '2026-10-26 09:00', title: 'AI traffic in GA4', cover: c('AI Visitors', 'Worth 4.4x More?', LOGO.chatgpt, LOGO.googleAnalytics)},
  {job: 'website20261020', date: '2026-10-25', title: 'AI website design brief', cover: c('AI Website', 'Looks Generic?', LOGO.aiText, LOGO.typeText)},
  {job: '7123480a28ca', date: '2026-10-24', title: 'Claude + Playwright job search', cover: c('AI Job Search', 'With Playwright', LOGO.claude, LOGO.playwright)},
  {job: 'c9d9bd2b786c', date: '2026-10-23', title: '85 AI engineering projects', cover: c('85 AI Projects', 'To Build Next', LOGO.github, LOGO.huggingface)},
  {job: '955ed21d2fc4', date: '2026-10-23 23:30', title: 'Claude Duet', cover: c('Claude Duet', 'Pings You First', LOGO.claudeDuet, LOGO.gmail)},
  {job: 'fa00b63b4fa2', date: '2026-10-23 18:00', title: 'YouTube skill pack tested', cover: c('YouTube Skills', 'Tested For Real', LOGO.claude, LOGO.youtube)},
  {job: 'motion20261020', date: '2026-10-21', title: 'AI Motion Starter Kit', cover: c('AI Motion', 'Starter Kit', LOGO.claude, LOGO.remotion)},
  {job: 'f7da978d101e', date: '2026-10-18 05:54', title: 'Daily lead finder', cover: c('Free Leads', 'Every Morning', LOGO.chatgpt, LOGO.scrapegraph)},
  {job: '9d2d68af60d4', date: '2026-10-18 02:00', title: 'Claude YouTube Agent Skill', cover: c('11 Free Skills', 'For YouTube', LOGO.youtube, LOGO.claude)},
  {job: '09a9d211fff0', date: '2026-10-17 22:06', title: 'REA reverse-engineering', cover: c('Claude Code', 'Takes Apps Apart', LOGO.claude, LOGO.github)},
];
