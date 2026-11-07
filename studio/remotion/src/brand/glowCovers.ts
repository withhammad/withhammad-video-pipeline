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
  anthropic: {mask: g('si-anthropic.svg'), color: '#F0EEE6', bg: 'linear-gradient(160deg, #2A2724 0%, #141210 100%)', glow: '#E8C9A8', fit: 0.6},
  claudeDuet: {src: g('claude-duet-icon.svg'), bg: '#FAFAF8', glow: '#FF8A5B', fit: 1},
  gmail: {src: g('gmail.svg'), bg: WHITE, glow: '#EA4335', fit: 0.6},
  youtube: {mask: g('si-youtube.svg'), color: '#FF0000', bg: WHITE, glow: '#FF2D2D', fit: 0.64},
  remotion: {src: g('remotion.png'), bg: DARK, glow: '#0B84F3', fit: 0.64},
  scrapegraph: {src: g('scrapegraphai.svg'), bg: WHITE, glow: '#AC6DFF', fit: 0.64},
  aiText: {text: 'AI', color: '#FFFFFF', bg: `linear-gradient(160deg, ${GLOW.pillTop} 0%, #0B3FB0 100%)`, glow: GLOW.electric},
  champ: {src: g('champ-mark.png'), bg: WHITE, glow: '#B44FD0', fit: 0.66},
  dubaiChamber: {src: g('dubai-chamber-digital-white.png'), bg: 'linear-gradient(160deg, #13235C 0%, #0A1230 100%)', glow: GLOW.electric, fit: 0.72},
  linkedinText: {text: 'in', color: '#FFFFFF', bg: 'linear-gradient(160deg, #1B8AE8 0%, #0A66C2 100%)', glow: '#2E9BFF'},
  typeText: {text: 'Aa', color: '#FFFFFF', bg: DARK, glow: '#A78BFA'},
  palantir: {mask: g('si-palantir.svg'), color: '#FFFFFF', bg: DARK, glow: '#9DB7FF', fit: 0.62},
  google: {mask: g('si-google.svg'), color: '#4285F4', bg: WHITE, glow: '#4285F4', fit: 0.6},
  supabase: {mask: g('si-supabase.svg'), color: '#3FCF8E', bg: DARK, glow: '#3FCF8E', fit: 0.6},
  mcp: {mask: g('si-modelcontextprotocol.svg'), color: '#FFFFFF', bg: DARK, glow: GLOW.electric, fit: 0.6},
  openaiDots: {mask: g('openai-dots-o.svg'), color: '#FFFFFF', bg: DARK, glow: '#BAC1D3', fit: 0.56},
  uaeText: {text: 'UAE', color: '#FFFFFF', bg: 'linear-gradient(160deg, #1FA85A 0%, #00843D 100%)', glow: '#2BD67B'},
  hundredText: {text: '100', color: '#1A1200', bg: 'linear-gradient(160deg, #FFD95A 0%, #E0A800 100%)', glow: '#FFD166'},
  a2aText: {text: 'A2A', color: '#FFFFFF', bg: 'linear-gradient(160deg, #6D5DF6 0%, #3B2DB8 100%)', glow: '#8B7CFF'},
  csvText: {text: 'CSV', color: '#FFFFFF', bg: 'linear-gradient(160deg, #2EA86B 0%, #1B6E46 100%)', glow: '#3FD68A'},
  oneText: {text: '1', color: '#FFFFFF', bg: 'linear-gradient(160deg, #2ECC71 0%, #178F4C 100%)', glow: '#3DF08A'},
  threejs: {mask: g('si-threedotjs.svg'), color: '#FFFFFF', bg: DARK, glow: '#7AA2FF', fit: 0.6},
  blender: {mask: g('si-blender.svg'), color: '#EA7600', bg: WHITE, glow: '#F5792A', fit: 0.66},
  twentyFourText: {text: '24', color: '#FFFFFF', bg: 'linear-gradient(160deg, #FF5F5F 0%, #C81E1E 100%)', glow: '#FF4D4D'},
} satisfies Record<string, GlowLogo>;

export type GlowJob = {job: string; date: string; title: string; cover: GlowCoverProps};
const c = (line1: string, line2: string, leftLogo: GlowLogo, rightLogo: GlowLogo): GlowCoverProps => ({variant: 'glow', line1, line2, leftLogo, rightLogo});

