// Shared look for the "edit videos with Claude Code" infographic posts (batch 2026-10-27, G2).
import React from 'react';
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const fontsReady = Promise.all([
  loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'}),
  loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'}),
  loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'}),
  loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'}),
  loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'}),
  loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-400-normal.woff2'), weight: '400'}),
  loadFont({family: 'JetBrains Mono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'}),
  loadFont({family: 'JetBrains Mono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'}),
]);

export const SANS = 'Inter, sans-serif';
export const MONO = '"JetBrains Mono", monospace';
export const INK = '#16181d';
export const MUTED = '#5d6370';
export const BLUE = '#1f6bff';

// Monochrome Simple Icons drawn in the brand colour through a mask.
export const Logo: React.FC<{name: string; color: string; size: number; style?: React.CSSProperties}> = ({name, color, size, style}) => (
  <div style={{width: size, height: size, flexShrink: 0, backgroundColor: color,
    WebkitMaskImage: `url(${staticFile(`edit-guide/${name}.svg`)})`, WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', ...style}}/>
);

export const BRAND: Record<string, string> = {
  'si-claude': '#D97757', 'si-homebrew': '#E89B1E', 'si-ffmpeg': '#007808', 'si-python': '#3776AB',
  'si-nodedotjs': '#5FA04E', 'si-npm': '#CB3837', 'si-opencv': '#5C3EE8', 'si-openai': '#111111',
};

// Light squared paper behind everything.
export const GridPaper: React.FC<{step?: number}> = ({step = 40}) => (
  <div style={{position: 'absolute', inset: 0, backgroundColor: '#f7f8fb',
    backgroundImage: `linear-gradient(#e9ebf1 1.5px, transparent 1.5px), linear-gradient(90deg, #e9ebf1 1.5px, transparent 1.5px)`,
    backgroundSize: `${step}px ${step}px`}}/>
);

// Faded Claude starburst in a corner, like the reference.
export const Burst: React.FC<{x: number; y: number; size: number; opacity?: number}> = ({x, y, size, opacity = 0.18}) => (
  <Logo name="si-claude" color="#E8825F" size={size} style={{position: 'absolute', left: x, top: y, opacity}}/>
);
