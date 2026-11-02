import type {GlowCoverProps, GlowLogo} from '../brand/GlowCover';
import {LOGO} from '../brand/glowCovers';

// Glow-template cover options for the Claude 2.0 reel (owner's fixed template: same pose, navy glow, white line 1,
// blue pill line 2, two glowing tiles). Hooks checked against lesson.json sources: 3 models in 6 weeks (Sep 22 -
// Oct 7), Sonnet 5.5 $2/$10 vs Opus 5.5 $4/$20 per MTok.
const v55: GlowLogo = {text: '5.5', color: '#FFFFFF', bg: 'linear-gradient(160deg, #3D7BFF 0%, #0B3FB0 100%)', glow: '#3D7BFF'};
const half: GlowLogo = {text: '½', color: '#1A1200', bg: 'linear-gradient(160deg, #FFD95A 0%, #E0A800 100%)', glow: '#FFD166'};
const c = (line1: string, line2: string, leftLogo: GlowLogo, rightLogo: GlowLogo): GlowCoverProps => ({variant: 'glow', line1, line2, leftLogo, rightLogo});

export const covers: GlowCoverProps[] = [
  c('Which Claude?', 'Opus vs Sonnet', LOGO.claude, LOGO.anthropic),   // = glowCovers.ts entry
  c('6 Weeks Of', 'Claude Updates', LOGO.claude, v55),
  c('Same Work', 'Half The Price', LOGO.claude, half),
];