export const glowJobs: GlowJob[] = [
  {job: 'd463f2086d47', date: 'awaiting approval', title: 'Jobs not on LinkedIn: one Google search of Lever, Ashby and Greenhouse boards, Claude shortlists every morning (3D dialogue)', cover: c('40 Jobs', 'I Never Saw', LOGO.google, LOGO.claude)},
  {job: '33d9c1e97156', date: 'awaiting approval', title: 'Get a referral with Claude: 200 applications, 0 interviews (LinkedIn skit)', cover: c('200 Applied.', '0 Interviews', LOGO.linkedinText, LOGO.claude)},
  {job: '3f33678db749', date: 'awaiting approval', title: 'Blender Skills: 94 free skills that let Claude Code build 3D in Blender', cover: c('94 Free Skills', 'Claude + Blender', LOGO.claude, LOGO.blender)},
  {job: '85fb47b66b4b', date: 'awaiting approval', title: 'Claude made these 3D voxel reels: script, two voices, Three.js code, laptop render', cover: c('Claude Made', 'These 3D Reels', LOGO.claude, LOGO.threejs)},
  {job: '990543b928c4', date: 'awaiting approval', title: '10 Claude animation styles: one paper plane, ten worlds, all drawn in code', cover: c('10 Art Styles', 'Drawn In Code', LOGO.claude, LOGO.remotion)},
  {job: '6a48be151b7a', date: 'awaiting approval', title: '10 Claude animation styles, one prompt each', cover: c('10 Animation', 'Styles In Claude', LOGO.claude, {text: '10', color: '#FFFFFF', bg: 'linear-gradient(160deg, #3A3F55 0%, #12141F 100%)', glow: '#FF8A5B'})},
  {job: 'b95794dc72cf', date: 'awaiting approval', title: 'Lemo-Opuscar: Claude Code makes short films in 66 styles, no video model', cover: c('Short Films', 'No Video Model', LOGO.claude, LOGO.github)},
  {job: '2af4ebc1b07a', date: 'awaiting approval', title: 'The AI productivity paradox: more done than ever, lazier than ever (mood meme)', cover: c('More Done.', 'Lazier Than Ever', LOGO.aiText, LOGO.claude)},
  {job: 'cd157c0bece4', date: 'awaiting approval', title: 'Which Claude model to use: Opus 5.5 vs Sonnet 5.5 (Claude 2.0, concept 1 of 25)', cover: c('Which Claude?', 'Opus vs Sonnet', LOGO.claude, LOGO.anthropic)},
  {job: '23519e29c243', date: 'awaiting approval', title: 'Roast Room: 7 AI advisors debate your decision in Claude Code', cover: c('7 AI Advisors', 'Roasted My Idea', LOGO.claude, LOGO.github)},
  {job: 'dbedc134cc10', date: 'awaiting approval', title: 'Make it better x10: Sonnet 5.5 vs Opus 5.5', cover: c('Make It Better', 'Opus Overdid It', LOGO.claude, LOGO.anthropic)},
  {job: 'dots-20261027', date: 'queued', title: 'OpenAI dots: agents that keep working after you log off', cover: c('OpenAI dots', 'Never Logs Off', LOGO.chatgpt, LOGO.openaiDots)},
  {job: 'harness-engineering', date: 'queued', title: 'Harness engineering: the layer that makes an agent reliable', cover: c('Agent Failing?', 'Not The Model', LOGO.claude, LOGO.mcp)},
  {job: 'agentic-concepts', date: 'queued', title: '9 agentic AI concepts every builder should know', cover: c('9 Concepts', 'Behind AI Agents', LOGO.mcp, LOGO.a2aText)},
  {job: 'agent-loop', date: 'queued', title: 'How an AI agent works: one loop inside a harness', cover: c('Every AI Agent', 'Is 1 Loop', LOGO.claude, LOGO.mcp)},
  {job: '6cff0a62569f', date: 'queued', title: 'Forward Deployed Engineer: a free 6-week roadmap', cover: c('6-Week Roadmap', 'To AI Engineer', LOGO.palantir, LOGO.google)},
  {job: '6f8f4ad316a3', date: 'queued', title: 'What an AI startup really costs: the 14-tool stack', cover: c('14-Tool Stack', 'For $21 A Month', LOGO.claude, LOGO.supabase)},
  {job: '91ac50635d3d', date: 'queued', title: 'UAE 100 Dreams: USD 10,000 for 100 media ideas', cover: c('$10,000', 'For 1 Idea', LOGO.uaeText, LOGO.hundredText)},
  {job: 'comedy20261023', date: 'queued', title: 'One word. 24 files? (AI coding skit)', cover: c('1 Word Changed', '24 Files Broke', LOGO.oneText, LOGO.twentyFourText)},
  {job: 'audit20261020', date: 'queued', title: 'AI dashboard audit: the duplicate order trap', cover: c('$3,000 Error', 'From 1 Duplicate', LOGO.csvText, LOGO.aiText)},
  {job: 'claude-linkedin-installs', date: '2026-10-27', title: '27 free Claude installs for LinkedIn', cover: c('27 Free Installs', 'Claude + LinkedIn', LOGO.claude, LOGO.linkedinText)},
  {job: 'applemotion20261027', date: 'queued', title: 'Claude Motion: 16 Apple-style animations', cover: c('Claude Motion', 'Apple-Style UI', LOGO.claude,
    {text: '16', color: '#FFFFFF', bg: 'linear-gradient(160deg, #3D9BFF 0%, #0062D6 100%)', glow: '#0A84FF'})},
  {job: 'anatomy20261027', date: 'queued', title: 'The 8 parts of a Claude Motion prompt', cover: c('Claude Motion', '8-Part Prompt', LOGO.claude,
    {text: '8', color: '#FFFFFF', bg: 'linear-gradient(160deg, #FF9A4D 0%, #E8590C 100%)', glow: '#FF8A3D'})},
  {job: 'fef5b7f3b5af', date: 'queued', title: 'Claude Code motion graphics (BRAND)', cover: c('16 Animations', 'In Claude Code', LOGO.claude, LOGO.typeText)},
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
