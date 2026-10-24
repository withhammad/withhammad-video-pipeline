import React, {useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {fontsReady} from './fonts';
import {ACCENT, AccentName, COLOR, FONT, RADIUS, SHADOW} from './tokens';

/** One line of text at `size`, shrunk (never grown) after the fonts load so its box is at most `maxWidth` wide. */
export const FitLine: React.FC<{size: number; maxWidth: number; style?: React.CSSProperties; boxStyle?: React.CSSProperties;
  children: React.ReactNode}> = ({size, maxWidth, style, boxStyle, children}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  const [handle] = useState(() => delayRender('brand fit'));
  useLayoutEffect(() => {
    let live = true;
    fontsReady.then(() => {
      if (!live) return;
      const w = ref.current ? ref.current.getBoundingClientRect().width : 0;
      if (w > maxWidth) setK(maxWidth / w);
      continueRender(handle);
    });
    return () => { live = false; };
  }, [handle, maxWidth]);
  return <div ref={ref} style={{display: 'inline-block', whiteSpace: 'nowrap', ...boxStyle, fontSize: size * k}}>
    <span style={style}>{children}</span></div>;
};

export type HookLook = 'plain' | 'box' | 'accent';

/** A cover hook line. `plain`: white with shadow (Skill line 1). `box`: dark box (Kimi line 1).
 *  `accent`: the punch box in the accent colour. `accentWord` boxes only that substring of a plain line. */
export const HookLine: React.FC<{text: string; look: HookLook; size: number; accent: AccentName; maxWidth: number;
  rounded: boolean; accentWord?: string}> = ({text, look, size, accent, maxWidth, rounded, accentWord}) => {
  const font: React.CSSProperties = {fontFamily: FONT.sans, fontWeight: 900, letterSpacing: -2, color: COLOR.white, lineHeight: 1.18};
  const bg = look === 'box' ? COLOR.boxDark : look === 'accent' ? ACCENT[accent] : undefined;
  const radius = rounded ? RADIUS.box : 0;
  if (look === 'plain' && accentWord && text.includes(accentWord)) {
    const [a, b] = [text.slice(0, text.indexOf(accentWord)), text.slice(text.indexOf(accentWord) + accentWord.length)];
    return <FitLine size={size} maxWidth={maxWidth} boxStyle={font}>
      <span style={{textShadow: SHADOW.text}}>{a}</span>
      <span style={{background: ACCENT[accent], borderRadius: radius, padding: '0 .16em', margin: '0 .04em'}}>{accentWord}</span>
      <span style={{textShadow: SHADOW.text}}>{b}</span></FitLine>;
  }
  return <FitLine size={size} maxWidth={maxWidth} boxStyle={{...font, background: bg, borderRadius: bg ? radius : 0,
    padding: bg ? (rounded ? '.03em .29em' : '.09em .22em') : 0, textShadow: bg ? 'none' : SHADOW.text}}>{text}</FitLine>;
};
