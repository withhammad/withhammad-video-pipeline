import {staticFile} from 'remotion';
import type {ReelCoverProps} from '../brand/ReelCover';
import type {SlideData} from '../brand/Carousel';

// Covers and carousel for the AI-traffic reel, built only from the locked brand system (src/brand, read-only).
// Spec cover idea: hook 'AI TRAFFIC CONVERTS' / '4.4x BETTER?', strongest-emotion frame, ChatGPT tile.
// Faces: take frames 2.5 s (open-mouth surprise), 15.0 s (big smile), 11.0 s (raised brows), cut out with RVM.
const a = (s: string) => staticFile('aitraffic/' + s);
const chatgpt = {slot: 'right' as const, tile: {src: a('chatgpt-tile.svg')}};

export const covers: ReelCoverProps[] = [
  {variant: 'dark', face: {cut: a('cover_cut1.png'), scale: 0.62, top: 360}, line1: 'AI TRAFFIC CONVERTS', line2: '4.4x BETTER?', accent: 'red',
    logos: [chatgpt]},
  {variant: 'card', background: a('cover_face2.png'), face: {cut: a('cover_cut2.png'), full: a('cover_face2.png'), scale: 0.78, top: 603}, cardTop: 1020,
    line1: 'AI TRAFFIC CONVERTS', line2: '4.4x BETTER?', accent: 'orange', logos: [{slot: 'right', tile: {src: a('chatgpt-tile.svg')}, x: 828, y: 800, size: 200, rotate: 10}]},
  {variant: 'dark', face: {cut: a('cover_cut3.png'), scale: 0.62, top: 360}, line1: 'AI TRAFFIC CONVERTS', line2: '4.4x BETTER?', accent: 'red',
    logos: [{slot: 'left', tile: {src: a('claude-tile.png')}}, chatgpt]},
];

const end = {kind: 'end' as const, headline: 'Want my setup guide?', keyword: 'AITRAFFIC', link: 'withhammad.com/resources/ai\u2011traffic\u2011ga4',  // non-breaking hyphens: the line breaks at the slash
  face: a('cover_cut2.png'), faceFrame: {width: 560, left: -90, top: -60}};

const body: SlideData[] = [
  {kind: 'cover', cover: covers[0], offset: 230},
  {kind: 'stat', kicker: 'One Semrush study · Jul 2025', value: '4.4x', label: 'AI search visitors vs *organic*',
    sub: 'Measured on conversion rate. Other studies land anywhere from about 1.3x to 23x.', source: 'semrush.com/blog/ai-search-seo-traffic-study'},
  {kind: 'logos', kicker: 'Why it converts', title: 'Buyers research *in the chat*',
    logos: [{tile: {src: a('chatgpt-tile.svg')}, label: 'ChatGPT'}, {tile: {src: a('claude-tile.png')}, label: 'Claude'}, {src: a('gemini-icon.svg'), w: 200, label: 'Gemini'}],
    note: 'They compare options before they click, so they land further down your funnel.'},
  {kind: 'compare', title: 'Not all traffic is *equal*', before: {label: 'Organic search', name: 'scrolling results', value: '1x', verdict: 'BROWSING', tone: 'dim'},
    after: {label: 'AI assistant', name: 'researched first', value: '4.4x', verdict: 'FURTHER DOWN', tone: 'good'},
    note: 'One Semrush study, by conversion rate. Your own numbers will differ.'},
  {kind: 'step', n: 1, of: 3, title: 'Check your *AI visibility*', body: 'Ask ChatGPT, Claude and Gemini the question your customer would ask.',
    chips: [{text: 'Are you mentioned?', tone: 'plain'}, {text: 'Described right?', tone: 'plain'}, {text: 'Linked correctly?', tone: 'plain'}]},
  {kind: 'step', n: 2, of: 3, title: 'Ask *where they found you*', body: 'Add an optional "Where did you hear about us?" field to your enquiry form, with an AI option.',
    chips: [{text: 'Google search', tone: 'dim'}, {text: 'Instagram', tone: 'dim'}, {text: 'AI assistant (ChatGPT, Claude...)', tone: 'good'}]},
  {kind: 'logos', kicker: 'Google Analytics 4 · May 2026', title: 'AI Assistant is a *default channel*',
    logos: [{src: a('ga-card.svg'), w: 560, label: 'Default channel group'}],
    note: 'It covers ChatGPT, Gemini, Copilot, Deepseek and Grok. Google AI Overviews stay in Organic Search.'},
  {kind: 'step', n: 3, of: 3, title: 'Split them out and *compare*', body: 'Add claude.ai and perplexity.ai in a custom channel group, above Referral. Then compare conversions by channel.',
    chips: [{text: 'AI Assistant', tone: 'good'}, {text: 'Organic Search', tone: 'plain'}, {text: 'Direct (watch it)', tone: 'warn'}]},
  {kind: 'quote', quote: 'Trust your own numbers over any one stat.',
    by: 'Many AI clicks arrive without a referrer and land as Direct, so AI traffic is undercounted.'},
];

export const carousel: Record<'instagram' | 'linkedin', SlideData[]> = {
  instagram: [...body, {...end, sub: 'I\'ll DM you the GA4 channel, form field and test prompts.'}],
  linkedin: [...body, {...end, keyword: undefined, headline: 'Get the setup guide', sub: 'GA4 channel, form field and test prompts, step by step.'}],
};
