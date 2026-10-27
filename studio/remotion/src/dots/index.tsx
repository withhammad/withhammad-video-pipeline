import React from 'react';
import {Composition, registerRoot, staticFile} from 'remotion';
import {DotsReel, DotsTall, FPS, END_S, W, H} from './Reel';
import {GlowCover} from '../brand/GlowCover';
import {GlowWide} from '../brand/GlowWide';
import {LOGO} from '../brand/glowCovers';

// Glow-template cover (owner rule 2026-10-24): OpenAI mark + Jojo, OpenAI's own dot character.
const cover = {variant: 'glow' as const, line1: 'OpenAI Agents', line2: 'That Never Sleep', leftLogo: LOGO.chatgpt,
  rightLogo: {src: staticFile('dots/jojo_heart.png'), bg: 'linear-gradient(160deg, #161D31 0%, #070B16 100%)', glow: '#FF3FB4', fit: 0.78}};

export const DotsRoot: React.FC = () => <>
  <Composition id="DotsReel" component={DotsReel} durationInFrames={Math.round(END_S * FPS)} fps={FPS} width={W} height={H}/>
  <Composition id="DotsTall" component={DotsTall} durationInFrames={Math.round(END_S * FPS)} fps={FPS} width={1080} height={1920}/>
  <Composition id="DotsCover" component={() => <GlowCover {...cover}/>} durationInFrames={1} fps={FPS} width={1080} height={1920}/>
  <Composition id="DotsCoverGuides" component={() => <GlowCover {...cover} guides/>} durationInFrames={1} fps={FPS} width={1080} height={1920}/>
  <Composition id="DotsCoverWide" component={() => <GlowWide {...cover}/>} durationInFrames={1} fps={FPS} width={1280} height={720}/>
</>;
registerRoot(DotsRoot);
